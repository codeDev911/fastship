import { NextRequest, NextResponse } from 'next/server';
import { getOriginFromRequest, getCORSHeaders, isCORSPreflightRequest, createCORSPreflightResponse } from './cors';

/**
 * Apply CORS headers to response
 * Used in API routes to add CORS headers
 */
export function applyCORSHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const origin = getOriginFromRequest(request);
  const corsHeaders = getCORSHeaders(origin);

  // Apply each CORS header to response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Handle CORS preflight requests
 * Use in API routes to handle OPTIONS requests
 */
export function handleCORSPreflight(request: NextRequest): NextResponse | null {
  if (isCORSPreflightRequest(request.method)) {
    const origin = getOriginFromRequest(request);
    return createCORSPreflightResponse(origin) as unknown as NextResponse;
  }

  return null;
}

/**
 * Middleware to handle CORS for all API requests
 * Apply in middleware.ts to handle preflight requests globally
 */
export function corsMiddleware(request: NextRequest): NextResponse | null {
  // Handle preflight requests
  if (isCORSPreflightRequest(request.method)) {
    const origin = getOriginFromRequest(request);
    return createCORSPreflightResponse(origin) as unknown as NextResponse;
  }

  return null;
}
