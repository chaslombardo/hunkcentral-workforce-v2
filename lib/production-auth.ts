/**
 * Production Authentication Service
 * Enhanced authentication with session validation, error recovery, and graceful redirects
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { logProductionError } from '@/lib/production-error-logger';
import type { SessionUser } from '@/lib/auth';
import type { UserRole } from '@/types';

export interface ProductionAuthResult {
  user: SessionUser | null;
  isValid: boolean;
  error?: string;
  errorCode?: string;
  shouldRedirect?: boolean;
  redirectUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthValidationOptions {
  requireAuth?: boolean;
  requiredRoles?: UserRole[];
  redirectOnFailure?: boolean;
  allowGracefulDegradation?: boolean;
  validateDatabase?: boolean;
  maxRetries?: number;
}

/**
 * Enhanced session validation with comprehensive error handling and recovery
 */
export async function validateProductionSession(
  request?: NextRequest,
  options: AuthValidationOptions = {}
): Promise<ProductionAuthResult> {
  const {
    requireAuth = false,
    requiredRoles = [],
    redirectOnFailure = false,
    allowGracefulDegradation = true,
    validateDatabase = true,
    maxRetries = 2
  } = options;

  const requestId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const url = request?.url || '/unknown';
  const userAgent = request?.headers.get('user-agent') || 'unknown';

  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount <= maxRetries) {
    try {
      // Get session with timeout protection
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        const error = 'No valid session found';
        
        await logProductionError(new Error(error), {
          component: 'authentication',
          action: 'session_validation',
          url,
          userAgent,
          category: 'auth',
          metadata: {
            requestId,
            requireAuth,
            requiredRoles,
            retryCount,
            reason: 'no_session'
          }
        });

        if (requireAuth && redirectOnFailure) {
          const loginUrl = request 
            ? `/auth/login?callbackUrl=${encodeURIComponent(new URL(request.url).pathname)}&error=session_required`
            : '/auth/login?error=session_required';
          
          return {
            user: null,
            isValid: false,
            error,
            errorCode: 'NO_SESSION',
            shouldRedirect: true,
            redirectUrl: loginUrl,
            metadata: { requestId, retryCount }
          };
        }

        return { 
          user: null, 
          isValid: false, 
          error, 
          errorCode: 'NO_SESSION',
          metadata: { requestId, retryCount }
        };
      }

      const user = session.user as SessionUser;

      // Validate session structure
      if (!user.id || !user.email || !user.roles) {
        const error = 'Invalid session structure';
        
        await logProductionError(new Error(error), {
          component: 'authentication',
          action: 'session_validation',
          userId: user.id,
          url,
          userAgent,
          category: 'auth',
          metadata: {
            requestId,
            hasId: !!user.id,
            hasEmail: !!user.email,
            hasRoles: !!user.roles,
            retryCount,
            reason: 'invalid_structure'
          }
        });

        if (redirectOnFailure) {
          return {
            user: null,
            isValid: false,
            error,
            errorCode: 'INVALID_SESSION_STRUCTURE',
            shouldRedirect: true,
            redirectUrl: '/auth/login?error=invalid_session',
            metadata: { requestId, retryCount }
          };
        }

        return { 
          user: null, 
          isValid: false, 
          error, 
          errorCode: 'INVALID_SESSION_STRUCTURE',
          metadata: { requestId, retryCount }
        };
      }

      // Database validation with retry logic
      if (validateDatabase) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { 
              id: true, 
              email: true, 
              fullName: true, 
              roles: true
            }
          });

          if (!dbUser) {
            const error = 'User no longer exists in database';
            
            await logProductionError(new Error(error), {
              component: 'authentication',
              action: 'session_validation',
              userId: user.id,
              url,
              userAgent,
              category: 'auth',
              metadata: {
                requestId,
                sessionEmail: user.email,
                retryCount,
                reason: 'user_not_found'
              }
            });

            if (redirectOnFailure) {
              return {
                user: null,
                isValid: false,
                error,
                errorCode: 'USER_NOT_FOUND',
                shouldRedirect: true,
                redirectUrl: '/auth/login?error=invalid_session',
                metadata: { requestId, retryCount }
              };
            }

            return { 
              user: null, 
              isValid: false, 
              error, 
              errorCode: 'USER_NOT_FOUND',
              metadata: { requestId, retryCount }
            };
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
              
              await logProductionError(new Error(error), {
                component: 'authentication',
                action: 'permission_check',
                userId: validatedUser.id,
                url,
                userAgent,
                category: 'auth',
                metadata: {
                  requestId,
                  requiredRoles,
                  userRoles: validatedUser.roles,
                  retryCount,
                  reason: 'insufficient_roles'
                }
              });

              if (redirectOnFailure) {
                return {
                  user: validatedUser,
                  isValid: false,
                  error,
                  errorCode: 'INSUFFICIENT_ROLES',
                  shouldRedirect: true,
                  redirectUrl: '/dashboard?error=access_denied',
                  metadata: { requestId, retryCount, requiredRoles, userRoles: validatedUser.roles }
                };
              }

              return { 
                user: validatedUser, 
                isValid: false, 
                error, 
                errorCode: 'INSUFFICIENT_ROLES',
                metadata: { requestId, retryCount, requiredRoles, userRoles: validatedUser.roles }
              };
            }
          }

          // Note: lastLoginAt field removed from User model - no update needed

          return { 
            user: validatedUser, 
            isValid: true,
            metadata: { requestId, retryCount, databaseValidated: true }
          };

        } catch (dbError) {
          lastError = dbError instanceof Error ? dbError : new Error(String(dbError));
          
          await logProductionError(dbError, {
            component: 'authentication',
            action: 'database_validation',
            userId: user.id,
            url,
            userAgent,
            category: 'database',
            metadata: {
              requestId,
              retryCount,
              error: 'database_check_failed',
              allowGracefulDegradation
            }
          });

          // Retry on database errors
          if (retryCount < maxRetries) {
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100)); // Exponential backoff
            continue;
          }

          // Graceful degradation: return session user if database validation fails
          if (allowGracefulDegradation) {
            return { 
              user, 
              isValid: true,
              metadata: { 
                requestId, 
                retryCount, 
                databaseValidated: false, 
                gracefulDegradation: true,
                dbError: lastError.message
              }
            };
          }

          const error = 'Database validation failed';
          if (redirectOnFailure) {
            return {
              user: null,
              isValid: false,
              error,
              errorCode: 'DATABASE_ERROR',
              shouldRedirect: true,
              redirectUrl: '/auth/login?error=system_error',
              metadata: { requestId, retryCount, dbError: lastError.message }
            };
          }

          return { 
            user: null, 
            isValid: false, 
            error, 
            errorCode: 'DATABASE_ERROR',
            metadata: { requestId, retryCount, dbError: lastError.message }
          };
        }
      } else {
        // Skip database validation
        return { 
          user, 
          isValid: true,
          metadata: { requestId, retryCount, databaseValidated: false }
        };
      }

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      await logProductionError(error, {
        component: 'authentication',
        action: 'session_validation',
        url,
        userAgent,
        category: 'auth',
        metadata: {
          requestId,
          retryCount,
          function: 'validateProductionSession'
        }
      });

      // Retry on general errors
      if (retryCount < maxRetries) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100)); // Exponential backoff
        continue;
      }

      const errorMessage = 'Session validation failed';
      
      if (requireAuth && redirectOnFailure) {
        return {
          user: null,
          isValid: false,
          error: errorMessage,
          errorCode: 'VALIDATION_ERROR',
          shouldRedirect: true,
          redirectUrl: '/auth/login?error=session_error',
          metadata: { requestId, retryCount, originalError: lastError.message }
        };
      }

      return { 
        user: null, 
        isValid: false, 
        error: errorMessage, 
        errorCode: 'VALIDATION_ERROR',
        metadata: { requestId, retryCount, originalError: lastError.message }
      };
    }
  }

  // This should never be reached, but included for completeness
  return {
    user: null,
    isValid: false,
    error: 'Maximum retries exceeded',
    errorCode: 'MAX_RETRIES_EXCEEDED',
    metadata: { requestId, retryCount, originalError: lastError?.message }
  };
}

