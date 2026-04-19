import { NextRequest, NextResponse } from 'next/server';
import { applyCORSHeaders } from './cors-middleware';

/**
 * Wrapper for API route responses that automatically applies CORS headers
 * Use this in your API routes to ensure CORS headers are included
 */
export function apiResponse(
  data: any,
  request: NextRequest,
  statusCode: number = 200
): NextResponse {
  const response = NextResponse.json(data, { status: statusCode });
  return applyCORSHeaders(response, request);
}

/**
 * Wrapper for API error responses with CORS headers
 */
export function apiErrorResponse(
  message: string,
  request: NextRequest,
  statusCode: number = 400
): NextResponse {
  const response = NextResponse.json({ message }, { status: statusCode });
  return applyCORSHeaders(response, request);
}

/**
 * Extract origin from request for logging
 */
export function getOriginFromRequest(request: NextRequest): string {
  return request.headers.get('origin') || request.headers.get('referer') || 'unknown';
}
