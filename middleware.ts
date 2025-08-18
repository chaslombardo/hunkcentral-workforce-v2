import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logAuthEvent, logWarning, createRequestLogger } from '@/lib/production-logger';

function createErrorRedirect(req: NextRequest, error: string, originalPath: string) {
  const loginUrl = new URL('/auth/login', req.url);
  loginUrl.searchParams.set('error', error);
  loginUrl.searchParams.set('callbackUrl', originalPath);
  return NextResponse.redirect(loginUrl);
}

function createAccessDeniedRedirect(req: NextRequest, reason: string) {
  const dashboardUrl = new URL('/dashboard', req.url);
  dashboardUrl.searchParams.set('error', 'access_denied');
  dashboardUrl.searchParams.set('reason', reason);
  return NextResponse.redirect(dashboardUrl);
}

export default withAuth(
  function middleware(req) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const logger = createRequestLogger({
      requestId,
      url: req.url,
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    try {
      const token = req.nextauth.token;
      const { pathname } = req.nextUrl;

      // Log request for production monitoring
      logger.apiRequest('MIDDLEWARE', pathname, {
        metadata: {
          hasToken: !!token,
          userRoles: token?.roles || [],
          component: 'middleware',
          action: 'route_protection',
        },
      });

      // Allow access to auth pages without token
      if (pathname.startsWith('/auth')) {
        // Redirect authenticated users away from login
        if (token) {
          logger.authEvent('login_success', {
            userId: token.id as string,
            metadata: { reason: 'already_authenticated', redirectTo: '/dashboard' },
          });
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
        return NextResponse.next();
      }

      // Handle root path
      if (pathname === '/') {
        if (token) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        } else {
          return NextResponse.redirect(new URL('/auth/login', req.url));
        }
      }

      // Require authentication for protected routes
      const protectedRoutes = ['/dashboard', '/logs', '/commission', '/reports', '/admin'];
      const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
      
      if (isProtectedRoute) {
        if (!token) {
          logger.authEvent('permission_denied', {
            metadata: { reason: 'no_token', requestedPath: pathname },
          });
          return createErrorRedirect(req, 'session_required', pathname);
        }

        // Validate token structure
        if (!token.id || !token.roles) {
          logger.authEvent('permission_denied', {
            userId: token?.id as string || 'unknown',
            metadata: { reason: 'invalid_token_structure', requestedPath: pathname },
          });
          return createErrorRedirect(req, 'invalid_session', pathname);
        }
      }

      // Role-based route protection with detailed error handling
      const userRoles = (token?.roles as string[]) || [];

      // Admin routes
      if (pathname.startsWith('/admin')) {
        if (!userRoles.includes('admin')) {
          logger.authEvent('permission_denied', {
            userId: token?.id as string || 'unknown',
            metadata: { 
              reason: 'insufficient_role', 
              requiredRole: 'admin', 
              userRoles,
              requestedPath: pathname 
            },
          });
          return createAccessDeniedRedirect(req, 'admin_required');
        }
      }

      // Manager routes (managers and admins)
      if (pathname.includes('/review') || pathname.includes('/reports/payroll')) {
        if (!userRoles.includes('manager') && !userRoles.includes('admin')) {
          logger.authEvent('permission_denied', {
            userId: token?.id as string || 'unknown',
            metadata: { 
              reason: 'insufficient_role', 
              requiredRole: 'manager_or_admin', 
              userRoles,
              requestedPath: pathname 
            },
          });
          return createAccessDeniedRedirect(req, 'manager_required');
        }
      }

      // Sales routes
      if (pathname.startsWith('/commission')) {
        if (!userRoles.includes('sales') && !userRoles.includes('admin')) {
          logger.authEvent('permission_denied', {
            userId: token?.id as string || 'unknown',
            metadata: { 
              reason: 'insufficient_role', 
              requiredRole: 'sales_or_admin', 
              userRoles,
              requestedPath: pathname 
            },
          });
          return createAccessDeniedRedirect(req, 'sales_required');
        }
      }

      return NextResponse.next();
    } catch (error) {
      // Log middleware errors with proper context
      logger.warning('Middleware error occurred', {
        component: 'middleware',
        action: 'error_handling',
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          requestedPath: req.nextUrl.pathname,
        },
      });
      return createErrorRedirect(req, 'middleware_error', req.nextUrl.pathname);
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        try {
          const { pathname } = req.nextUrl;
          
          // Allow access to public routes
          if (pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/api/health')) {
            return true;
          }

          // Require valid token for protected routes
          if (!token) {
            return false;
          }

          // Validate token structure
          if (!token.id || !token.email) {
            logWarning('Invalid token structure detected', {
              component: 'middleware',
              action: 'token_validation',
              metadata: { 
                hasId: !!token.id, 
                hasEmail: !!token.email,
                pathname: req.nextUrl.pathname,
              },
            });
            return false;
          }

          return true;
        } catch (error) {
          logWarning('Authorization callback error', {
            component: 'middleware',
            action: 'authorization_callback',
            metadata: {
              error: error instanceof Error ? error.message : String(error),
              pathname: req.nextUrl.pathname,
            },
          });
          return false;
        }
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - sw.js (service worker)
     * - icon-*.png (PWA icons)
     * - browserconfig.xml (IE/Edge config)
     * - robots.txt (SEO)
     * - sitemap.xml (SEO)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-.*\\.png|browserconfig.xml|robots.txt|sitemap.xml).*)',
  ],
};