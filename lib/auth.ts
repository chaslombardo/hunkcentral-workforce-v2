// Authentication utilities and session helpers
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { getMonitoring, logAuthError } from '@/lib/monitoring';
import { prisma } from '@/lib/prisma';
import type { User, UserRole } from '@/types';

export type { UserRole, User };

export interface SessionUser {
  id: string;
  email: string;
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
}

// Server-side session helper (alias for compatibility)
export async function auth() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    await logAuthError(error, {
      action: 'session_validation',
      url: '/auth-helper',
      additionalData: { function: 'auth' },
    });
    return null;
  }
}

// Server-side session helper
export async function getSession() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    await logAuthError(error, {
      action: 'session_validation',
      url: '/auth-helper',
      additionalData: { function: 'getSession' },
    });
    return null;
  }
}

// Server-side user helper with validation
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return null;
    }

    const user = session.user as SessionUser;

    // Validate user still exists in database
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          fullName: true,
          roles: true,
          username: true,
          isActive: true,
        },
      });

      if (!dbUser) {
        await logAuthError(
          new Error('Session user no longer exists in database'),
          {
            action: 'session_validation',
            userId: user.id,
            url: '/current-user',
            additionalData: { sessionEmail: user.email },
          }
        );
        return null;
      }

      // Return user with current database data
      return {
        id: dbUser.id,
        email: dbUser.email,
        fullName: dbUser.fullName,
        username: dbUser.username,
        roles: dbUser.roles as UserRole[],
        isActive: dbUser.isActive,
      };
    } catch (dbError) {
      await logAuthError(dbError, {
        action: 'session_validation',
        userId: user.id,
        url: '/current-user',
        additionalData: { error: 'database_validation_failed' },
      });
      // Return session user if database validation fails
      return user;
    }
  } catch (error) {
    await logAuthError(error, {
      action: 'session_validation',
      url: '/current-user',
      additionalData: { function: 'getCurrentUser' },
    });
    return null;
  }
}

// Enhanced session validation with error recovery
export async function validateSession(): Promise<{
  user: SessionUser | null;
  isValid: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { user: null, isValid: false, error: 'No valid session' };
    }

    return { user, isValid: true };
  } catch (error) {
    await logAuthError(error, {
      action: 'session_validation',
      url: '/validate-session',
      additionalData: { function: 'validateSession' },
    });

    return {
      user: null,
      isValid: false,
      error:
        error instanceof Error ? error.message : 'Session validation failed',
    };
  }
}

// Role checking utilities
export function hasRole(user: SessionUser | User, role: UserRole): boolean {
  return user.roles.includes(role);
}

export function hasAnyRole(
  user: SessionUser | User,
  roles: UserRole[]
): boolean {
  return roles.some((role) => user.roles.includes(role));
}

export function requireAuth(
  user: SessionUser | User | null,
  context?: { url?: string; action?: string }
): asserts user is SessionUser | User {
  if (!user) {
    const error = new Error('Authentication required');
    if (context) {
      logAuthError(error, {
        action: 'permission_check',
        url: context.url || '/unknown',
        additionalData: {
          check: 'requireAuth',
          action: context.action,
        },
      });
    }
    throw error;
  }
}

export function requireRole(
  user: SessionUser | User | null,
  role: UserRole,
  context?: { url?: string; action?: string }
): asserts user is SessionUser | User {
  requireAuth(user, context);
  if (!hasRole(user, role)) {
    const error = new Error(`Role '${role}' required`);
    if (context) {
      logAuthError(error, {
        action: 'permission_check',
        userId: user.id,
        url: context.url || '/unknown',
        additionalData: {
          check: 'requireRole',
          requiredRole: role,
          userRoles: user.roles,
          action: context.action,
        },
      });
    }
    throw error;
  }
}

export function requireAnyRole(
  user: SessionUser | User | null,
  roles: UserRole[],
  context?: { url?: string; action?: string }
): asserts user is SessionUser | User {
  requireAuth(user, context);
  if (roles.length > 0 && !hasAnyRole(user, roles)) {
    const error = new Error(`One of roles [${roles.join(', ')}] required`);
    if (context) {
      logAuthError(error, {
        action: 'permission_check',
        userId: user.id,
        url: context.url || '/unknown',
        additionalData: {
          check: 'requireAnyRole',
          requiredRoles: roles,
          userRoles: user.roles,
          action: context.action,
        },
      });
    }
    throw error;
  }
}

// Manager access control utilities
export function getManagerAccessibleRoles(): UserRole[] {
  return ['captain', 'wingman'];
}

export function canManagerAccessUser(
  managerUser: SessionUser | User,
  targetUser: SessionUser | User
): boolean {
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
    return targetUser.roles.some((role) => accessibleRoles.includes(role));
  }

  return false;
}

export function canUserAccessUserData(
  currentUser: SessionUser | User,
  targetUserId: string
): boolean {
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
