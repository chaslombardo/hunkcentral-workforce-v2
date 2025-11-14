// Session management hook
'use client';

import { useSession as useNextAuthSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import type { UserRole } from '@/types';
import type { SessionUser } from '@/lib/auth';

export function useSession() {
  const { data: session, status, update } = useNextAuthSession();
  const [sessionError, setSessionError] = useState<string | null>(null);

  const user = session?.user as SessionUser | undefined;

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

  const isAdmin = hasRole('admin');
  const isManager = hasRole('manager');
  const isCaptain = hasRole('captain');
  const isSales = hasRole('sales');
  const isWingman = hasRole('wingman');

  return {
    session,
    user,
    status,
    sessionError,
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
  };
}
