import { NextRequest, NextResponse } from 'next/server';
import { validateCSRFMiddleware } from '@/lib/csrf-middleware';

export const runtime = 'nodejs';

/**
 * Get allowed origins from environment
 */
function getAllowedOrigins(): string[] {
  const env = process.env.ALLOWED_ORIGINS || '';
  if (!env.trim()) {
    return ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004'];
  }
  return env.split(',').map(o => o.trim()).filter(o => o);
}

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | null | undefined): boolean {
  if (!origin) return true;
  const allowed = getAllowedOrigins();
  return allowed.some(a => {
    if (a.includes('*')) {
      const regex = new RegExp('^' + a.replace(/\*/g, '[a-z0-9.-]*') + '$');
      return regex.test(origin);
    }
    return a === origin;  
  });
}

/**
 * Get CORS headers
 */
function getCORSHeaders(origin: string | null | undefined) {
  if (!isOriginAllowed(origin)) {
    return {};
  }
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Public API routes that don't require authentication or CSRF
 */
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/business',
  '/api/auth/driver',
  '/api/auth/seller',
  '/api/locations',
  '/api/rate-cards',
  '/api/distance',
  '/api/auth/csrf-token', // Allow CSRF token refresh without token
];

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const origin = request.headers.get('origin');

  // Only handle /api routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Handle preflight
  if (request.method === 'OPTIONS') {
    const corsHeaders = getCORSHeaders(origin);
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // For public routes, just add CORS headers
  if (isPublicRoute(pathname)) {
    const response = NextResponse.next();
    const corsHeaders = getCORSHeaders(origin);
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  // For state-changing requests on protected routes, validate CSRF
  const isStateChangingMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(
    request.method.toUpperCase()
  );

  if (isStateChangingMethod) {
    if (!(await validateCSRFMiddleware(request))) {
      const corsHeaders = getCORSHeaders(origin);
      const errorResponse = NextResponse.json(
        {
          message: 'CSRF token validation failed. Please refresh the page and try again.',
        },
        { status: 403 }
      );

      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });

      return errorResponse;
    }
  }

  // For other methods, add CORS headers
  const response = NextResponse.next();
  const corsHeaders = getCORSHeaders(origin);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
