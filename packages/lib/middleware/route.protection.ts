/**
 * API Route Protection Middleware
 * Ready-to-use middleware functions for common API protection patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAuthAndCSRF, AuthMiddlewareOptions } from './auth.middleware';

/**
 * Protect a GET endpoint (read-only, auth required)
 */
export async function protectGetRoute(request: NextRequest, options: AuthMiddlewareOptions = {}) {
  return requireAuth(request, options);
}

/**
 * Protect a POST endpoint (state-changing, auth + CSRF required)
 */
export async function protectPostRoute(request: NextRequest, options: AuthMiddlewareOptions = {}) {
  return requireAuthAndCSRF(request, options);
}

/**
 * Protect a PUT endpoint (update, auth + CSRF required)
 */
export async function protectPutRoute(request: NextRequest, options: AuthMiddlewareOptions = {}) {
  return requireAuthAndCSRF(request, options);
}

/**
 * Protect a DELETE endpoint (delete, auth + CSRF required)
 */
export async function protectDeleteRoute(request: NextRequest, options: AuthMiddlewareOptions = {}) {
  return requireAuthAndCSRF(request, options);
}

/**
 * Protect a PATCH endpoint (partial update, auth + CSRF required)
 */
export async function protectPatchRoute(request: NextRequest, options: AuthMiddlewareOptions = {}) {
  return requireAuthAndCSRF(request, options);
}

/**
 * Generic route protection - automatically handles auth + CSRF based on method
 */
export async function protectRoute(request: NextRequest, options: AuthMiddlewareOptions = {}) {
  const method = request.method.toUpperCase();
  
  // GET, HEAD, OPTIONS don't need CSRF
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return requireAuth(request, options);
  }
  
  // POST, PUT, DELETE, PATCH need both auth and CSRF
  return requireAuthAndCSRF(request, options);
}

/**
 * Example usage in API route:
 * 
 * export async function GET(request: NextRequest) {
 *   const auth = await protectRoute(request);
 *   if (!auth.authenticated) return auth.response;
 *   
 *   const { userId, userRole } = auth;
 *   // Your handler logic here
 * }
 * 
 * export async function POST(request: NextRequest) {
 *   const auth = await protectRoute(request, { requiredRole: 'SELLER' });
 *   if (!auth.authenticated) return auth.response;
 *   
 *   const { userId } = auth;
 *   // Your handler logic here
 * }
 */

export default {
  protectGetRoute,
  protectPostRoute,
  protectPutRoute,
  protectDeleteRoute,
  protectPatchRoute,
  protectRoute,
};
