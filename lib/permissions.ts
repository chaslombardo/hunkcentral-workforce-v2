/**
 * Granular Permission System for HUNKCentral
 *
 * This module provides comprehensive permission management with:
 * - Role-based permissions with granular overrides
 * - Location-based access control
 * - Permission checking utilities
 * - Permission templates and custom sets
 */

import type { UserRole } from '@/types';

// Define all available permissions in the system
export const PERMISSIONS = {
  // Dashboard Access
  VIEW_OWN_DASHBOARD: 'view_own_dashboard',
  VIEW_TEAM_DASHBOARD: 'view_team_dashboard',
  VIEW_ALL_DASHBOARDS: 'view_all_dashboards',

  // Log Management
  CREATE_LOGS: 'create_logs',
  EDIT_OWN_LOGS: 'edit_own_logs',
  EDIT_TEAM_LOGS: 'edit_team_logs',
  EDIT_ALL_LOGS: 'edit_all_logs',
  APPROVE_LOGS: 'approve_logs',
  DELETE_LOGS: 'delete_logs',
  VIEW_LOG_AUDIT_TRAIL: 'view_log_audit_trail',

  // Commission Management
  CREATE_COMMISSIONS: 'create_commissions',
  VIEW_OWN_COMMISSIONS: 'view_own_commissions',
  VIEW_TEAM_COMMISSIONS: 'view_team_commissions',
  VIEW_ALL_COMMISSIONS: 'view_all_commissions',
  EDIT_COMMISSIONS: 'edit_commissions',
  APPROVE_COMMISSIONS: 'approve_commissions',
  DELETE_COMMISSIONS: 'delete_commissions',

  // Payroll & Reports
  VIEW_OWN_PAYROLL: 'view_own_payroll',
  VIEW_TEAM_PAYROLL: 'view_team_payroll',
  VIEW_ALL_PAYROLL: 'view_all_payroll',
  GENERATE_REPORTS: 'generate_reports',
  EXPORT_PAYROLL: 'export_payroll',
  VIEW_PAYROLL_ANALYTICS: 'view_payroll_analytics',

  // User Management
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  MANAGE_PERMISSIONS: 'manage_permissions',
  MANAGE_ROLES: 'manage_roles',

  // System Administration
  MANAGE_PAY_PERIODS: 'manage_pay_periods',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  SYSTEM_SETTINGS: 'system_settings',
  MANAGE_LOCATIONS: 'manage_locations',
  VIEW_SYSTEM_HEALTH: 'view_system_health',

  // Performance Rankings
  VIEW_PERFORMANCE_RANKINGS: 'view_performance_rankings',
  VIEW_DETAILED_RANKINGS: 'view_detailed_rankings',
  EXPORT_RANKINGS: 'export_rankings',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  DASHBOARD_ACCESS: {
    name: 'Dashboard Access',
    description: 'Control access to different dashboard views',
    permissions: [
      PERMISSIONS.VIEW_OWN_DASHBOARD,
      PERMISSIONS.VIEW_TEAM_DASHBOARD,
      PERMISSIONS.VIEW_ALL_DASHBOARDS,
    ],
  },
  LOG_MANAGEMENT: {
    name: 'Log Management',
    description: 'Control log creation, editing, and approval',
    permissions: [
      PERMISSIONS.CREATE_LOGS,
      PERMISSIONS.EDIT_OWN_LOGS,
      PERMISSIONS.EDIT_TEAM_LOGS,
      PERMISSIONS.EDIT_ALL_LOGS,
      PERMISSIONS.APPROVE_LOGS,
      PERMISSIONS.DELETE_LOGS,
      PERMISSIONS.VIEW_LOG_AUDIT_TRAIL,
    ],
  },
  COMMISSION_MANAGEMENT: {
    name: 'Commission Management',
    description: 'Control commission entry and tracking',
    permissions: [
      PERMISSIONS.CREATE_COMMISSIONS,
      PERMISSIONS.VIEW_OWN_COMMISSIONS,
      PERMISSIONS.VIEW_TEAM_COMMISSIONS,
      PERMISSIONS.VIEW_ALL_COMMISSIONS,
      PERMISSIONS.EDIT_COMMISSIONS,
      PERMISSIONS.APPROVE_COMMISSIONS,
      PERMISSIONS.DELETE_COMMISSIONS,
    ],
  },
  PAYROLL_REPORTS: {
    name: 'Payroll & Reports',
    description: 'Control payroll access and report generation',
    permissions: [
      PERMISSIONS.VIEW_OWN_PAYROLL,
      PERMISSIONS.VIEW_TEAM_PAYROLL,
      PERMISSIONS.VIEW_ALL_PAYROLL,
      PERMISSIONS.GENERATE_REPORTS,
      PERMISSIONS.EXPORT_PAYROLL,
      PERMISSIONS.VIEW_PAYROLL_ANALYTICS,
    ],
  },
  USER_MANAGEMENT: {
    name: 'User Management',
    description: 'Control user account management',
    permissions: [
      PERMISSIONS.VIEW_USERS,
      PERMISSIONS.CREATE_USERS,
      PERMISSIONS.EDIT_USERS,
      PERMISSIONS.DELETE_USERS,
      PERMISSIONS.MANAGE_PERMISSIONS,
      PERMISSIONS.MANAGE_ROLES,
    ],
  },
  SYSTEM_ADMINISTRATION: {
    name: 'System Administration',
    description: 'Control system-level settings and monitoring',
    permissions: [
      PERMISSIONS.MANAGE_PAY_PERIODS,
      PERMISSIONS.VIEW_AUDIT_LOGS,
      PERMISSIONS.SYSTEM_SETTINGS,
      PERMISSIONS.MANAGE_LOCATIONS,
      PERMISSIONS.VIEW_SYSTEM_HEALTH,
    ],
  },
  PERFORMANCE_RANKINGS: {
    name: 'Performance Rankings',
    description: 'Control access to performance rankings and analytics',
    permissions: [
      PERMISSIONS.VIEW_PERFORMANCE_RANKINGS,
      PERMISSIONS.VIEW_DETAILED_RANKINGS,
      PERMISSIONS.EXPORT_RANKINGS,
    ],
  },
} as const;

