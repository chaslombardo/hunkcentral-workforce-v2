import NextAuth from 'next-auth';
import type { UserRole } from './index';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      fullName: string;
      username?: string | null;
      roles: UserRole[];
      permissions?: string[];
      commissionRate?: number | null;
      isActive?: boolean;
      originalUserId?: string;
      originalFullName?: string;
      originalRoles?: UserRole[];
      impersonatedUserId?: string;
      impersonatedFullName?: string;
      impersonatedRoles?: UserRole[];
      impersonationStartedAt?: string;
      isImpersonating?: boolean;
    };
    impersonation?: {
      isImpersonating: boolean;
      originalUserId?: string;
      originalFullName?: string;
      targetUserId?: string;
      targetFullName?: string;
      startedAt?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    fullName: string;
    username?: string | null;
    roles: UserRole[];
    permissions?: string[];
    commissionRate?: number | null;
    isActive?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    fullName: string;
    roles: UserRole[];
    permissions?: string[];
    commissionRate?: number | null;
    username?: string | null;
    isActive?: boolean;
    originalUserId?: string;
    originalFullName?: string;
    originalRoles?: UserRole[];
    impersonatedUserId?: string;
    impersonatedFullName?: string;
    impersonatedRoles?: UserRole[];
    impersonationStartedAt?: string;
  }
}
