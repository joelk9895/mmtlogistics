import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession, updateSession } from '@/lib/session';

export async function proxy(request: NextRequest) {
  // Update session expiration if present
  const updatedResponse = await updateSession(request);
  const path = request.nextUrl.pathname;

  // Define public routes that don't require authentication
  const isPublicRoute = path === '/login' || path.startsWith('/api/auth/');
  
  // Define role-specific base paths
  const isAdminRoute = path.startsWith('/admin') || path === '/';
  const isDriverRoute = path.startsWith('/driver');
  const isCustomerRoute = path.startsWith('/customer');

  const session = await getSession();

  // If user is not logged in and tries to access a protected route
  if (!session && !isPublicRoute) {
    // For API routes, the auth helper handles this, but we can also catch it here if we want.
    // However, our API auth helper might allow API keys, so we shouldn't block APIs globally here
    // unless they specifically start with /admin/api etc. 
    // For now, we only protect UI routes in middleware.
    if (!path.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If user is logged in
  if (session) {
    const role = session.role;

    // Redirect authenticated users away from the login page and root path
    if ((isPublicRoute && path === '/login') || path === '/') {
      if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url));
      if (role === 'DRIVER') return NextResponse.redirect(new URL('/driver', request.url));
      if (role === 'CUSTOMER') return NextResponse.redirect(new URL('/customer', request.url));
    }

    // Role-based access control
    if (isAdminRoute && role !== 'ADMIN') {
      if (role === 'DRIVER') return NextResponse.redirect(new URL('/driver', request.url));
      if (role === 'CUSTOMER') return NextResponse.redirect(new URL('/customer', request.url));
    }
    
    if (isDriverRoute && role !== 'DRIVER') {
      if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url));
      if (role === 'CUSTOMER') return NextResponse.redirect(new URL('/customer', request.url));
    }
    
    if (isCustomerRoute && role !== 'CUSTOMER') {
      if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url));
      if (role === 'DRIVER') return NextResponse.redirect(new URL('/driver', request.url));
    }
  }

  return updatedResponse || NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled separately or let through for API key checks)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