// Default role-based permission templates
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Full access to everything
    ...Object.values(PERMISSIONS),
  ],
  manager: [
    // Dashboard access
    PERMISSIONS.VIEW_OWN_DASHBOARD,
    PERMISSIONS.VIEW_TEAM_DASHBOARD,

    // Log management
    PERMISSIONS.CREATE_LOGS,
    PERMISSIONS.EDIT_OWN_LOGS,
    PERMISSIONS.EDIT_TEAM_LOGS,
    PERMISSIONS.APPROVE_LOGS,
    PERMISSIONS.VIEW_LOG_AUDIT_TRAIL,

    // Commission management
    PERMISSIONS.VIEW_OWN_COMMISSIONS,
    PERMISSIONS.VIEW_TEAM_COMMISSIONS,
    PERMISSIONS.APPROVE_COMMISSIONS,

    // Payroll & reports
    PERMISSIONS.VIEW_OWN_PAYROLL,
    PERMISSIONS.VIEW_TEAM_PAYROLL,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.VIEW_PAYROLL_ANALYTICS,

    // User management (limited)
    PERMISSIONS.VIEW_USERS,

    // System administration (limited)
    PERMISSIONS.VIEW_AUDIT_LOGS,

    // Performance rankings
    PERMISSIONS.VIEW_PERFORMANCE_RANKINGS,
    PERMISSIONS.VIEW_DETAILED_RANKINGS,
    PERMISSIONS.EXPORT_RANKINGS,
  ],
  captain: [
    // Dashboard access
    PERMISSIONS.VIEW_OWN_DASHBOARD,

    // Log management
    PERMISSIONS.CREATE_LOGS,
    PERMISSIONS.EDIT_OWN_LOGS,

    // Commission management
    PERMISSIONS.VIEW_OWN_COMMISSIONS,

    // Payroll & reports
    PERMISSIONS.VIEW_OWN_PAYROLL,

    // Performance rankings
    PERMISSIONS.VIEW_PERFORMANCE_RANKINGS,
  ],
  sales: [
    // Dashboard access
    PERMISSIONS.VIEW_OWN_DASHBOARD,

    // Commission management
    PERMISSIONS.CREATE_COMMISSIONS,
    PERMISSIONS.VIEW_OWN_COMMISSIONS,
    PERMISSIONS.EDIT_COMMISSIONS,

    // Payroll & reports
    PERMISSIONS.VIEW_OWN_PAYROLL,

    // Performance rankings
    PERMISSIONS.VIEW_PERFORMANCE_RANKINGS,
  ],
  wingman: [
    // Dashboard access
    PERMISSIONS.VIEW_OWN_DASHBOARD,

    // Payroll & reports
    PERMISSIONS.VIEW_OWN_PAYROLL,

    // Performance rankings
    PERMISSIONS.VIEW_PERFORMANCE_RANKINGS,
  ],
};

