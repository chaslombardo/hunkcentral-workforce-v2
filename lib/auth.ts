// Authentication utilities and session helpers
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import type { User, UserRole } from '@/types';

export type { UserRole, User };

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  roles: UserRole[];
}

// Server-side session helper
export async function getSession() {
  return await getServerSession(authOptions);
}

// Server-side user helper
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session?.user as SessionUser | null;
}

// Role checking utilities
export function hasRole(user: SessionUser | User, role: UserRole): boolean {
  return user.roles.includes(role);
}

export function hasAnyRole(user: SessionUser | User, roles: UserRole[]): boolean {
  return roles.some((role) => user.roles.includes(role));
}

export function requireAuth(user: SessionUser | User | null): asserts user is SessionUser | User {
  if (!user) {
    throw new Error('Authentication required');
  }
}

export function requireRole(user: SessionUser | User | null, role: UserRole): asserts user is SessionUser | User {
  requireAuth(user);
  if (!hasRole(user, role)) {
    throw new Error(`Role '${role}' required`);
  }
}

export function requireAnyRole(user: SessionUser | User | null, roles: UserRole[]): asserts user is SessionUser | User {
  requireAuth(user);
  if (roles.length > 0 && !hasAnyRole(user, roles)) {
    throw new Error(`One of roles [${roles.join(', ')}] required`);
  }
}
