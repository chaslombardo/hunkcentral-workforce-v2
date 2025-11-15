// Session management hook
'use client';

import { useSession as useNextAuthSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import type { UserRole } from '@/types';
import type { SessionUser } from '@/lib/auth';

export function useSession() {
  const { data: session, status, update } = useNextAuthSession();
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [impersonationError, setImpersonationError] = useState<string | null>(
    null
  );
  const [isStoppingImpersonation, setIsStoppingImpersonation] = useState(false);

  const user = session?.user as SessionUser | undefined;
  const impersonation = session?.impersonation;

  // Validate session integrity
  useEffect(() => {
    if (status === 'authenticated' && session) {
      // Check if session has required fields
      if (!user?.id || !user?.email || !user?.roles) {
        setSessionError('Invalid session data');
        console.error('Invalid session structure:', {
          hasId: !!user?.id,
          hasEmail: !!user?.email,
          hasRoles: !!user?.roles,
        });
      } else {
        setSessionError(null);
      }
    }
  }, [session, status, user]);

  const hasRole = (role: UserRole): boolean => {
    if (sessionError) return false;
    return user?.roles?.includes(role) ?? false;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (sessionError) return false;
    return roles.some((role) => hasRole(role));
  };

  const refreshSession = async () => {
    try {
      await update();
      setSessionError(null);
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setSessionError('Failed to refresh session');
    }
  };

  const stopImpersonation = async () => {
    if (!impersonation?.isImpersonating) {
      return;
    }

    setIsStoppingImpersonation(true);
    setImpersonationError(null);
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to stop impersonation');
      }
      await refreshSession();
    } catch (error) {
      console.error('Failed to stop impersonation:', error);
      setImpersonationError(
        error instanceof Error ? error.message : 'Failed to stop impersonation'
      );
    } finally {
      setIsStoppingImpersonation(false);
    }
  };

  const isAdmin = hasRole('admin');
  const isManager = hasRole('manager');
  const isCaptain = hasRole('captain');
  const isSales = hasRole('sales');
  const isWingman = hasRole('wingman');
  const isImpersonating = impersonation?.isImpersonating ?? false;

  return {
    session,
    user,
    status,
    sessionError,
    impersonationError,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated' && !sessionError,
    hasRole,
    hasAnyRole,
    isAdmin,
    isManager,
    isCaptain,
    isSales,
    isWingman,
    refreshSession,
    impersonation,
    isImpersonating,
    stopImpersonation,
    isStoppingImpersonation,
  };
}
