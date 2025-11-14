/**
 * Authentication Security Tests
 * Tests authentication flows, session management, and security measures
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  validateProductionSession,
  withProductionApiAuth,
} from '@/lib/production-auth';
import {
  PasswordSecurity,
  BruteForceProtection,
  SecurityMonitor,
} from '@/lib/security';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock NextAuth
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

describe('Authentication Security', () => {
  let mockPrisma: any;
  let passwordSecurity: PasswordSecurity;
  let bruteForceProtection: BruteForceProtection;

  beforeEach(() => {
    mockPrisma = prisma as any;
    passwordSecurity = new PasswordSecurity();
    bruteForceProtection = new BruteForceProtection(
      3,
      5 * 60 * 1000,
      15 * 60 * 1000
    ); // 3 attempts, 5min window, 15min block
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Password Security', () => {
    it('should validate strong passwords', () => {
      const strongPassword = 'StrongP@ssw0rd123!';
      const result = passwordSecurity.validatePassword(strongPassword);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'password', // Too common
        '123456', // Too common and no complexity
        'short', // Too short
        'nouppercase123!', // No uppercase
        'NOLOWERCASE123!', // No lowercase
        'NoNumbers!', // No numbers
        'NoSpecialChars123', // No special characters
      ];

      weakPasswords.forEach((password) => {
        const result = passwordSecurity.validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should hash passwords securely', async () => {
      const password = 'SecureP@ssw0rd123!';
      const hashedPassword = await passwordSecurity.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt hashes are long
    });

    it('should verify passwords correctly', async () => {
      const password = 'SecureP@ssw0rd123!';
      const hashedPassword = await passwordSecurity.hashPassword(password);

      const isValid = await passwordSecurity.verifyPassword(
        password,
        hashedPassword
      );
      expect(isValid).toBe(true);

      const isInvalid = await passwordSecurity.verifyPassword(
        'WrongPassword',
        hashedPassword
      );
      expect(isInvalid).toBe(false);
    });

    it('should reject password hashing for invalid passwords', async () => {
      const invalidPassword = 'weak';

      await expect(
        passwordSecurity.hashPassword(invalidPassword)
      ).rejects.toThrow('Password validation failed');
    });
  });

  describe('Brute Force Protection', () => {
    const testIdentifier = 'test-user-ip';

    it('should allow requests under the limit', async () => {
      expect(bruteForceProtection.isBlocked(testIdentifier)).toBe(false);

      await bruteForceProtection.recordFailedAttempt(testIdentifier);
      expect(bruteForceProtection.isBlocked(testIdentifier)).toBe(false);

      await bruteForceProtection.recordFailedAttempt(testIdentifier);
      expect(bruteForceProtection.isBlocked(testIdentifier)).toBe(false);
    });

    it('should block after max attempts', async () => {
      // Record max attempts
      await bruteForceProtection.recordFailedAttempt(testIdentifier);
      await bruteForceProtection.recordFailedAttempt(testIdentifier);
      await bruteForceProtection.recordFailedAttempt(testIdentifier);

      expect(bruteForceProtection.isBlocked(testIdentifier)).toBe(true);

      const remainingTime =
        bruteForceProtection.getRemainingBlockTime(testIdentifier);
      expect(remainingTime).toBeGreaterThan(0);
    });

    it('should clear failed attempts on successful login', async () => {
      await bruteForceProtection.recordFailedAttempt(testIdentifier);
      await bruteForceProtection.recordFailedAttempt(testIdentifier);

      bruteForceProtection.recordSuccessfulAttempt(testIdentifier);

      expect(bruteForceProtection.isBlocked(testIdentifier)).toBe(false);
    });

    it('should reset attempts after time window', async () => {
      const shortWindowProtection = new BruteForceProtection(2, 100, 1000); // 100ms window

      await shortWindowProtection.recordFailedAttempt(testIdentifier);
      await shortWindowProtection.recordFailedAttempt(testIdentifier);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      await shortWindowProtection.recordFailedAttempt(testIdentifier);
      expect(shortWindowProtection.isBlocked(testIdentifier)).toBe(false);
    });
  });

  describe('Session Validation', () => {
    it('should validate valid sessions', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User',
          roles: ['captain'],
        },
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['captain'],
      };

      const nextAuth = await import('next-auth/next');
      vi.mocked(nextAuth.getServerSession).mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await validateProductionSession(undefined, {
        requireAuth: true,
        validateDatabase: true,
      });

      expect(result.isValid).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.id).toBe('user-123');
    });

    it('should reject invalid sessions', async () => {
      const nextAuth = await import('next-auth/next');
      vi.mocked(nextAuth.getServerSession).mockResolvedValue(null);

      const result = await validateProductionSession(undefined, {
        requireAuth: true,
      });

      expect(result.isValid).toBe(false);
      expect(result.user).toBeNull();
      expect(result.errorCode).toBe('NO_SESSION');
    });

    it('should handle database validation failures gracefully', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User',
          roles: ['captain'],
        },
      };

      const nextAuth = await import('next-auth/next');
      vi.mocked(nextAuth.getServerSession).mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await validateProductionSession(undefined, {
        requireAuth: true,
        validateDatabase: true,
        allowGracefulDegradation: true,
      });

      expect(result.isValid).toBe(true); // Should gracefully degrade
      expect(result.user).toBeDefined();
      expect(result.metadata?.gracefulDegradation).toBe(true);
    });

    it('should validate role requirements', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User',
          roles: ['captain'],
        },
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['captain'],
      };

      const nextAuth = await import('next-auth/next');
      vi.mocked(nextAuth.getServerSession).mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Should pass with correct role
      const validResult = await validateProductionSession(undefined, {
        requireAuth: true,
        requiredRoles: ['captain'],
      });
      expect(validResult.isValid).toBe(true);

      // Should fail with incorrect role
      const invalidResult = await validateProductionSession(undefined, {
        requireAuth: true,
        requiredRoles: ['admin'],
      });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errorCode).toBe('INSUFFICIENT_ROLES');
    });
  });

  describe('API Authentication Wrapper', () => {
    it('should authenticate valid requests', async () => {
      const mockHandler = vi.fn().mockResolvedValue('success');
      const mockRequest = new NextRequest('http://localhost/api/test');

      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User',
          roles: ['captain'],
        },
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['captain'],
      };

      const nextAuth = await import('next-auth/next');
      vi.mocked(nextAuth.getServerSession).mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const wrappedHandler = withProductionApiAuth(mockHandler);
      const result = await wrappedHandler(mockRequest);

      expect(result).toBe('success');
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user-123' }),
        mockRequest
      );
    });

    it('should reject unauthenticated requests', async () => {
      const mockHandler = vi.fn();
      const mockRequest = new NextRequest('http://localhost/api/test');

      const nextAuth = await import('next-auth/next');
      vi.mocked(nextAuth.getServerSession).mockResolvedValue(null);

      const wrappedHandler = withProductionApiAuth(mockHandler);
      const result = await wrappedHandler(mockRequest);

      expect(result).toBeInstanceOf(Response);
      const response = result as Response;
      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error).toBe('authentication_required');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should check role requirements', async () => {
      const mockHandler = vi.fn().mockResolvedValue('success');
      const mockRequest = new NextRequest('http://localhost/api/admin');

      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User',
          roles: ['captain'], // Not admin
        },
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['captain'],
      };

      const nextAuth = await import('next-auth/next');
      vi.mocked(nextAuth.getServerSession).mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const wrappedHandler = withProductionApiAuth(mockHandler, {
        requiredRoles: ['admin'],
      });
      const result = await wrappedHandler(mockRequest);

      expect(result).toBeInstanceOf(Response);
      const response = result as Response;
      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.error).toBe('INSUFFICIENT_ROLES');
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('Security Monitoring', () => {
    it('should log security events', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({});

      await SecurityMonitor.logSecurityEvent(
        'suspicious_login_attempt',
        'high',
        {
          userId: 'user-123',
          ip: '192.168.1.1',
          userAgent: 'test-agent',
          url: '/api/auth/login',
          metadata: { reason: 'multiple_failed_attempts' },
        }
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'system_error',
          action: 'suspicious_login_attempt',
          userId: 'user-123',
          changes: expect.objectContaining({
            metadata: expect.objectContaining({
              severity: 'high',
              ip: '192.168.1.1',
              securityEvent: true,
            }),
          }),
        }),
      });
    });

    it('should detect suspicious activity patterns', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({});

      const isSuspicious = await SecurityMonitor.detectSuspiciousActivity(
        'user-123',
        'rapid_api_calls',
        {
          requestCount: 100,
          timeWindow: '1 minute',
          endpoint: '/api/logs',
        }
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
      // In this implementation, it always returns false, but logs the activity
      expect(isSuspicious).toBe(false);
    });
  });

  describe('Session Security', () => {
    it('should handle session tampering', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User',
          roles: ['captain'],
        },
      };

      const nextAuth = await import('next-auth/next');
      vi.mocked(nextAuth.getServerSession).mockResolvedValue(mockSession);

      // Simulate user not found in database (potential tampering)
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await validateProductionSession(undefined, {
        requireAuth: true,
        validateDatabase: true,
        allowGracefulDegradation: false,
      });

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('USER_NOT_FOUND');
    });

    it('should handle malformed session data', async () => {
      const malformedSession = {
        user: {
          id: null, // Invalid
          email: 'test@example.com',
          // Missing required fields
        },
      };

      const nextAuth = await import('next-auth/next');
      vi.mocked(nextAuth.getServerSession).mockResolvedValue(malformedSession);

      const result = await validateProductionSession(undefined, {
        requireAuth: true,
      });

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_SESSION_STRUCTURE');
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      const nextAuth = await import('next-auth/next');
      vi.mocked(nextAuth.getServerSession).mockRejectedValue(
        new Error('Auth service unavailable')
      );

      const result = await validateProductionSession(undefined, {
        requireAuth: true,
        maxRetries: 1, // Reduce retries for faster test
      });

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('VALIDATION_ERROR');
      expect(result.metadata?.originalError).toContain(
        'Auth service unavailable'
      );
    });

    it('should retry on transient failures', async () => {
      const nextAuth = await import('next-auth/next');

      // First call fails, second succeeds
      vi.mocked(nextAuth.getServerSession)
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            fullName: 'Test User',
            roles: ['captain'],
          },
        });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['captain'],
      });

      const result = await validateProductionSession(undefined, {
        requireAuth: true,
        maxRetries: 2,
      });

      expect(result.isValid).toBe(true);
      expect(result.metadata?.retryCount).toBe(1);
    });
  });
});
