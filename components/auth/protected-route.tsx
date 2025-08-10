// Protected route wrapper with role-based access control
'use client';

import { useSession } from '@/hooks/useSession';
import { hasRouteAccess } from '@/lib/routes';
import type { UserRole } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BrandButton } from '@/components/brand/brand-button';
import { BrandLoading } from '@/components/brand/brand-loading';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  currentRoute?: string;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  currentRoute,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <BrandLoading variant="spinner" size="lg" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <p className="text-muted-foreground">
            Please sign in to access this page.
          </p>
          <BrandButton asChild variant="primary">
            <Link href="/auth/login">Sign In</Link>
          </BrandButton>
        </div>
      </div>
    );
  }

  // Check role-based access
  if (
    requiredRoles &&
    !requiredRoles.some((role) => user.roles.includes(role))
  ) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            You don&apos;t have permission to access this page. Required roles:{' '}
            {requiredRoles.join(', ')}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <BrandButton asChild variant="outline">
            <Link href="/dashboard">Return to Dashboard</Link>
          </BrandButton>
        </div>
      </div>
    );
  }

  // Check route-based access
  if (currentRoute && !hasRouteAccess(currentRoute, user.roles)) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            You don&apos;t have permission to access this page.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <BrandButton asChild variant="outline">
            <Link href="/dashboard">Return to Dashboard</Link>
          </BrandButton>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
