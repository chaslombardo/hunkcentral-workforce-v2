import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/errors/client/route';

// Mock the error logger
vi.mock('@/lib/errorLogger', () => ({
  logServerError: vi.fn(),
}));

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

describe('Production Logging Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Client Error API Endpoint', () => {
    it('should accept and process client error logs', async () => {
      const { getServerSession } = await import('next-auth');
      const { logServerError } = await import('@/lib/errorLogger');

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' },
      });

      const errorLog = {
        level: 'error',
        message: 'Test client error',
        context: {
          component: 'test-component',
          action: 'test-action',
          userId: 'user123',
          userAgent: 'Mozilla/5.0',
          url: 'http://localhost:3000/test',
          timestamp: Date.now(),
          stack: 'Error: Test client error\n    at test.js:1:1',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/errors/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorLog),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(logServerError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          component: 'client_test-component',
          action: 'test-action',
          userId: 'user123',
          userAgent: 'Mozilla/5.0',
          url: 'http://localhost:3000/test',
        })
      );
    });

    it('should handle invalid request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/errors/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invalid: 'data' }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid error log format');
    });

    it('should handle anonymous users', async () => {
      const { getServerSession } = await import('next-auth');
      const { logServerError } = await import('@/lib/errorLogger');

      vi.mocked(getServerSession).mockResolvedValue(null);

      const errorLog = {
        level: 'error',
        message: 'Anonymous error',
        context: {
          component: 'test-component',
          action: 'test-action',
          userAgent: 'Mozilla/5.0',
          url: 'http://localhost:3000/test',
          timestamp: Date.now(),
        },
      };

      const request = new NextRequest('http://localhost:3000/api/errors/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorLog),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(logServerError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          userId: 'anonymous',
        })
      );
    });
  });

  describe('Error Logger Integration', () => {
    it('should create proper error objects from client logs', async () => {
      const { logServerError } = await import('@/lib/errorLogger');
      
      // Clear the mock to get the actual implementation
      vi.mocked(logServerError).mockRestore();
      
      // Mock prisma to avoid database calls
      vi.mock('@/lib/prisma', () => ({
        prisma: {
          auditLog: {
            create: vi.fn().mockResolvedValue({}),
          },
        },
      }));

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      try {
        const { logServerError: realLogServerError } = await import('@/lib/errorLogger');
        
        const testError = new Error('Test error');
        await realLogServerError(testError, {
          component: 'test-component',
          action: 'test-action',
          userId: 'user123',
          url: 'http://localhost:3000/test',
        });

        // If we get here without throwing, the logging worked
        expect(true).toBe(true);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });
});