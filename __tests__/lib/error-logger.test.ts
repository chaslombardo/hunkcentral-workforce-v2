import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logServerError, logAuthError, logDatabaseError, logPageError, createErrorResponse } from '@/lib/errorLogger';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
    },
  },
}));

// Mock console methods
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('Error Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockClear();
  });

  describe('logServerError', () => {
    it('should log error with comprehensive context in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');
      const context = {
        component: 'test_component',
        action: 'test_action',
        userId: 'user123',
        url: '/test',
        userAgent: 'test-agent',
        additionalData: { key: 'value' },
      };

      await logServerError(error, context);

      expect(consoleSpy).toHaveBeenCalledWith('Server Error:', expect.objectContaining({
        message: 'Test error',
        component: 'test_component',
        action: 'test_action',
        userId: 'user123',
        url: '/test',
        stack: expect.any(String),
      }));

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle non-Error objects', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const context = {
        component: 'test_component',
        action: 'test_action',
        url: '/test',
      };

      await logServerError('String error', context);

      expect(consoleSpy).toHaveBeenCalledWith('Server Error:', expect.objectContaining({
        message: 'String error',
        component: 'test_component',
        action: 'test_action',
        url: '/test',
        stack: undefined,
      }));

      process.env.NODE_ENV = originalEnv;
    });

    it('should not throw if logging fails', async () => {
      const error = new Error('Test error');
      const context = {
        component: 'test_component',
        action: 'test_action',
        url: '/test',
      };

      // This should not throw even if there are internal errors
      await expect(logServerError(error, context)).resolves.toBeUndefined();
    });
  });

  describe('logAuthError', () => {
    it('should log authentication errors with specific context', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Auth failed');
      const context = {
        action: 'login' as const,
        userId: 'user123',
        url: '/auth/login',
        userAgent: 'test-agent',
        additionalData: { attempt: 1 },
      };

      await logAuthError(error, context);

      expect(consoleSpy).toHaveBeenCalledWith('Server Error:', expect.objectContaining({
        message: 'Auth failed',
        component: 'authentication',
        action: 'login',
        userId: 'user123',
        url: '/auth/login',
      }));

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle permission check actions', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Permission denied');
      const context = {
        action: 'permission_check' as const,
        userId: 'user123',
        url: '/logs/create',
        additionalData: { requiredRole: 'captain' },
      };

      await logAuthError(error, context);

      expect(consoleSpy).toHaveBeenCalledWith('Server Error:', expect.objectContaining({
        message: 'Permission denied',
        component: 'authentication',
        action: 'permission_check',
      }));

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('logDatabaseError', () => {
    it('should log database errors with operation context', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Connection timeout');
      const context = {
        operation: 'select',
        table: 'daily_logs',
        userId: 'user123',
        url: '/logs',
        additionalData: { query: 'SELECT * FROM daily_logs' },
      };

      await logDatabaseError(error, context);

      expect(consoleSpy).toHaveBeenCalledWith('Server Error:', expect.objectContaining({
        message: 'Connection timeout',
        component: 'database',
        action: 'select',
        userId: 'user123',
        url: '/logs',
      }));

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('logPageError', () => {
    it('should log page rendering errors with page context', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Render failed');
      const context = {
        page: 'logs',
        userId: 'user123',
        url: '/logs',
        userAgent: 'test-agent',
        additionalData: { hasSession: true },
      };

      await logPageError(error, context);

      expect(consoleSpy).toHaveBeenCalledWith('Server Error:', expect.objectContaining({
        message: 'Render failed',
        component: 'page_render',
        action: 'render_logs',
        userId: 'user123',
        url: '/logs',
      }));

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('createErrorResponse', () => {
    it('should create standardized error response in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Detailed error message');
      const context = {
        component: 'api',
        action: 'create_log',
        userId: 'user123',
      };

      const response = createErrorResponse(error, context);

      expect(response).toEqual({
        error: 'server_error',
        message: 'Detailed error message',
        timestamp: expect.any(Number),
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should create generic error response in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Detailed error message');
      const context = {
        component: 'api',
        action: 'create_log',
        userId: 'user123',
      };

      const response = createErrorResponse(error, context);

      expect(response).toEqual({
        error: 'server_error',
        message: 'An unexpected error occurred',
        timestamp: expect.any(Number),
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle non-Error objects', () => {
      const context = {
        component: 'api',
        action: 'create_log',
      };

      const response = createErrorResponse('String error', context);

      expect(response).toEqual({
        error: 'server_error',
        message: 'An unexpected error occurred',
        timestamp: expect.any(Number),
      });
    });
  });
});