import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession, updateSession } from '@/lib/session';

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Handle CORS for all API routes
  if (path.startsWith('/api/')) {
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, X-Requested-With, Accept, Accept-Version, Origin',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept, Accept-Version, Origin'
    );
    return response;
  }

  // Update session expiration if present
  const updatedResponse = await updateSession(request);

  // Define public routes that don't require authentication
  const isPublicRoute = path === '/login';

  // Define role-specific base paths
  const isAdminRoute = path.startsWith('/admin') || path === '/';
  const isDriverRoute = path.startsWith('/driver');
  const isCustomerRoute = path.startsWith('/customer');

  const session = await getSession();

  // If user is not logged in and tries to access a protected UI route
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
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
     * Match all request paths except static files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
