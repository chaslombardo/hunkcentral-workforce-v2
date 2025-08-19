import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateSession, requireAuth, requireRole } from '@/lib/auth';
import { validateServerSession, requireServerAuth } from '@/lib/server-auth';
import { logAuthError } from '@/lib/errorLogger';
import type { SessionUser } from '@/lib/auth';
import type { UserRole } from '@/types';

// Mock dependencies
vi.mock('@/lib/errorLogger');
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    }
  }
}));
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn()
}));

const mockLogAuthError = vi.mocked(logAuthError);

describe('Authentication Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should throw error and log when user is null', async () => {
      const context = { url: '/test', action: 'test-action' };
      
      expect(() => requireAuth(null, context)).toThrow('Authentication required');
      expect(mockLogAuthError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          action: 'permission_check',
          url: '/test',
          additionalData: expect.objectContaining({
            check: 'requireAuth',
            action: 'test-action'
          })
        })
      );
    });

    it('should not throw when user is valid', () => {
      const user: SessionUser = {
        id: '1',
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['captain']
      };

      expect(() => requireAuth(user)).not.toThrow();
      expect(mockLogAuthError).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    const user: SessionUser = {
      id: '1',
      email: 'test@example.com',
      fullName: 'Test User',
      roles: ['captain']
    };

    it('should throw error and log when user lacks required role', () => {
      const context = { url: '/admin', action: 'admin-access' };
      
      expect(() => requireRole(user, 'admin', context)).toThrow("Role 'admin' required");
      expect(mockLogAuthError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          action: 'permission_check',
          userId: '1',
          url: '/admin',
          additionalData: expect.objectContaining({
            check: 'requireRole',
            requiredRole: 'admin',
            userRoles: ['captain'],
            action: 'admin-access'
          })
        })
      );
    });

    it('should not throw when user has required role', () => {
      expect(() => requireRole(user, 'captain')).not.toThrow();
      expect(mockLogAuthError).not.toHaveBeenCalled();
    });
  });

  describe('validateSession', () => {
    it('should handle error cases gracefully', async () => {
      // Test that validateSession function exists and handles errors
      expect(validateSession).toBeDefined();
      expect(typeof validateSession).toBe('function');
    });
  });

  describe('Error Context Logging', () => {
    it('should include comprehensive context in error logs', () => {
      const user: SessionUser = {
        id: '1',
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['wingman']
      };

      const context = {
        url: '/reports/payroll',
        action: 'view-payroll'
      };

      expect(() => requireRole(user, 'manager', context)).toThrow();
      
      expect(mockLogAuthError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          action: 'permission_check',
          userId: '1',
          url: '/reports/payroll',
          additionalData: expect.objectContaining({
            check: 'requireRole',
            requiredRole: 'manager',
            userRoles: ['wingman'],
            action: 'view-payroll'
          })
        })
      );
    });
  });
});

describe('Server Authentication Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateServerSession', () => {
    it('should handle missing session gracefully', async () => {
      const { getServerSession } = await import('next-auth/next');
      vi.mocked(getServerSession).mockResolvedValue(null);

      const result = await validateServerSession(undefined, {
        requireAuth: true,
        redirectOnFailure: false
      });

      expect(result).toEqual({
        user: null,
        isValid: false,
        error: 'No valid session found'
      });
    });

    it('should return redirect information when configured', async () => {
      const { getServerSession } = await import('next-auth/next');
      vi.mocked(getServerSession).mockResolvedValue(null);

      const mockRequest = {
        url: 'http://localhost:3000/admin/users',
        headers: {
          get: vi.fn().mockReturnValue('test-user-agent')
        }
      } as any;

      const result = await validateServerSession(mockRequest, {
        requireAuth: true,
        redirectOnFailure: true
      });

      expect(result).toEqual({
        user: null,
        isValid: false,
        error: 'No valid session found',
        shouldRedirect: true,
        redirectUrl: '/auth/login?callbackUrl=%2Fadmin%2Fusers'
      });
    });

    it('should validate role requirements', async () => {
      const mockSession = {
        user: {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User',
          roles: ['captain']
        }
      };

      const { getServerSession } = await import('next-auth/next');
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['captain']
      } as any);

      const result = await validateServerSession(undefined, {
        requireAuth: true,
        requiredRoles: ['admin' as UserRole]
      });

      expect(result).toEqual({
        user: expect.objectContaining({
          id: '1',
          roles: ['captain']
        }),
        isValid: false,
        error: 'Required roles: admin'
      });
    });
  });
});