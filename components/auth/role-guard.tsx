'use client';

import { useSession } from '@/hooks/useSession';
import type { UserRole } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRoles: UserRole[];
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, user must have ALL roles, if false, user needs ANY role
}

export function RoleGuard({
  children,
  requiredRoles,
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

  const hasAccess = requireAll
    ? requiredRoles.every((role) => user.roles.includes(role))
    : requiredRoles.some((role) => user.roles.includes(role));

  if (!hasAccess) {
    return (
      fallback || (
        <Alert variant="destructive">
          <AlertDescription>
            You don&apos;t have permission to view this content. Required roles:{' '}
            {requiredRoles.join(requireAll ? ' and ' : ' or ')}
          </AlertDescription>
        </Alert>
      )
    );
  }

  return <>{children}</>;
}
