import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  hasRole,
  hasAnyRole,
  requireAuth,
  requireRole,
  requireAnyRole,
} from '@/lib/auth';
import type { User, UserRole } from '@/types';

// Mock user data
const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  fullName: 'Test User',
  roles: ['captain', 'sales'],
  junkBonusGoal: 0.14,
  moveBonusGoal: 0.24,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAdminUser: User = {
  id: '2',
  email: 'admin@example.com',
  fullName: 'Admin User',
  roles: ['admin', 'manager'],
  junkBonusGoal: 0.14,
  moveBonusGoal: 0.24,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Authentication Utilities', () => {
  describe('hasRole', () => {
    it('should return true when user has the specified role', () => {
      expect(hasRole(mockUser, 'captain')).toBe(true);
      expect(hasRole(mockUser, 'sales')).toBe(true);
    });

    it('should return false when user does not have the specified role', () => {
      expect(hasRole(mockUser, 'admin')).toBe(false);
      expect(hasRole(mockUser, 'manager')).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user has at least one of the specified roles', () => {
      expect(hasAnyRole(mockUser, ['captain', 'admin'])).toBe(true);
      expect(hasAnyRole(mockUser, ['sales', 'manager'])).toBe(true);
      expect(hasAnyRole(mockUser, ['captain', 'sales'])).toBe(true);
    });

    it('should return false when user has none of the specified roles', () => {
      expect(hasAnyRole(mockUser, ['admin', 'manager'])).toBe(false);
      expect(hasAnyRole(mockUser, ['wingman'])).toBe(false);
    });

    it('should return false for empty roles array', () => {
      expect(hasAnyRole(mockUser, [])).toBe(false);
    });
  });

  describe('requireAuth', () => {
    it('should not throw when user is provided', () => {
      expect(() => requireAuth(mockUser)).not.toThrow();
    });

    it('should throw when user is null', () => {
      expect(() => requireAuth(null)).toThrow('Authentication required');
    });

    it('should throw when user is undefined', () => {
      expect(() => requireAuth(undefined as any)).toThrow(
        'Authentication required'
      );
    });
  });

  describe('requireRole', () => {
    it('should not throw when user has the required role', () => {
      expect(() => requireRole(mockUser, 'captain')).not.toThrow();
      expect(() => requireRole(mockUser, 'sales')).not.toThrow();
    });

    it('should throw when user does not have the required role', () => {
      expect(() => requireRole(mockUser, 'admin')).toThrow(
        "Role 'admin' required"
      );
      expect(() => requireRole(mockUser, 'manager')).toThrow(
        "Role 'manager' required"
      );
    });

    it('should throw when user is null', () => {
      expect(() => requireRole(null, 'captain')).toThrow(
        'Authentication required'
      );
    });
  });

  describe('requireAnyRole', () => {
    it('should not throw when user has at least one of the required roles', () => {
      expect(() =>
        requireAnyRole(mockUser, ['captain', 'admin'])
      ).not.toThrow();
      expect(() =>
        requireAnyRole(mockUser, ['sales', 'manager'])
      ).not.toThrow();
    });

    it('should throw when user has none of the required roles', () => {
      expect(() => requireAnyRole(mockUser, ['admin', 'manager'])).toThrow(
        'One of roles [admin, manager] required'
      );
    });

    it('should throw when user is null', () => {
      expect(() => requireAnyRole(null, ['captain'])).toThrow(
        'Authentication required'
      );
    });

    it('should not throw for empty roles array when user is authenticated', () => {
      expect(() => requireAnyRole(mockUser, [])).not.toThrow();
    });
  });

  describe('Role-based access scenarios', () => {
    it('should handle admin user correctly', () => {
      expect(hasRole(mockAdminUser, 'admin')).toBe(true);
      expect(hasRole(mockAdminUser, 'manager')).toBe(true);
      expect(hasAnyRole(mockAdminUser, ['admin', 'captain'])).toBe(true);
      expect(() => requireRole(mockAdminUser, 'admin')).not.toThrow();
    });

    it('should handle multiple role checks', () => {
      const managerRoles: UserRole[] = ['manager', 'admin'];
      const captainRoles: UserRole[] = ['captain', 'wingman'];

      expect(hasAnyRole(mockAdminUser, managerRoles)).toBe(true);
      expect(hasAnyRole(mockUser, captainRoles)).toBe(true);
      expect(hasAnyRole(mockUser, managerRoles)).toBe(false);
    });
  });
});
