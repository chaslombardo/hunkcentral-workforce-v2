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

// Server-side session helper (alias for compatibility)
export async function auth() {
  return await getServerSession(authOptions);
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

// Manager access control utilities
export function getManagerAccessibleRoles(): UserRole[] {
  return ['captain', 'wingman'];
}

export function canManagerAccessUser(managerUser: SessionUser | User, targetUser: SessionUser | User): boolean {
  // Users can access themselves
  if (managerUser.id === targetUser.id) {
    return true;
  }
  
  // Admins can access anyone
  if (hasRole(managerUser, 'admin')) {
    return true;
  }
  
  // Managers can only access captains and wingmen
  if (hasRole(managerUser, 'manager')) {
    const accessibleRoles = getManagerAccessibleRoles();
    return targetUser.roles.some(role => accessibleRoles.includes(role));
  }
  
  return false;
}

export function canUserAccessUserData(currentUser: SessionUser | User, targetUserId: string): boolean {
  // Admins can access anyone
  if (hasRole(currentUser, 'admin')) {
    return true;
  }
  
  // Users can access themselves
  if (currentUser.id === targetUserId) {
    return true;
  }
  
  // Managers can access captains and wingmen (will be verified at data level)
  if (hasRole(currentUser, 'manager')) {
    return true; // Actual filtering happens in data queries
  }
  
  return false;
}

export function shouldFilterUsersForManager(user: SessionUser | User): boolean {
  return hasRole(user, 'manager') && !hasRole(user, 'admin');
}
