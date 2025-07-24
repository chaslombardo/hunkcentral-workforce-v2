// Authentication utilities and session helpers
// This will be implemented in later tasks

export type UserRole = 'admin' | 'manager' | 'captain' | 'sales' | 'wingman';

export interface User {
  id: string;
  email: string;
  fullName: string;
  roles: UserRole[];
}

export interface Session {
  user: User;
  expires: string;
}

// Placeholder functions - will be implemented with NextAuth.js
export async function getSession(): Promise<Session | null> {
  // TODO: Implement with NextAuth.js
  return null;
}

export function hasRole(user: User, role: UserRole): boolean {
  return user.roles.includes(role);
}

export function hasAnyRole(user: User, roles: UserRole[]): boolean {
  return roles.some((role) => user.roles.includes(role));
}