// Permission checking utilities
export interface PermissionContext {
  userId: string;
  roles: UserRole[];
  permissions: string[];
  locationId?: string;
  teamMemberIds?: string[];
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  context: PermissionContext,
  permission: string
): boolean {
  // Check explicit permissions first
  if (context.permissions.includes(permission)) {
    return true;
  }

  // Check role-based permissions
  return context.roles.some((role) =>
    ROLE_PERMISSIONS[role]?.includes(permission as Permission)
  );
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  context: PermissionContext,
  permissions: string[]
): boolean {
  return permissions.some((permission) => hasPermission(context, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
  context: PermissionContext,
  permissions: string[]
): boolean {
  return permissions.every((permission) => hasPermission(context, permission));
}

/**
 * Check if a user can access a specific resource based on ownership
 */
export function canAccessResource(
  context: PermissionContext,
  resourceOwnerId: string,
  viewOwnPermission: string,
  viewTeamPermission?: string,
  viewAllPermission?: string
): boolean {
  // Check if user owns the resource
  if (
    resourceOwnerId === context.userId &&
    hasPermission(context, viewOwnPermission)
  ) {
    return true;
  }

  // Check if user can view team resources
  if (
    viewTeamPermission &&
    context.teamMemberIds?.includes(resourceOwnerId) &&
    hasPermission(context, viewTeamPermission)
  ) {
    return true;
  }

  // Check if user can view all resources
  if (viewAllPermission && hasPermission(context, viewAllPermission)) {
    return true;
  }

  return false;
}

/**
 * Get all permissions for a user based on their roles and explicit permissions
 */
export function getUserPermissions(
  roles: UserRole[],
  explicitPermissions: string[] = []
): string[] {
  const rolePermissions = roles.flatMap((role) => ROLE_PERMISSIONS[role] || []);
  const allPermissions = [
    ...new Set([...rolePermissions, ...explicitPermissions]),
  ];
  return allPermissions;
}

/**
 * Check if a permission requires a specific role
 */
export function getPermissionRequiredRoles(permission: Permission): UserRole[] {
  const requiredRoles: UserRole[] = [];

  for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    if (permissions.includes(permission)) {
      requiredRoles.push(role as UserRole);
    }
  }

  return requiredRoles;
}

/**
 * Get permission templates for easy assignment
 */
export const PERMISSION_TEMPLATES = {
  BASIC_EMPLOYEE: {
    name: 'Basic Employee',
    description: 'Standard permissions for regular employees',
    permissions: [
      PERMISSIONS.VIEW_OWN_DASHBOARD,
      PERMISSIONS.VIEW_OWN_PAYROLL,
      PERMISSIONS.VIEW_PERFORMANCE_RANKINGS,
    ],
  },
  TEAM_LEAD: {
    name: 'Team Lead',
    description: 'Additional permissions for team leadership',
    permissions: [
      PERMISSIONS.VIEW_OWN_DASHBOARD,
      PERMISSIONS.VIEW_TEAM_DASHBOARD,
      PERMISSIONS.EDIT_TEAM_LOGS,
      PERMISSIONS.VIEW_TEAM_PAYROLL,
      PERMISSIONS.VIEW_PERFORMANCE_RANKINGS,
      PERMISSIONS.VIEW_DETAILED_RANKINGS,
    ],
  },
  SALES_SPECIALIST: {
    name: 'Sales Specialist',
    description: 'Enhanced permissions for sales staff',
    permissions: [
      PERMISSIONS.VIEW_OWN_DASHBOARD,
      PERMISSIONS.CREATE_COMMISSIONS,
      PERMISSIONS.VIEW_OWN_COMMISSIONS,
      PERMISSIONS.EDIT_COMMISSIONS,
      PERMISSIONS.VIEW_OWN_PAYROLL,
      PERMISSIONS.VIEW_PERFORMANCE_RANKINGS,
    ],
  },
  OPERATIONS_MANAGER: {
    name: 'Operations Manager',
    description: 'Comprehensive permissions for operations management',
    permissions: [
      PERMISSIONS.VIEW_OWN_DASHBOARD,
      PERMISSIONS.VIEW_TEAM_DASHBOARD,
      PERMISSIONS.EDIT_TEAM_LOGS,
      PERMISSIONS.APPROVE_LOGS,
      PERMISSIONS.VIEW_TEAM_PAYROLL,
      PERMISSIONS.GENERATE_REPORTS,
      PERMISSIONS.VIEW_AUDIT_LOGS,
      PERMISSIONS.VIEW_PERFORMANCE_RANKINGS,
      PERMISSIONS.VIEW_DETAILED_RANKINGS,
      PERMISSIONS.EXPORT_RANKINGS,
    ],
  },
} as const;

export type PermissionTemplate = keyof typeof PERMISSION_TEMPLATES;
