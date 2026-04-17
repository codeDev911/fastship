import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { validateCSRFMiddleware } from '@/lib/csrf-middleware';
import { corsMiddleware, applyCORSHeaders } from '@/lib/cors-middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS preflight requests first (before any other checks)
  const corsResponse = corsMiddleware(request);
  if (corsResponse) {
    return corsResponse;
  }

  // Public routes that don't require authentication
  const publicRoutes = ["/order-process","/rate-calculator","/privacy","/terms","/to-know", '/login', '/register/driver', '/register/seller', '/register/business', '/'];

  // API routes that return 401 instead of redirecting (don't require auth token)
  const apiPublicRoutes = ['/api/auth/login', '/api/auth/register','/api/auth/business','/api/auth/driver','/api/auth/seller','/api/locations','/api/rate-cards','/api/distance'];

  // Check if the current route is public
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // For other API routes, allow them through but let them handle auth
  if (pathname.startsWith('/api/')) {
    // Check if it's a public API route
    const isPublicApi = apiPublicRoutes.some(route => pathname.startsWith(route));
    
    if (!isPublicApi) {
      // For protected API routes, we skip middleware auth check
      // Let the route handler validate auth and return 401
      return NextResponse.next();
    }
    
    return NextResponse.next();
  }

  // Get authentication token from cookies (for page routes)
  const token = request.cookies.get('auth_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;

  // If no token, redirect to login
  if (!token || !userRole) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token
  let userId: string;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const verified = await jwtVerify(token, secret);
    userId = (verified.payload as any).id;
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

  // CSRF validation for API routes with state-changing methods
  if (pathname.startsWith('/api/')) {
    const isStateChangingMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(
      request.method.toUpperCase()
    );

    // Exclude CSRF-token endpoint from CSRF validation
    const isCsrfEndpoint = pathname === '/api/auth/csrf-token';

    if (isStateChangingMethod && !isCsrfEndpoint) {
      if (!(await validateCSRFMiddleware(request))) {
        return NextResponse.json(
          {
            message:
              'CSRF token validation failed. Please refresh the page and try again.',
          },
          { status: 403 }
        );
      }
    }
  }

  const response = NextResponse.next();

  // Add CSRF token to response header for frontend to cache
  // Frontend will automatically include this in subsequent requests
  response.headers.set('x-csrf-token-refreshed', 'true');

  // Apply CORS headers to API responses
  if (pathname.startsWith('/api/')) {
    applyCORSHeaders(response, request);
  }

  return response;
}

export const config = {
  matcher: [
    // Protected routes
    '/driver/:path*',
    '/seller/:path*',
    '/business/:path*',
    '/api/:path*',
    '/((?!api/auth/login|api/auth/register|api/auth/register/driver|api/auth/register/business|api/auth/register/seller|_next/static|_next/image|favicon.ico).*)',
  ],
};
