import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
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

    // Require authentication for protected routes
    if (pathname.startsWith('/(protected)') || pathname === '/dashboard') {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }
    }

    // Role-based route protection
    const userRoles = (token?.roles as string[]) || [];

    // Admin routes
    if (pathname.startsWith('/admin')) {
      if (!userRoles.includes('admin')) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // Manager routes (managers and admins)
    if (pathname.includes('/review') || pathname.includes('/reports/payroll')) {
      if (!userRoles.includes('manager') && !userRoles.includes('admin')) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow access to public routes
        if (pathname === '/' || pathname.startsWith('/auth')) {
          return true;
        }

        // Require token for protected routes
        return !!token;
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