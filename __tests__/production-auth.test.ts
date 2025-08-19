/**
 * Production Authentication Tests
 * Comprehensive tests for enhanced authentication with error recovery
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateProductionSession, requireProductionAuth } from '@/lib/production-auth';
import { logProductionError } from '@/lib/production-error-logger';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import type { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('next-auth/next');
vi.mock('@/lib/production-error-logger');
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockGetServerSession = vi.mocked(getServerSession);
const mockLogProductionError = vi.mocked(logProductionError);
const mockPrismaUserFindUnique = vi.mocked(prisma.user.findUnique);
const mockPrismaUserUpdate = vi.mocked(prisma.user.update);

describe('Production Authentication', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    fullName: 'Test User',
    roles: ['captain'],
    isActive: true,
  };

  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      fullName: 'Test User',
      roles: ['captain'],
    },
  };

  const mockRequest = {
    url: 'https://example.com/test',
    headers: new Map([['user-agent', 'test-agent']]),
  } as unknown as NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrismaUserUpdate.mockResolvedValue(mockUser as any);
    mockLogProductionError.mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateProductionSession', () => {
    it('should return valid result for authenticated user', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrismaUserFindUnique.mockResolvedValue(mockUser as any);

      const result = await validateProductionSession(mockRequest, {
        requireAuth: true,
        validateDatabase: true,
      });

      expect(result.isValid).toBe(true);
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        roles: mockUser.roles,
      });
      expect(result.error).toBeUndefined();
    });

    it('should handle no session gracefully', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const result = await validateProductionSession(mockRequest, {
        requireAuth: true,
        redirectOnFailure: true,
      });

      expect(result.isValid).toBe(false);
      expect(result.user).toBeNull();
      expect(result.errorCode).toBe('NO_SESSION');
      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectUrl).toContain('/auth/login');
    });

    it('should handle invalid session structure', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123' }, // Missing required fields
      });

      const result = await validateProductionSession(mockRequest, {
        requireAuth: true,
        redirectOnFailure: true,
      });

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_SESSION_STRUCTURE');
      expect(result.shouldRedirect).toBe(true);
      expect(mockLogProductionError).toHaveBeenCalled();
    });

    it('should handle user not found in database', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrismaUserFindUnique.mockResolvedValue(null);

      const result = await validateProductionSession(mockRequest, {
        requireAuth: true,
        validateDatabase: true,
        redirectOnFailure: true,
      });

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('USER_NOT_FOUND');
      expect(result.shouldRedirect).toBe(true);
      expect(mockLogProductionError).toHaveBeenCalled();
    });

    it('should handle valid user with database validation', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrismaUserFindUnique.mockResolvedValue(mockUser as any);

      const result = await validateProductionSession(mockRequest, {
        requireAuth: true,
        validateDatabase: true,
      });

      expect(result.isValid).toBe(true);
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        roles: mockUser.roles,
      });
    });

    it('should handle insufficient roles', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrismaUserFindUnique.mockResolvedValue(mockUser as any);

      const result = await validateProductionSession(mockRequest, {
        requireAuth: true,
        requiredRoles: ['admin'],
        validateDatabase: true,
        redirectOnFailure: true,
      });

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INSUFFICIENT_ROLES');
      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectUrl).toContain('access_denied');
    });

    it('should gracefully degrade on database errors', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrismaUserFindUnique.mockRejectedValue(new Error('Database error'));

      const result = await validateProductionSession(mockRequest, {
        requireAuth: true,
        validateDatabase: true,
        allowGracefulDegradation: true,
      });

      expect(result.isValid).toBe(true);
      expect(result.user).toEqual(mockSession.user);
      expect(result.metadata?.gracefulDegradation).toBe(true);
      expect(mockLogProductionError).toHaveBeenCalled();
    });

    it('should retry on database errors', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrismaUserFindUnique
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce(mockUser as any);

      const result = await validateProductionSession(mockRequest, {
        requireAuth: true,
        validateDatabase: true,
        maxRetries: 2,
      });

      expect(result.isValid).toBe(true);
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        roles: mockUser.roles,
      });
      expect(mockPrismaUserFindUnique).toHaveBeenCalledTimes(2);
    });

    it('should handle session timeout', async () => {
      // Mock a session that rejects after timeout
      mockGetServerSession.mockImplementation(
        () => Promise.reject(new Error('Session validation timeout'))
      );

      const result = await validateProductionSession(mockRequest, {
        requireAuth: true,
      });

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('VALIDATION_ERROR');
      expect(mockLogProductionError).toHaveBeenCalled();
    });

    it('should skip database validation when disabled', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);

      const result = await validateProductionSession(mockRequest, {
        requireAuth: true,
        validateDatabase: false,
      });

      expect(result.isValid).toBe(true);
      expect(result.user).toEqual(mockSession.user);
      expect(result.metadata?.databaseValidated).toBe(false);
      expect(mockPrismaUserFindUnique).not.toHaveBeenCalled();
    });

    it('should complete database validation successfully', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrismaUserFindUnique.mockResolvedValue(mockUser as any);

      const result = await validateProductionSession(mockRequest, {
        requireAuth: true,
        validateDatabase: true,
      });

      expect(result.isValid).toBe(true);
      expect(result.metadata?.databaseValidated).toBe(true);
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        roles: mockUser.roles,
      });
    });
  });

  describe('requireProductionAuth', () => {
    it('should return user for valid session', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrismaUserFindUnique.mockResolvedValue(mockUser as any);

      const user = await requireProductionAuth(mockRequest);

      expect(user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        roles: mockUser.roles,
      });
    });

    it('should throw error for invalid session', async () => {
      mockGetServerSession.mockResolvedValue(null);

      await expect(requireProductionAuth(mockRequest)).rejects.toThrow('No valid session found');
    });

    it('should redirect when configured', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const result = await validateProductionSession(mockRequest, {
        requireAuth: true,
        redirectOnFailure: true,
      });

      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectUrl).toContain('/auth/login');
    });
  });

  describe('Error Handling', () => {
    it('should log authentication errors with proper context', async () => {
      mockGetServerSession.mockResolvedValue(null);

      await validateProductionSession(mockRequest, {
        requireAuth: true,
      });

      expect(mockLogProductionError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          component: 'authentication',
          action: 'session_validation',
          url: mockRequest.url,
          userAgent: 'test-agent',
          category: 'auth',
          metadata: expect.objectContaining({
            reason: 'no_session',
          }),
        })
      );
    });

    it('should include request ID in metadata', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const result = await validateProductionSession(mockRequest);

      expect(result.metadata?.requestId).toMatch(/^auth_\d+_[a-z0-9]+$/);
    });

    it('should track retry count', async () => {
      mockGetServerSession
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockSession);
      mockPrismaUserFindUnique.mockResolvedValue(mockUser as any);

      const result = await validateProductionSession(mockRequest, {
        maxRetries: 2,
      });

      expect(result.metadata?.retryCount).toBe(1);
    });
  });

  describe('Performance', () => {
    it('should complete validation within reasonable time', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrismaUserFindUnique.mockResolvedValue(mockUser as any);

      const startTime = Date.now();
      await validateProductionSession(mockRequest, {
        requireAuth: true,
        validateDatabase: true,
      });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent validation requests', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockPrismaUserFindUnique.mockResolvedValue(mockUser as any);

      const promises = Array.from({ length: 10 }, () =>
        validateProductionSession(mockRequest, {
          requireAuth: true,
          validateDatabase: true,
        })
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.isValid).toBe(true);
      });
    });
  });
});