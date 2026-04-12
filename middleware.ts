import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register/driver', '/register/seller', '/register/business', '/'];

  // Check if the current route is public
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Get authentication token from cookies
  const token = request.cookies.get('auth_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;

  // If no token, redirect to login
  if (!token || !userRole) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    await jwtVerify(token, secret);
  } catch (error) {
    console.error('[v0] Token verification failed:', error);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    response.cookies.delete('user_role');
    return response;
  }

  // Check if user is accessing the correct role's dashboard
  if (pathname.startsWith('/driver') && userRole !== 'DRIVER') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/seller') && userRole !== 'SELLER') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/business') && userRole !== 'BUSINESS') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protected routes
    '/driver/:path*',
    '/seller/:path*',
    '/business/:path*',
  ],
};
