import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
    try {
      const token = req.nextauth.token;
      const { pathname } = req.nextUrl;

      // Allow access to auth pages without token
      if (pathname.startsWith('/auth')) {
        // Redirect authenticated users away from login
        if (token) {
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
          return createErrorRedirect(req, 'session_required', pathname);
        }

        // Validate token structure
        if (!token.id || !token.roles) {
          return createErrorRedirect(req, 'invalid_session', pathname);
        }
      }

      // Role-based route protection with detailed error handling
      const userRoles = (token?.roles as string[]) || [];

      // Admin routes
      if (pathname.startsWith('/admin')) {
        if (!userRoles.includes('admin')) {
          return createAccessDeniedRedirect(req, 'admin_required');
        }
      }

      // Manager routes (managers and admins)
      if (pathname.includes('/review') || pathname.includes('/reports/payroll')) {
        if (!userRoles.includes('manager') && !userRoles.includes('admin')) {
          return createAccessDeniedRedirect(req, 'manager_required');
        }
      }

      // Sales routes
      if (pathname.startsWith('/commission')) {
        if (!userRoles.includes('sales') && !userRoles.includes('admin')) {
          return createAccessDeniedRedirect(req, 'sales_required');
        }
      }

      return NextResponse.next();
    } catch (error) {
      // Log middleware errors and redirect to login
      console.error('Middleware error:', error);
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
            console.error('Invalid token structure:', { hasId: !!token.id, hasEmail: !!token.email });
            return false;
          }

          return true;
        } catch (error) {
          console.error('Authorization callback error:', error);
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