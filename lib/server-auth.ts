// Server-side authentication utilities with enhanced error handling
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { logAuthError } from '@/lib/errorLogger';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import type { SessionUser } from '@/lib/auth';
import type { UserRole } from '@/types';

export interface AuthValidationResult {
  user: SessionUser | null;
  isValid: boolean;
  error?: string;
  shouldRedirect?: boolean;
  redirectUrl?: string;
}

/**
 * Enhanced server-side session validation with error recovery
 */
export async function validateServerSession(
  request?: NextRequest,
  options?: {
    requireAuth?: boolean;
    requiredRoles?: UserRole[];
    redirectOnFailure?: boolean;
  }
): Promise<AuthValidationResult> {
  const { requireAuth = false, requiredRoles = [], redirectOnFailure = false } = options || {};
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      const error = 'No valid session found';
      
      if (request) {
        await logAuthError(new Error(error), {
          action: 'session_validation',
          url: request.url || '/unknown',
          userAgent: request.headers.get('user-agent') || undefined,
          additionalData: { requireAuth, requiredRoles }
        });
      }

      if (requireAuth && redirectOnFailure) {
        const loginUrl = request 
          ? `/auth/login?callbackUrl=${encodeURIComponent(new URL(request.url).pathname)}`
          : '/auth/login';
        return {
          user: null,
          isValid: false,
          error,
          shouldRedirect: true,
          redirectUrl: loginUrl
        };
      }

      return { user: null, isValid: false, error };
    }

    const user = session.user as SessionUser;

    // Validate user still exists in database
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, email: true, fullName: true, roles: true }
      });

      if (!dbUser) {
        const error = 'User no longer exists in database';
        
        if (request) {
          await logAuthError(new Error(error), {
            action: 'session_validation',
            userId: user.id,
            url: request.url || '/unknown',
            userAgent: request.headers.get('user-agent') || undefined,
            additionalData: { sessionEmail: user.email }
          });
        }

        if (redirectOnFailure) {
          return {
            user: null,
            isValid: false,
            error,
            shouldRedirect: true,
            redirectUrl: '/auth/login?error=invalid_session'
          };
        }

        return { user: null, isValid: false, error };
      }

      // Update user with current database data
      const validatedUser: SessionUser = {
        id: dbUser.id,
        email: dbUser.email,
        fullName: dbUser.fullName,
        roles: dbUser.roles as UserRole[]
      };

      // Check role requirements
      if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(role => validatedUser.roles.includes(role));
        
        if (!hasRequiredRole) {
          const error = `Required roles: ${requiredRoles.join(', ')}`;
          
          if (request) {
            await logAuthError(new Error(error), {
              action: 'permission_check',
              userId: validatedUser.id,
              url: request.url || '/unknown',
              userAgent: request.headers.get('user-agent') || undefined,
              additionalData: { 
                requiredRoles, 
                userRoles: validatedUser.roles 
              }
            });
          }

          if (redirectOnFailure) {
            return {
              user: validatedUser,
              isValid: false,
              error,
              shouldRedirect: true,
              redirectUrl: '/dashboard?error=access_denied'
            };
          }

          return { user: validatedUser, isValid: false, error };
        }
      }

      return { user: validatedUser, isValid: true };

    } catch (dbError) {
      if (request) {
        await logAuthError(dbError, {
          action: 'session_validation',
          userId: user.id,
          url: request.url || '/unknown',
          userAgent: request.headers.get('user-agent') || undefined,
          additionalData: { error: 'database_check_failed' }
        });
      }

      // Return session user if database validation fails (graceful degradation)
      return { user, isValid: true };
    }

  } catch (error) {
    const errorMessage = 'Session validation failed';
    
    if (request) {
      await logAuthError(error, {
        action: 'session_validation',
        url: request.url || '/unknown',
        userAgent: request.headers.get('user-agent') || undefined,
        additionalData: { function: 'validateServerSession' }
      });
    }

    if (requireAuth && redirectOnFailure) {
      return {
        user: null,
        isValid: false,
        error: errorMessage,
        shouldRedirect: true,
        redirectUrl: '/auth/login?error=session_error'
      };
    }

    return { user: null, isValid: false, error: errorMessage };
  }
}

/**
 * Server-side authentication guard that throws or redirects on failure
 */
export async function requireServerAuth(
  request?: NextRequest,
  options?: {
    requiredRoles?: UserRole[];
    redirectOnFailure?: boolean;
  }
): Promise<SessionUser> {
  const result = await validateServerSession(request, {
    requireAuth: true,
    ...options
  });

  if (!result.isValid || !result.user) {
    if (result.shouldRedirect && result.redirectUrl) {
      redirect(result.redirectUrl);
    }
    throw new Error(result.error || 'Authentication required');
  }

  return result.user;
}

/**
 * API route authentication wrapper
 */
export async function withApiAuth<T>(
  handler: (user: SessionUser, request: NextRequest) => Promise<T>,
  options?: {
    requiredRoles?: UserRole[];
  }
) {
  return async (request: NextRequest): Promise<T | Response> => {
    try {
      const result = await validateServerSession(request, {
        requireAuth: true,
        requiredRoles: options?.requiredRoles
      });

      if (!result.isValid || !result.user) {
        return new Response(
          JSON.stringify({
            error: 'authentication_required',
            message: result.error || 'Authentication required'
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      return await handler(result.user, request);
    } catch (error) {
      await logAuthError(error, {
        action: 'api_auth',
        url: request.url,
        userAgent: request.headers.get('user-agent') || undefined
      });

      return new Response(
        JSON.stringify({
          error: 'server_error',
          message: 'An unexpected error occurred'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

/**
 * Page component authentication wrapper
 */
export async function withPageAuth<T extends Record<string, unknown>>(
  pageComponent: (user: SessionUser, props: T) => Promise<React.ReactElement>,
  options?: {
    requiredRoles?: UserRole[];
  }
) {
  return async (props: T): Promise<React.ReactElement> => {
    try {
      const result = await validateServerSession(undefined, {
        requireAuth: true,
        requiredRoles: options?.requiredRoles,
        redirectOnFailure: true
      });

      if (result.shouldRedirect && result.redirectUrl) {
        redirect(result.redirectUrl);
      }

      if (!result.isValid || !result.user) {
        redirect('/auth/login?error=authentication_required');
      }

      return await pageComponent(result.user, props);
    } catch (error) {
      await logAuthError(error, {
        action: 'page_auth',
        url: '/page-component'
      });
      redirect('/auth/login?error=server_error');
    }
  };
}