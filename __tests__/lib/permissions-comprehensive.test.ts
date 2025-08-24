import { describe, it, expect } from 'vitest';
import {
  PERMISSIONS,
  PERMISSION_GROUPS,
  ROLE_PERMISSIONS,
  PERMISSION_TEMPLATES,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessResource,
  getUserPermissions,
  getPermissionRequiredRoles,
  type Permission,
  type PermissionContext,
  type PermissionTemplate,
} from '@/lib/permissions';
import type { UserRole } from '@/types';

describe('Permissions System - Comprehensive Unit Tests', () => {
  describe('Permission Constants', () => {
    it('should have all required permission constants', () => {
      const expectedPermissions = [
        'VIEW_OWN_DASHBOARD',
        'VIEW_TEAM_DASHBOARD',
        'VIEW_ALL_DASHBOARDS',
        'CREATE_LOGS',
        'EDIT_OWN_LOGS',
        'EDIT_TEAM_LOGS',
        'EDIT_ALL_LOGS',
        'APPROVE_LOGS',
        'DELETE_LOGS',
        'VIEW_LOG_AUDIT_TRAIL',
        'CREATE_COMMISSIONS',
        'VIEW_OWN_COMMISSIONS',
        'VIEW_TEAM_COMMISSIONS',
        'VIEW_ALL_COMMISSIONS',
        'EDIT_COMMISSIONS',
        'APPROVE_COMMISSIONS',
        'DELETE_COMMISSIONS',
        'VIEW_OWN_PAYROLL',
        'VIEW_TEAM_PAYROLL',
        'VIEW_ALL_PAYROLL',
        'GENERATE_REPORTS',
        'EXPORT_PAYROLL',
        'VIEW_PAYROLL_ANALYTICS',
        'VIEW_USERS',
        'CREATE_USERS',
        'EDIT_USERS',
        'DELETE_USERS',
        'MANAGE_PERMISSIONS',
        'MANAGE_ROLES',
        'MANAGE_PAY_PERIODS',
        'VIEW_AUDIT_LOGS',
        'SYSTEM_SETTINGS',
        'MANAGE_LOCATIONS',
        'VIEW_SYSTEM_HEALTH',
        'VIEW_PERFORMANCE_RANKINGS',
        'VIEW_DETAILED_RANKINGS',
        'EXPORT_RANKINGS',
      ];

      expectedPermissions.forEach((permission) => {
        expect(PERMISSIONS).toHaveProperty(permission);
        expect(typeof PERMISSIONS[permission as keyof typeof PERMISSIONS]).toBe(
          'string'
        );
      });
    });

    it('should have unique permission values', () => {
      const permissionValues = Object.values(PERMISSIONS);
      const uniqueValues = new Set(permissionValues);
      expect(uniqueValues.size).toBe(permissionValues.length);
    });

    it('should have consistent naming convention', () => {
      Object.values(PERMISSIONS).forEach((permission) => {
        expect(permission).toMatch(/^[a-z_]+$/);
        expect(permission).not.toMatch(/^_|_$/);
      });
    });
  });

  describe('Permission Groups', () => {
    it('should have all required permission groups', () => {
      const expectedGroups = [
        'DASHBOARD_ACCESS',
        'LOG_MANAGEMENT',
        'COMMISSION_MANAGEMENT',
        'PAYROLL_REPORTS',
        'USER_MANAGEMENT',
        'SYSTEM_ADMINISTRATION',
        'PERFORMANCE_RANKINGS',
      ];

      expectedGroups.forEach((group) => {
        expect(PERMISSION_GROUPS).toHaveProperty(group);
        expect(
          PERMISSION_GROUPS[group as keyof typeof PERMISSION_GROUPS]
        ).toHaveProperty('name');
        expect(
          PERMISSION_GROUPS[group as keyof typeof PERMISSION_GROUPS]
        ).toHaveProperty('description');
        expect(
          PERMISSION_GROUPS[group as keyof typeof PERMISSION_GROUPS]
        ).toHaveProperty('permissions');
      });
    });

    it('should have valid permissions in each group', () => {
      Object.values(PERMISSION_GROUPS).forEach((group) => {
        expect(Array.isArray(group.permissions)).toBe(true);
        expect(group.permissions.length).toBeGreaterThan(0);

        group.permissions.forEach((permission) => {
          expect(Object.values(PERMISSIONS)).toContain(permission);
        });
      });
    });

    it('should cover all permissions in groups', () => {
      const allGroupPermissions = new Set(
        Object.values(PERMISSION_GROUPS).flatMap((group) => group.permissions)
      );
      const allPermissions = new Set(Object.values(PERMISSIONS));

      expect(allGroupPermissions.size).toBe(allPermissions.size);
      allPermissions.forEach((permission) => {
        expect(allGroupPermissions.has(permission)).toBe(true);
      });
    });
  });

  describe('Role Permissions', () => {
    it('should have permissions for all user roles', () => {
      const expectedRoles: UserRole[] = [
        'admin',
        'manager',
        'captain',
        'sales',
        'wingman',
      ];

      expectedRoles.forEach((role) => {
        expect(ROLE_PERMISSIONS).toHaveProperty(role);
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
      });
    });

    it('should have valid permissions for each role', () => {
      Object.entries(ROLE_PERMISSIONS).forEach(([role, permissions]) => {
        permissions.forEach((permission) => {
          expect(Object.values(PERMISSIONS)).toContain(permission);
        });
      });
    });

    it('should give admin all permissions', () => {
      const allPermissions = Object.values(PERMISSIONS);
      const adminPermissions = ROLE_PERMISSIONS.admin;

      expect(adminPermissions.length).toBe(allPermissions.length);
      allPermissions.forEach((permission) => {
        expect(adminPermissions).toContain(permission);
      });
    });

    it('should give appropriate permissions to each role', () => {
      // Manager should have more permissions than captain
      expect(ROLE_PERMISSIONS.manager.length).toBeGreaterThan(
        ROLE_PERMISSIONS.captain.length
      );

      // Captain should have more permissions than wingman
      expect(ROLE_PERMISSIONS.captain.length).toBeGreaterThan(
        ROLE_PERMISSIONS.wingman.length
      );

      // All roles should have basic dashboard access
      const basicRoles: UserRole[] = ['manager', 'captain', 'sales', 'wingman'];
      basicRoles.forEach((role) => {
        expect(ROLE_PERMISSIONS[role]).toContain(
          PERMISSIONS.VIEW_OWN_DASHBOARD
        );
        expect(ROLE_PERMISSIONS[role]).toContain(PERMISSIONS.VIEW_OWN_PAYROLL);
      });

      // Only managers and admins should approve logs
      expect(ROLE_PERMISSIONS.manager).toContain(PERMISSIONS.APPROVE_LOGS);
      expect(ROLE_PERMISSIONS.admin).toContain(PERMISSIONS.APPROVE_LOGS);
      expect(ROLE_PERMISSIONS.captain).not.toContain(PERMISSIONS.APPROVE_LOGS);
      expect(ROLE_PERMISSIONS.wingman).not.toContain(PERMISSIONS.APPROVE_LOGS);

      // Only sales should create commissions
      expect(ROLE_PERMISSIONS.sales).toContain(PERMISSIONS.CREATE_COMMISSIONS);
      expect(ROLE_PERMISSIONS.captain).not.toContain(
        PERMISSIONS.CREATE_COMMISSIONS
      );
      expect(ROLE_PERMISSIONS.wingman).not.toContain(
        PERMISSIONS.CREATE_COMMISSIONS
      );

      // Only captains should create logs
      expect(ROLE_PERMISSIONS.captain).toContain(PERMISSIONS.CREATE_LOGS);
      expect(ROLE_PERMISSIONS.wingman).not.toContain(PERMISSIONS.CREATE_LOGS);
      expect(ROLE_PERMISSIONS.sales).not.toContain(PERMISSIONS.CREATE_LOGS);
    });
  });

  describe('hasPermission', () => {
    it('should return true for explicit permissions', () => {
      const context: PermissionContext = {
        userId: 'user-1',
        roles: ['wingman'],
        permissions: [PERMISSIONS.VIEW_OWN_DASHBOARD],
      };

      expect(hasPermission(context, PERMISSIONS.VIEW_OWN_DASHBOARD)).toBe(true);
    });

    it('should return true for role-based permissions', () => {
      const context: PermissionContext = {
        userId: 'user-1',
        roles: ['captain'],
        permissions: [],
      };

      expect(hasPermission(context, PERMISSIONS.CREATE_LOGS)).toBe(true);
      expect(hasPermission(context, PERMISSIONS.VIEW_OWN_DASHBOARD)).toBe(true);
    });

    it('should return false for missing permissions', () => {
      const context: PermissionContext = {
        userId: 'user-1',
        roles: ['wingman'],
        permissions: [],
      };

      expect(hasPermission(context, PERMISSIONS.CREATE_LOGS)).toBe(false);
      expect(hasPermission(context, PERMISSIONS.APPROVE_LOGS)).toBe(false);
    });

    it('should prioritize explicit permissions over role permissions', () => {
      const context: PermissionContext = {
        userId: 'user-1',
        roles: ['wingman'], // Wingman doesn't have CREATE_LOGS by default
        permissions: [PERMISSIONS.CREATE_LOGS], // But explicitly granted
      };

      expect(hasPermission(context, PERMISSIONS.CREATE_LOGS)).toBe(true);
    });

    it('should handle multiple roles', () => {
      const context: PermissionContext = {
        userId: 'user-1',
        roles: ['captain', 'sales'],
        permissions: [],
      };

      // Should have permissions from both roles
      expect(hasPermission(context, PERMISSIONS.CREATE_LOGS)).toBe(true); // From captain
      expect(hasPermission(context, PERMISSIONS.CREATE_COMMISSIONS)).toBe(true); // From sales
    });

    it('should handle empty roles and permissions', () => {
      const context: PermissionContext = {
        userId: 'user-1',
        roles: [],
        permissions: [],
      };

      expect(hasPermission(context, PERMISSIONS.VIEW_OWN_DASHBOARD)).toBe(
        false
      );
    });

    it('should handle admin role', () => {
      const context: PermissionContext = {
        userId: 'user-1',
        roles: ['admin'],
        permissions: [],
      };

      // Admin should have all permissions
      Object.values(PERMISSIONS).forEach((permission) => {
        expect(hasPermission(context, permission)).toBe(true);
      });
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has any of the specified permissions', () => {
      const context: PermissionContext = {
        userId: 'user-1',
        roles: ['captain'],
        permissions: [],
      };

      expect(
        hasAnyPermission(context, [
          PERMISSIONS.CREATE_LOGS, // Captain has this
          PERMISSIONS.APPROVE_LOGS, // Captain doesn't have this
        ])
      ).toBe(true);
    });

    it('should return false if user has none of the specified permissions', () => {
      const context: PermissionContext = {
        userId: 'user-1',
        roles: ['wingman'],
        permissions: [],
      };

      expect(
        hasAnyPermission(context, [
          PERMISSIONS.CREATE_LOGS,
          PERMISSIONS.APPROVE_LOGS,
          PERMISSIONS.CREATE_USERS,
        ])
      ).toBe(false);
    });

    it('should handle empty permissions array', () => {
      const context: PermissionContext = {
        userId: 'user-1',
        roles: ['admin'],
        permissions: [],
      };

      expect(hasAnyPermission(context, [])).toBe(false);
    });

    it('should handle single permission', () => {
      const context: PermissionContext = {
        userId: 'user-1',
        roles: ['captain'],
        permissions: [],
      };

      expect(hasAnyPermission(context, [PERMISSIONS.CREATE_LOGS])).toBe(true);
      expect(hasAnyPermission(context, [PERMISSIONS.APPROVE_LOGS])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all specified permissions', () => {
      const context: PermissionContext = {
        userId: 'user-1',
        roles: ['manager'],
        permissions: [],
      };

      expect(
        hasAllPermissions(context, [
          PERMISSIONS.VIEW_OWN_DASHBOARD,
          PERMISSIONS.VIEW_TEAM_DASHBOARD,
          PERMISSIONS.APPROVE_LOGS,
        ])
      ).toBe(true);
    });

    it('should return false if user is missing any permission', () => {
      const context: PermissionContext = {
        userId: 'user-1',
        roles: ['captain'],
        permissions: [],
      };

      expect(
        hasAllPermissions(context, [
          PERMISSIONS.VIEW_OWN_DASHBOARD, // Captain has this
          PERMISSIONS.APPROVE_LOGS, // Captain doesn't have this
        ])
      ).toBe(false);
    });

    it('should handle empty permissions array', () => {
      const context: PermissionContext = {
        userId: 'user-1',
        roles: ['wingman'],
        permissions: [],
      };

      expect(hasAllPermissions(context, [])).toBe(true);
    });

    it('should handle single permission', () => {
      const context: PermissionContext = {
        userId: 'user-1',
        roles: ['captain'],
        permissions: [],
      };

      expect(hasAllPermissions(context, [PERMISSIONS.CREATE_LOGS])).toBe(true);
      expect(hasAllPermissions(context, [PERMISSIONS.APPROVE_LOGS])).toBe(
        false
      );
    });
  });

  describe('canAccessResource', () => {
    it('should allow access to own resources', () => {
      const context: PermissionContext = {
        userId: 'user-1',
        roles: ['wingman'],
        permissions: [],
      };

      expect(
        canAccessResource(
          context,
          'user-1', // Same as userId
          PERMISSIONS.VIEW_OWN_PAYROLL
        )
      ).toBe(true);
    });

    it('should deny access to other resources without team permission', () => {
      const context: PermissionContext = {
        userId: 'user-1',
        roles: ['wingman'],
        permissions: [],
      };

      expect(
        canAccessResource(
          context,
          'user-2', // Different user
          PERMISSIONS.VIEW_OWN_PAYROLL
        )
      ).toBe(false);
    });

    it('should allow access to team resources with team permission', () => {
      const context: PermissionContext = {
        userId: 'manager-1',
        roles: ['manager'],
        permissions: [],
        teamMemberIds: ['user-1', 'user-2'],
      };

      expect(
        canAccessResource(
          context,
          'user-1', // Team member
          PERMISSIONS.VIEW_OWN_PAYROLL,
          PERMISSIONS.VIEW_TEAM_PAYROLL
        )
      ).toBe(true);
    });

    it('should allow access to all resources with all permission', () => {
      const context: PermissionContext = {
        userId: 'admin-1',
        roles: ['admin'],
        permissions: [],
      };

      expect(
        canAccessResource(
          context,
          'any-user',
          PERMISSIONS.VIEW_OWN_PAYROLL,
          PERMISSIONS.VIEW_TEAM_PAYROLL,
          PERMISSIONS.VIEW_ALL_PAYROLL
        )
      ).toBe(true);
    });

    it('should handle missing team member IDs', () => {
      const context: PermissionContext = {
        userId: 'manager-1',
        roles: ['manager'],
        permissions: [],
        // No teamMemberIds
      };

      expect(
        canAccessResource(
          context,
          'user-1',
          PERMISSIONS.VIEW_OWN_PAYROLL,
          PERMISSIONS.VIEW_TEAM_PAYROLL
        )
      ).toBe(false);
    });

    it('should handle optional team and all permissions', () => {
      const context: PermissionContext = {
        userId: 'user-1',
        roles: ['wingman'],
        permissions: [],
      };

      // Should work with just own permission
      expect(
        canAccessResource(context, 'user-1', PERMISSIONS.VIEW_OWN_PAYROLL)
      ).toBe(true);

      // Should fail for other user without team/all permissions
      expect(
        canAccessResource(context, 'user-2', PERMISSIONS.VIEW_OWN_PAYROLL)
      ).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('should return all permissions for admin', () => {
      const permissions = getUserPermissions(['admin']);
      const allPermissions = Object.values(PERMISSIONS);

      expect(permissions.length).toBe(allPermissions.length);
      allPermissions.forEach((permission) => {
        expect(permissions).toContain(permission);
      });
    });

    it('should combine permissions from multiple roles', () => {
      const permissions = getUserPermissions(['captain', 'sales']);
      const captainPermissions = ROLE_PERMISSIONS.captain;
      const salesPermissions = ROLE_PERMISSIONS.sales;

      // Should have permissions from both roles
      captainPermissions.forEach((permission) => {
        expect(permissions).toContain(permission);
      });
      salesPermissions.forEach((permission) => {
        expect(permissions).toContain(permission);
      });
    });

    it('should include explicit permissions', () => {
      const explicitPermissions = [PERMISSIONS.SYSTEM_SETTINGS];
      const permissions = getUserPermissions(['wingman'], explicitPermissions);

      expect(permissions).toContain(PERMISSIONS.SYSTEM_SETTINGS);
      ROLE_PERMISSIONS.wingman.forEach((permission) => {
        expect(permissions).toContain(permission);
      });
    });

    it('should deduplicate permissions', () => {
      const explicitPermissions = [PERMISSIONS.VIEW_OWN_DASHBOARD]; // Already in captain role
      const permissions = getUserPermissions(['captain'], explicitPermissions);

      const uniquePermissions = new Set(permissions);
      expect(uniquePermissions.size).toBe(permissions.length);
    });

    it('should handle empty roles', () => {
      const permissions = getUserPermissions([]);
      expect(permissions).toEqual([]);
    });

    it('should handle invalid roles gracefully', () => {
      const permissions = getUserPermissions(['invalid' as UserRole]);
      expect(permissions).toEqual([]);
    });

    it('should handle empty explicit permissions', () => {
      const permissions = getUserPermissions(['wingman'], []);
      expect(permissions).toEqual(ROLE_PERMISSIONS.wingman);
    });
  });

  describe('getPermissionRequiredRoles', () => {
    it('should return roles that have the permission', () => {
      const roles = getPermissionRequiredRoles(PERMISSIONS.VIEW_OWN_DASHBOARD);
      expect(roles).toContain('admin');
      expect(roles).toContain('manager');
      expect(roles).toContain('captain');
      expect(roles).toContain('sales');
      expect(roles).toContain('wingman');
    });

    it('should return limited roles for restricted permissions', () => {
      const roles = getPermissionRequiredRoles(PERMISSIONS.CREATE_USERS);
      expect(roles).toContain('admin');
      expect(roles).not.toContain('wingman');
      expect(roles).not.toContain('captain');
    });

    it('should return admin for admin-only permissions', () => {
      const roles = getPermissionRequiredRoles(PERMISSIONS.SYSTEM_SETTINGS);
      expect(roles).toContain('admin');
      expect(roles.length).toBe(1);
    });

    it('should handle permissions not assigned to any role', () => {
      const roles = getPermissionRequiredRoles(
        'non_existent_permission' as Permission
      );
      expect(roles).toEqual([]);
    });
  });

  describe('Permission Templates', () => {
    it('should have all required permission templates', () => {
      const expectedTemplates = [
        'BASIC_EMPLOYEE',
        'TEAM_LEAD',
        'SALES_SPECIALIST',
        'OPERATIONS_MANAGER',
      ];

      expectedTemplates.forEach((template) => {
        expect(PERMISSION_TEMPLATES).toHaveProperty(template);
        expect(
          PERMISSION_TEMPLATES[template as PermissionTemplate]
        ).toHaveProperty('name');
        expect(
          PERMISSION_TEMPLATES[template as PermissionTemplate]
        ).toHaveProperty('description');
        expect(
          PERMISSION_TEMPLATES[template as PermissionTemplate]
        ).toHaveProperty('permissions');
      });
    });

    it('should have valid permissions in each template', () => {
      Object.values(PERMISSION_TEMPLATES).forEach((template) => {
        expect(Array.isArray(template.permissions)).toBe(true);
        template.permissions.forEach((permission) => {
          expect(Object.values(PERMISSIONS)).toContain(permission);
        });
      });
    });

    it('should have appropriate permission levels', () => {
      const basicEmployee = PERMISSION_TEMPLATES.BASIC_EMPLOYEE;
      const teamLead = PERMISSION_TEMPLATES.TEAM_LEAD;
      const operationsManager = PERMISSION_TEMPLATES.OPERATIONS_MANAGER;

      // Team lead should have more permissions than basic employee
      expect(teamLead.permissions.length).toBeGreaterThan(
        basicEmployee.permissions.length
      );

      // Operations manager should have more permissions than team lead
      expect(operationsManager.permissions.length).toBeGreaterThan(
        teamLead.permissions.length
      );

      // All should have basic permissions
      expect(basicEmployee.permissions).toContain(
        PERMISSIONS.VIEW_OWN_DASHBOARD
      );
      expect(teamLead.permissions).toContain(PERMISSIONS.VIEW_OWN_DASHBOARD);
      expect(operationsManager.permissions).toContain(
        PERMISSIONS.VIEW_OWN_DASHBOARD
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined context gracefully', () => {
      const invalidContext = {
        userId: '',
        roles: [],
        permissions: [],
      };

      expect(
        hasPermission(invalidContext, PERMISSIONS.VIEW_OWN_DASHBOARD)
      ).toBe(false);
    });

    it('should handle invalid permission strings', () => {
      const context: PermissionContext = {
        userId: 'user-1',
        roles: ['admin'],
        permissions: [],
      };

      expect(hasPermission(context, 'invalid_permission')).toBe(false);
    });

    it('should handle duplicate roles', () => {
      const permissions = getUserPermissions(['captain', 'captain', 'captain']);
      const uniquePermissions = new Set(permissions);
      expect(uniquePermissions.size).toBe(permissions.length);
    });

    it('should handle duplicate permissions in explicit list', () => {
      const explicitPermissions = [
        PERMISSIONS.VIEW_OWN_DASHBOARD,
        PERMISSIONS.VIEW_OWN_DASHBOARD,
        PERMISSIONS.VIEW_OWN_DASHBOARD,
      ];
      const permissions = getUserPermissions(['wingman'], explicitPermissions);
      const uniquePermissions = new Set(permissions);
      expect(uniquePermissions.size).toBe(permissions.length);
    });

    it('should handle very large permission arrays', () => {
      const largePermissionArray = Array(1000).fill(
        PERMISSIONS.VIEW_OWN_DASHBOARD
      );
      const context: PermissionContext = {
        userId: 'user-1',
        roles: [],
        permissions: largePermissionArray,
      };

      expect(hasPermission(context, PERMISSIONS.VIEW_OWN_DASHBOARD)).toBe(true);
    });

    it('should handle empty strings in roles and permissions', () => {
      const context: PermissionContext = {
        userId: 'user-1',
        roles: ['' as UserRole],
        permissions: [''],
      };

      expect(hasPermission(context, PERMISSIONS.VIEW_OWN_DASHBOARD)).toBe(
        false
      );
    });

    it('should handle case sensitivity', () => {
      const context: PermissionContext = {
        userId: 'user-1',
        roles: ['ADMIN' as UserRole], // Wrong case
        permissions: [],
      };

      expect(hasPermission(context, PERMISSIONS.VIEW_OWN_DASHBOARD)).toBe(
        false
      );
    });

    it('should handle special characters in user IDs', () => {
      const context: PermissionContext = {
        userId: 'user-1@domain.com',
        roles: ['wingman'],
        permissions: [],
        teamMemberIds: ['user-1@domain.com'],
      };

      expect(
        canAccessResource(
          context,
          'user-1@domain.com',
          PERMISSIONS.VIEW_OWN_PAYROLL
        )
      ).toBe(true);
    });

    it('should handle very long permission names', () => {
      const longPermission = 'a'.repeat(1000);
      const context: PermissionContext = {
        userId: 'user-1',
        roles: [],
        permissions: [longPermission],
      };

      expect(hasPermission(context, longPermission)).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large numbers of roles efficiently', () => {
      const startTime = Date.now();
      const manyRoles = Array(100).fill('admin') as UserRole[];
      const permissions = getUserPermissions(manyRoles);
      const endTime = Date.now();

      expect(permissions.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    it('should handle large numbers of permissions efficiently', () => {
      const startTime = Date.now();
      const manyPermissions = Array(1000).fill(PERMISSIONS.VIEW_OWN_DASHBOARD);
      const context: PermissionContext = {
        userId: 'user-1',
        roles: [],
        permissions: manyPermissions,
      };

      const result = hasPermission(context, PERMISSIONS.VIEW_OWN_DASHBOARD);
      const endTime = Date.now();

      expect(result).toBe(true);
      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
    });

    it('should handle complex permission checking efficiently', () => {
      const startTime = Date.now();
      const context: PermissionContext = {
        userId: 'user-1',
        roles: ['admin', 'manager', 'captain'],
        permissions: Object.values(PERMISSIONS),
        teamMemberIds: Array(100)
          .fill(0)
          .map((_, i) => `user-${i}`),
      };

      // Check many permissions
      Object.values(PERMISSIONS).forEach((permission) => {
        hasPermission(context, permission);
      });

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should still be fast
    });
  });
});
