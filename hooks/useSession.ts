// Session management hook
'use client';

import { useSession as useNextAuthSession } from 'next-auth/react';
import type { User, UserRole } from '@/types';

export function useSession() {
  const { data: session, status } = useNextAuthSession();

  const user = session?.user as User | undefined;

  const hasRole = (role: UserRole): boolean => {
    return user?.roles?.includes(role) ?? false;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some((role) => hasRole(role));
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
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    hasRole,
    hasAnyRole,
    isAdmin,
    isManager,
    isCaptain,
    isSales,
    isWingman,
  };
}
