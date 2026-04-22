import { NextRequest, NextResponse } from 'next/server';
import { verifyCSRFToken, getCSRFTokenFromRequest } from './csrf';

/**
 * Middleware to validate CSRF token for state-changing requests
 * Apply to POST, PUT, DELETE, PATCH routes
 * GET requests don't need CSRF protection (they're idempotent)
 */
export async function validateCSRFMiddleware(request: NextRequest): Promise<boolean> {
  // GET requests don't need CSRF protection
  if (request.method === 'GET') {
    return true;
  }

  try {
    const csrfToken = getCSRFTokenFromRequest(request.headers);
    
    if (!csrfToken) {
      console.warn('[CSRF] No CSRF token provided in headers');
      return false;
    }

    // Verify token (will throw if invalid/expired)
    await verifyCSRFToken(csrfToken);
    return true;
  } catch (error) {
    console.error('[CSRF] Validation failed:', error);
    return false;
  }
}

/**
 * Helper to return CSRF error response
 */
export function csrfErrorResponse() {
  return NextResponse.json(
    {
      message:
        'CSRF token validation failed. Please refresh the page and try again.',
    },
    { status: 403 }
  );
}
