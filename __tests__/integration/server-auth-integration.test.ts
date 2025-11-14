import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateServerSession, requireServerAuth } from '@/lib/server-auth';
import { logAuthError } from '@/lib/errorLogger';

// Mock dependencies
vi.mock('@/lib/errorLogger');
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

const mockLogAuthError = vi.mocked(logAuthError);

describe('Server Authentication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateServerSession', () => {
    it('should handle authentication errors with proper logging', async () => {
      const { getServerSession } = await import('next-auth/next');
      vi.mocked(getServerSession).mockRejectedValue(
        new Error('Database connection failed')
      );

      const mockRequest = {
        url: 'http://localhost:3000/admin',
        headers: {
          get: vi.fn().mockReturnValue('test-user-agent'),
        },
      } as any;

      const result = await validateServerSession(mockRequest, {
        requireAuth: true,
        redirectOnFailure: true,
      });

      expect(result.isValid).toBe(false);
      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectUrl).toBe('/auth/login?error=session_error');
      expect(mockLogAuthError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          action: 'session_validation',
          url: 'http://localhost:3000/admin',
          userAgent: 'test-user-agent',
        })
      );
    });

    it('should validate user existence in database', async () => {
      const mockSession = {
        user: {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User',
          roles: ['captain'],
        },
      };

      const { getServerSession } = await import('next-auth/next');
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const { prisma } = await import('@/lib/prisma');
      // Mock user not found in database
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await validateServerSession(undefined, {
        requireAuth: true,
        redirectOnFailure: true,
      });

      expect(result.isValid).toBe(false);
      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectUrl).toBe('/auth/login?error=invalid_session');
      expect(mockLogAuthError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          action: 'session_validation',
          userId: '1',
          additionalData: expect.objectContaining({
            sessionEmail: 'test@example.com',
          }),
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      const mockSession = {
        user: {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User',
          roles: ['captain'],
        },
      };

      const { getServerSession } = await import('next-auth/next');
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const { prisma } = await import('@/lib/prisma');
      // Mock database error
      vi.mocked(prisma.user.findUnique).mockRejectedValue(
        new Error('Database timeout')
      );

      const result = await validateServerSession();

      // Should gracefully degrade and return session user
      expect(result.isValid).toBe(true);
      expect(result.user).toEqual(
        expect.objectContaining({
          id: '1',
          email: 'test@example.com',
        })
      );
      expect(mockLogAuthError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          action: 'session_validation',
          userId: '1',
          additionalData: expect.objectContaining({
            error: 'database_check_failed',
          }),
        })
      );
    });
  });

  describe('requireServerAuth', () => {
    it('should throw error when authentication fails', async () => {
      const { getServerSession } = await import('next-auth/next');
      vi.mocked(getServerSession).mockResolvedValue(null);

      await expect(requireServerAuth()).rejects.toThrow(
        'Authentication required'
      );
      expect(mockLogAuthError).toHaveBeenCalled();
    });

    it('should return user when authentication succeeds', async () => {
      const mockSession = {
        user: {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User',
          roles: ['admin'],
        },
      };

      const { getServerSession } = await import('next-auth/next');
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['admin'],
      } as any);

      const user = await requireServerAuth(undefined, {
        requiredRoles: ['admin'],
      });

      expect(user).toEqual(
        expect.objectContaining({
          id: '1',
          email: 'test@example.com',
          roles: ['admin'],
        })
      );
    });
  });

  describe('Error Context Logging', () => {
    it('should log comprehensive error context', async () => {
      const { getServerSession } = await import('next-auth/next');
      vi.mocked(getServerSession).mockResolvedValue(null);

      const mockRequest = {
        url: 'http://localhost:3000/reports/payroll',
        headers: {
          get: vi
            .fn()
            .mockReturnValueOnce('Mozilla/5.0 (test browser)')
            .mockReturnValue(null),
        },
      } as any;

      await validateServerSession(mockRequest, {
        requireAuth: true,
        requiredRoles: ['manager'],
      });

      expect(mockLogAuthError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          action: 'session_validation',
          url: 'http://localhost:3000/reports/payroll',
          userAgent: 'Mozilla/5.0 (test browser)',
          additionalData: expect.objectContaining({
            requireAuth: true,
            requiredRoles: ['manager'],
          }),
        })
      );
    });
  });
});