/**
 * Production authentication guard with enhanced error handling
 */
export async function requireProductionAuth(
  request?: NextRequest,
  options: Omit<AuthValidationOptions, 'requireAuth'> = {}
): Promise<SessionUser> {
  const result = await validateProductionSession(request, {
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
 * API route authentication wrapper with production error handling
 */
export function withProductionApiAuth<T>(
  handler: (user: SessionUser, request: NextRequest) => Promise<T>,
  options: Omit<AuthValidationOptions, 'requireAuth' | 'redirectOnFailure'> = {}
) {
  return async (request: NextRequest): Promise<T | Response> => {
    try {
      const result = await validateProductionSession(request, {
        requireAuth: true,
        redirectOnFailure: false,
        ...options
      });

      if (!result.isValid || !result.user) {
        const errorResponse = {
          error: result.errorCode || 'authentication_required',
          message: result.error || 'Authentication required',
          timestamp: new Date().toISOString(),
          requestId: result.metadata?.requestId
        };

        const statusCode = result.errorCode === 'INSUFFICIENT_ROLES' ? 403 : 401;

        return new Response(
          JSON.stringify(errorResponse),
          {
            status: statusCode,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      return await handler(result.user, request);
    } catch (error) {
      await logProductionError(error, {
        component: 'api_auth',
        action: 'authentication_wrapper',
        url: request.url,
        userAgent: request.headers.get('user-agent') || 'unknown',
        category: 'api'
      });

      return new Response(
        JSON.stringify({
          error: 'server_error',
          message: 'An unexpected error occurred',
          timestamp: new Date().toISOString()
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
 * Page component authentication wrapper with production error handling
 */
export function withProductionPageAuth<T extends Record<string, unknown>>(
  pageComponent: (user: SessionUser, props: T) => Promise<React.ReactElement>,
  options: Omit<AuthValidationOptions, 'requireAuth'> = {}
) {
  return async (props: T): Promise<React.ReactElement> => {
    try {
      const result = await validateProductionSession(undefined, {
        requireAuth: true,
        redirectOnFailure: true,
        ...options
      });

      if (result.shouldRedirect && result.redirectUrl) {
        redirect(result.redirectUrl);
      }

      if (!result.isValid || !result.user) {
        redirect('/auth/login?error=authentication_required');
      }

      return await pageComponent(result.user, props);
    } catch (error) {
      await logProductionError(error, {
        component: 'page_auth',
        action: 'authentication_wrapper',
        url: '/page-component',
        userAgent: 'server',
        category: 'auth'
      });
      redirect('/auth/login?error=server_error');
    }
  };
}

/**
 * Session recovery utility for client-side use
 */
export async function recoverSession(): Promise<{
  success: boolean;
  error?: string;
  shouldReload?: boolean;
}> {
  try {
    // Attempt to refresh the session
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    if (response.ok) {
      const session = await response.json();
      if (session?.user) {
        return { success: true };
      }
    }

    return { 
      success: false, 
      error: 'Session recovery failed',
      shouldReload: true
    };
  } catch {
    return { 
      success: false, 
      error: 'Network error during session recovery',
      shouldReload: true
    };
  }
}

/**
 * Enhanced middleware authentication with production error handling
 */
export function createProductionAuthMiddleware() {
  return async (request: NextRequest): Promise<NextResponse> => {
    const requestId = `mw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const { pathname } = request.nextUrl;
      
      // Allow public routes
      const publicRoutes = ['/auth', '/api/health', '/api/auth'];
      if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
      }

      // Validate session for protected routes
      const result = await validateProductionSession(request, {
        requireAuth: true,
        redirectOnFailure: false,
        allowGracefulDegradation: false,
        validateDatabase: true
      });

      if (!result.isValid || !result.user) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        loginUrl.searchParams.set('error', result.errorCode || 'session_required');
        
        return NextResponse.redirect(loginUrl);
      }

      // Add user context to request headers for downstream use
      const response = NextResponse.next();
      response.headers.set('x-user-id', result.user.id);
      response.headers.set('x-user-roles', result.user.roles.join(','));
      response.headers.set('x-request-id', requestId);
      
      return response;
    } catch (error) {
      await logProductionError(error, {
        component: 'middleware',
        action: 'authentication',
        url: request.url,
        userAgent: request.headers.get('user-agent') || 'unknown',
        category: 'middleware',
        metadata: { requestId }
      });

      // Redirect to login on middleware errors
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('error', 'middleware_error');
      return NextResponse.redirect(loginUrl);
    }
  };
}