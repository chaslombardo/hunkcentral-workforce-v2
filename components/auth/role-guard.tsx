'use client';

import { useSession } from '@/hooks/useSession';
import type { UserRole } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessResource,
  getUserPermissions,
  type PermissionContext,
} from '@/lib/permissions';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  requiredAnyPermissions?: string[];
  resourceOwnerId?: string;
  viewOwnPermission?: string;
  viewTeamPermission?: string;
  viewAllPermission?: string;
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, user must have ALL roles/permissions
}

export function RoleGuard({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requiredAnyPermissions = [],
  resourceOwnerId,
  viewOwnPermission,
  viewTeamPermission,
  viewAllPermission,
  fallback,
  requireAll = false,
}: RoleGuardProps) {
  const { user, isAuthenticated, isLoading } = useSession();

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  if (!isAuthenticated || !user) {
    return fallback || null;
  }

  // Create permission context
  const context: PermissionContext = {
    userId: user.id,
    roles: user.roles,
    permissions: user.permissions || [],
    // TODO: Add location and team member IDs when implemented
  };

  let hasAccess = true;

  // Check role-based access (legacy support)
  if (requiredRoles.length > 0) {
    const roleAccess = requireAll
      ? requiredRoles.every((role) => user.roles.includes(role))
      : requiredRoles.some((role) => user.roles.includes(role));

    if (!roleAccess) {
      hasAccess = false;
    }
  }

  // Check permission-based access
  if (requiredPermissions.length > 0) {
    const permissionAccess = requireAll
      ? hasAllPermissions(context, requiredPermissions)
      : hasAnyPermission(context, requiredPermissions);

    if (!permissionAccess) {
      hasAccess = false;
    }
  }

  // Check "any permissions" access
  if (requiredAnyPermissions.length > 0) {
    if (!hasAnyPermission(context, requiredAnyPermissions)) {
      hasAccess = false;
    }
  }

  // Check resource-based access
  if (resourceOwnerId && viewOwnPermission) {
    if (
      !canAccessResource(
        context,
        resourceOwnerId,
        viewOwnPermission,
        viewTeamPermission,
        viewAllPermission
      )
    ) {
      hasAccess = false;
    }
  }

  if (!hasAccess) {
    const requirements = [];
    if (requiredRoles.length > 0) {
      requirements.push(
        `Roles: ${requiredRoles.join(requireAll ? ' and ' : ' or ')}`
      );
    }
    if (requiredPermissions.length > 0) {
      requirements.push(
        `Permissions: ${requiredPermissions.join(requireAll ? ' and ' : ' or ')}`
      );
    }
    if (requiredAnyPermissions.length > 0) {
      requirements.push(`Any of: ${requiredAnyPermissions.join(' or ')}`);
    }

    return (
      fallback || (
        <Alert variant="destructive">
          <AlertDescription>
            You don&apos;t have permission to view this content.
            {requirements.length > 0 && (
              <>
                <br />
                Required: {requirements.join('; ')}
              </>
            )}
          </AlertDescription>
        </Alert>
      )
    );
  }

  return <>{children}</>;
}

// Hook for permission checking in components
export function usePermissions() {
  const { user, isAuthenticated } = useSession();

  if (!isAuthenticated || !user) {
    return {
      hasPermission: () => false,
      hasAnyPermission: () => false,
      hasAllPermissions: () => false,
      canAccessResource: () => false,
      userPermissions: [],
    };
  }

  const context: PermissionContext = {
    userId: user.id,
    roles: user.roles,
    permissions: user.permissions || [],
  };

  return {
    hasPermission: (permission: string) => hasPermission(context, permission),
    hasAnyPermission: (permissions: string[]) =>
      hasAnyPermission(context, permissions),
    hasAllPermissions: (permissions: string[]) =>
      hasAllPermissions(context, permissions),
    canAccessResource: (
      resourceOwnerId: string,
      viewOwnPermission: string,
      viewTeamPermission?: string,
      viewAllPermission?: string
    ) =>
      canAccessResource(
        context,
        resourceOwnerId,
        viewOwnPermission,
        viewTeamPermission,
        viewAllPermission
      ),
    userPermissions: getUserPermissions(user.roles, user.permissions || []),
  };
}
