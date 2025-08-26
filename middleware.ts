import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function createErrorRedirect(
  req: NextRequest,
  error: string,
  originalPath: string
) {
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

// Simple rate limiting for Edge Runtime
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function simpleRateLimit(req: NextRequest): boolean {
  const ip =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;

  const key = `rate_limit:${ip}`;
  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}

export default withAuth(
  async function middleware(req) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Simple rate limiting
      if (!simpleRateLimit(req)) {
        const response = new NextResponse('Too Many Requests', { status: 429 });
        return addSecurityHeaders(response);
      }

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
      const protectedRoutes = [
        '/dashboard',
        '/logs',
        '/commission',
        '/reports',
        '/admin',
      ];
      const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
      );

      if (isProtectedRoute) {
        if (!token) {
          return createErrorRedirect(req, 'session_required', pathname);
        }

        // Validate token structure
        if (!token.id || !token.roles) {
          return createErrorRedirect(req, 'invalid_session', pathname);
        }
      }

      // Role-based route protection
      const userRoles = (token?.roles as string[]) || [];

      // Admin routes
      if (pathname.startsWith('/admin')) {
        if (!userRoles.includes('admin')) {
          return createAccessDeniedRedirect(req, 'admin_required');
        }
      }

      // Manager routes (managers and admins)
      if (
        pathname.includes('/review') ||
        pathname.includes('/reports/payroll')
      ) {
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

      // Apply secure headers to successful responses
      const response = NextResponse.next();
      const secureResponse = addSecurityHeaders(response);

      // Add request ID for tracing
      secureResponse.headers.set('x-request-id', requestId);

      // Add user context if available
      if (token?.id) {
        secureResponse.headers.set('x-user-id', token.id as string);
        secureResponse.headers.set(
          'x-user-roles',
          (token.roles as string[]).join(',')
        );
      }

      return secureResponse;
    } catch (error) {
      // Simple error logging for Edge Runtime
      console.error('Middleware error:', {
        error: error instanceof Error ? error.message : String(error),
        requestedPath: req.nextUrl.pathname,
        requestId,
      });

      const errorResponse = createErrorRedirect(
        req,
        'middleware_error',
        req.nextUrl.pathname
      );
      return addSecurityHeaders(errorResponse);
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        try {
          const { pathname } = req.nextUrl;

          // Allow access to public routes
          if (
            pathname === '/' ||
            pathname.startsWith('/auth') ||
            pathname.startsWith('/api/health')
          ) {
            return true;
          }

          // Require valid token for protected routes
          if (!token) {
            return false;
          }

          // Validate token structure
          if (!token.id || !token.email) {
            console.warn('Invalid token structure detected:', {
              hasId: !!token.id,
              hasEmail: !!token.email,
              pathname: req.nextUrl.pathname,
            });
            return false;
          }

          return true;
        } catch (error) {
          console.error('Authorization callback error:', {
            error: error instanceof Error ? error.message : String(error),
            pathname: req.nextUrl.pathname,
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
