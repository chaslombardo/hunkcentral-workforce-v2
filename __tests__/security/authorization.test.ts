/**
 * Authorization Security Tests
 * Tests role-based access control, permissions, and authorization flows
 */

import { describe, it, expect } from 'vitest';
import {
  hasRole,
  hasAnyRole,
  requireAuth,
  requireRole,
  requireAnyRole,
  canManagerAccessUser,
  canUserAccessUserData,
  shouldFilterUsersForManager,
} from '@/lib/auth';
import type { SessionUser, UserRole } from '@/lib/auth';

describe('Authorization Security', () => {
  const createMockUser = (id: string, roles: UserRole[]): SessionUser => ({
    id,
    email: `${id}@example.com`,
    fullName: `User ${id}`,
    roles,
  });

  describe('Role Checking', () => {
    it('should correctly identify user roles', () => {
      const adminUser = createMockUser('admin-1', ['admin']);
      const managerUser = createMockUser('manager-1', ['manager']);
      const captainUser = createMockUser('captain-1', ['captain']);
      const multiRoleUser = createMockUser('multi-1', ['captain', 'sales']);

      expect(hasRole(adminUser, 'admin')).toBe(true);
      expect(hasRole(adminUser, 'manager')).toBe(false);

      expect(hasRole(managerUser, 'manager')).toBe(true);
      expect(hasRole(managerUser, 'admin')).toBe(false);

      expect(hasRole(captainUser, 'captain')).toBe(true);
      expect(hasRole(captainUser, 'wingman')).toBe(false);

      expect(hasRole(multiRoleUser, 'captain')).toBe(true);
      expect(hasRole(multiRoleUser, 'sales')).toBe(true);
      expect(hasRole(multiRoleUser, 'admin')).toBe(false);
    });

    it('should check for any role correctly', () => {
      const captainUser = createMockUser('captain-1', ['captain']);
      const multiRoleUser = createMockUser('multi-1', ['captain', 'sales']);
      const wingmanUser = createMockUser('wingman-1', ['wingman']);

      expect(hasAnyRole(captainUser, ['captain', 'manager'])).toBe(true);
      expect(hasAnyRole(captainUser, ['manager', 'admin'])).toBe(false);

      expect(hasAnyRole(multiRoleUser, ['sales'])).toBe(true);
      expect(hasAnyRole(multiRoleUser, ['captain', 'manager'])).toBe(true);
      expect(hasAnyRole(multiRoleUser, ['admin'])).toBe(false);

      expect(hasAnyRole(wingmanUser, ['captain', 'sales'])).toBe(false);
      expect(hasAnyRole(wingmanUser, ['wingman', 'captain'])).toBe(true);
    });
  });

  describe('Authentication Requirements', () => {
    it('should pass for authenticated users', () => {
      const user = createMockUser('user-1', ['captain']);

      expect(() => requireAuth(user)).not.toThrow();
    });

    it('should throw for unauthenticated users', () => {
      expect(() => requireAuth(null)).toThrow('Authentication required');
    });

    it('should include context in error logging', () => {
      const context = { url: '/api/test', action: 'test_action' };

      expect(() => requireAuth(null, context)).toThrow(
        'Authentication required'
      );
    });
  });

  describe('Role Requirements', () => {
    it('should pass for users with required role', () => {
      const adminUser = createMockUser('admin-1', ['admin']);
      const managerUser = createMockUser('manager-1', ['manager']);

      expect(() => requireRole(adminUser, 'admin')).not.toThrow();
      expect(() => requireRole(managerUser, 'manager')).not.toThrow();
    });

    it('should throw for users without required role', () => {
      const captainUser = createMockUser('captain-1', ['captain']);

      expect(() => requireRole(captainUser, 'admin')).toThrow(
        "Role 'admin' required"
      );
      expect(() => requireRole(captainUser, 'manager')).toThrow(
        "Role 'manager' required"
      );
    });

    it('should throw for unauthenticated users', () => {
      expect(() => requireRole(null, 'admin')).toThrow(
        'Authentication required'
      );
    });

    it('should pass for users with any required role', () => {
      const captainUser = createMockUser('captain-1', ['captain']);
      const managerUser = createMockUser('manager-1', ['manager']);
      const multiRoleUser = createMockUser('multi-1', ['captain', 'sales']);

      expect(() =>
        requireAnyRole(captainUser, ['captain', 'manager'])
      ).not.toThrow();
      expect(() =>
        requireAnyRole(managerUser, ['captain', 'manager'])
      ).not.toThrow();
      expect(() => requireAnyRole(multiRoleUser, ['sales'])).not.toThrow();
    });

    it('should throw for users without any required role', () => {
      const wingmanUser = createMockUser('wingman-1', ['wingman']);

      expect(() => requireAnyRole(wingmanUser, ['admin', 'manager'])).toThrow(
        'One of roles [admin, manager] required'
      );
    });

    it('should pass when no roles are required', () => {
      const wingmanUser = createMockUser('wingman-1', ['wingman']);

      expect(() => requireAnyRole(wingmanUser, [])).not.toThrow();
    });
  });

  describe('Manager Access Control', () => {
    const adminUser = createMockUser('admin-1', ['admin']);
    const managerUser = createMockUser('manager-1', ['manager']);
    const captainUser = createMockUser('captain-1', ['captain']);
    const wingmanUser = createMockUser('wingman-1', ['wingman']);
    const salesUser = createMockUser('sales-1', ['sales']);

    it('should allow users to access themselves', () => {
      expect(canManagerAccessUser(captainUser, captainUser)).toBe(true);
      expect(canManagerAccessUser(managerUser, managerUser)).toBe(true);
      expect(canManagerAccessUser(salesUser, salesUser)).toBe(true);
    });

    it('should allow admins to access anyone', () => {
      expect(canManagerAccessUser(adminUser, captainUser)).toBe(true);
      expect(canManagerAccessUser(adminUser, managerUser)).toBe(true);
      expect(canManagerAccessUser(adminUser, salesUser)).toBe(true);
      expect(canManagerAccessUser(adminUser, wingmanUser)).toBe(true);
    });

    it('should allow managers to access captains and wingmen only', () => {
      expect(canManagerAccessUser(managerUser, captainUser)).toBe(true);
      expect(canManagerAccessUser(managerUser, wingmanUser)).toBe(true);
      expect(canManagerAccessUser(managerUser, salesUser)).toBe(false);
      expect(canManagerAccessUser(managerUser, adminUser)).toBe(false);
    });

    it('should not allow non-managers to access other users', () => {
      expect(canManagerAccessUser(captainUser, wingmanUser)).toBe(false);
      expect(canManagerAccessUser(wingmanUser, captainUser)).toBe(false);
      expect(canManagerAccessUser(salesUser, captainUser)).toBe(false);
    });

    it('should correctly identify data access permissions', () => {
      // Admins can access anyone
      expect(canUserAccessUserData(adminUser, 'any-user-id')).toBe(true);

      // Users can access themselves
      expect(canUserAccessUserData(captainUser, captainUser.id)).toBe(true);
      expect(canUserAccessUserData(captainUser, 'other-user-id')).toBe(false);

      // Managers can access team members (filtering happens at data level)
      expect(canUserAccessUserData(managerUser, 'any-user-id')).toBe(true);

      // Non-managers cannot access other users
      expect(canUserAccessUserData(captainUser, 'other-user-id')).toBe(false);
      expect(canUserAccessUserData(salesUser, 'other-user-id')).toBe(false);
    });

    it('should identify when user filtering is needed', () => {
      expect(shouldFilterUsersForManager(adminUser)).toBe(false); // Admins see all
      expect(shouldFilterUsersForManager(managerUser)).toBe(true); // Managers need filtering
      expect(shouldFilterUsersForManager(captainUser)).toBe(false); // Non-managers don't use this
    });
  });

  describe('Role Hierarchy and Permissions', () => {
    it('should respect admin supremacy', () => {
      const adminUser = createMockUser('admin-1', ['admin']);

      // Admins should have access to everything
      expect(hasRole(adminUser, 'admin')).toBe(true);
      expect(
        canManagerAccessUser(adminUser, createMockUser('anyone', ['captain']))
      ).toBe(true);
      expect(canUserAccessUserData(adminUser, 'any-user-id')).toBe(true);
    });

    it('should handle multi-role users correctly', () => {
      const managerCaptain = createMockUser('manager-captain', [
        'manager',
        'captain',
      ]);
      const adminManager = createMockUser('admin-manager', [
        'admin',
        'manager',
      ]);

      // Should have permissions from all roles
      expect(hasRole(managerCaptain, 'manager')).toBe(true);
      expect(hasRole(managerCaptain, 'captain')).toBe(true);
      expect(hasAnyRole(managerCaptain, ['manager'])).toBe(true);
      expect(hasAnyRole(managerCaptain, ['captain'])).toBe(true);

      // Admin role should take precedence
      expect(hasRole(adminManager, 'admin')).toBe(true);
      expect(canUserAccessUserData(adminManager, 'any-user-id')).toBe(true);
      expect(shouldFilterUsersForManager(adminManager)).toBe(false); // Admin overrides manager
    });

    it('should handle edge cases in role checking', () => {
      const emptyRoleUser = createMockUser('empty', []);

      expect(hasRole(emptyRoleUser, 'admin')).toBe(false);
      expect(hasAnyRole(emptyRoleUser, ['admin', 'manager'])).toBe(false);
      expect(hasAnyRole(emptyRoleUser, [])).toBe(false); // No roles to check

      expect(() => requireRole(emptyRoleUser, 'admin')).toThrow();
      expect(() => requireAnyRole(emptyRoleUser, ['admin'])).toThrow();
    });
  });

  describe('Security Context and Logging', () => {
    it('should include context in authorization failures', () => {
      const captainUser = createMockUser('captain-1', ['captain']);
      const context = {
        url: '/api/admin/users',
        action: 'view_all_users',
      };

      expect(() => requireRole(captainUser, 'admin', context)).toThrow(
        "Role 'admin' required"
      );
    });

    it('should handle authorization with detailed context', () => {
      const managerUser = createMockUser('manager-1', ['manager']);
      const context = {
        url: '/api/admin/system-settings',
        action: 'modify_system_settings',
      };

      expect(() => requireAnyRole(managerUser, ['admin'], context)).toThrow(
        'One of roles [admin] required'
      );
    });
  });

  describe('Permission Boundary Testing', () => {
    it('should enforce strict role boundaries', () => {
      const captainUser = createMockUser('captain-1', ['captain']);
      const wingmanUser = createMockUser('wingman-1', ['wingman']);
      const salesUser = createMockUser('sales-1', ['sales']);

      // Captains should not have manager privileges
      expect(canManagerAccessUser(captainUser, wingmanUser)).toBe(false);

      // Sales should not have operational privileges
      expect(hasRole(salesUser, 'captain')).toBe(false);
      expect(hasRole(salesUser, 'manager')).toBe(false);

      // Wingmen should not have captain privileges
      expect(hasRole(wingmanUser, 'captain')).toBe(false);
    });

    it('should prevent privilege escalation', () => {
      const captainUser = createMockUser('captain-1', ['captain']);

      // Should not be able to access admin functions
      expect(() => requireRole(captainUser, 'admin')).toThrow();

      // Should not be able to access manager functions
      expect(() => requireRole(captainUser, 'manager')).toThrow();

      // Should not have manager access to other users
      expect(
        canManagerAccessUser(captainUser, createMockUser('other', ['wingman']))
      ).toBe(false);
    });

    it('should handle role validation edge cases', () => {
      const user = createMockUser('test', ['captain']);

      // Test with undefined/null roles
      expect(() => requireAnyRole(user, undefined as any)).not.toThrow();

      // Test with empty role arrays
      expect(() => requireAnyRole(user, [])).not.toThrow();

      // Test role checking with invalid role types
      expect(hasRole(user, 'invalid-role' as UserRole)).toBe(false);
    });
  });

  describe('Access Control Matrix', () => {
    // Define a comprehensive access control matrix
    const accessMatrix = {
      admin: {
        canAccessUsers: true,
        canAccessLogs: true,
        canAccessCommissions: true,
        canAccessReports: true,
        canAccessSystem: true,
        canManageUsers: true,
      },
      manager: {
        canAccessUsers: true, // Limited to team
        canAccessLogs: true, // Limited to team
        canAccessCommissions: true, // Limited to team
        canAccessReports: true, // Limited to team
        canAccessSystem: false,
        canManageUsers: false,
      },
      captain: {
        canAccessUsers: false, // Own only
        canAccessLogs: true, // Own only
        canAccessCommissions: false,
        canAccessReports: true, // Own only
        canAccessSystem: false,
        canManageUsers: false,
      },
      sales: {
        canAccessUsers: false, // Own only
        canAccessLogs: false,
        canAccessCommissions: true, // Own only
        canAccessReports: true, // Own only
        canAccessSystem: false,
        canManageUsers: false,
      },
      wingman: {
        canAccessUsers: false, // Own only
        canAccessLogs: false,
        canAccessCommissions: false,
        canAccessReports: true, // Own only
        canAccessSystem: false,
        canManageUsers: false,
      },
    };

    it('should enforce access control matrix for all roles', () => {
      Object.entries(accessMatrix).forEach(([role, permissions]) => {
        const user = createMockUser(`${role}-user`, [role as UserRole]);

        // Test system access
        if (permissions.canAccessSystem) {
          expect(() => requireRole(user, 'admin')).not.toThrow();
        } else {
          expect(() => requireRole(user, 'admin')).toThrow();
        }

        // Test user management
        if (permissions.canManageUsers) {
          expect(() => requireAnyRole(user, ['admin'])).not.toThrow();
        } else {
          expect(() => requireAnyRole(user, ['admin'])).toThrow();
        }
      });
    });
  });
});
