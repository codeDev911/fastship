/**
 * Authentication Middleware for API Routes
 * Validates JWT tokens and enforces role-based access control
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export interface AuthPayload {
  id: string;
  email: string;
  role: 'DRIVER' | 'SELLER' | 'BUSINESS' | 'ADMIN';
  jobId?: string;
  iat: number;
  exp: number;
}

export interface AuthMiddlewareOptions {
  requiredRole?: 'DRIVER' | 'SELLER' | 'BUSINESS' | 'ADMIN';
  allowedRoles?: ('DRIVER' | 'SELLER' | 'BUSINESS' | 'ADMIN')[];
  checkCSRF?: boolean;
}

/**
 * Middleware to check JWT authentication on API routes
 * 
 * Usage:
 * export async function POST(request: NextRequest) {
 *   const auth = await requireAuth(request);
 *   if (!auth.authenticated) return auth.response;
 *   
 *   const userId = auth.userId;
 *   // Your handler logic...
 * }
 */
export async function requireAuth(
  request: NextRequest,
  options: AuthMiddlewareOptions = {}
) {
  try {
    // Get token from cookies or Authorization header
    const token =
      request.cookies.get('auth_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return {
        authenticated: false,
        response: NextResponse.json(
          { message: 'No authentication token provided' },
          { status: 401 }
        ),
        user: null,
        userId: null,
      };
    }

    // Verify JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const verified = await jwtVerify(token, secret);
    const payload = verified.payload as AuthPayload;

    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return {
        authenticated: false,
        response: NextResponse.json(
          { message: 'Authentication token has expired' },
          { status: 401 }
        ),
        user: null,
        userId: null,
      };
    }

    // Check required role if specified
    if (options.requiredRole && payload.role !== options.requiredRole) {
      return {
        authenticated: false,
        response: NextResponse.json(
          { message: `This action requires ${options.requiredRole} role` },
          { status: 403 }
        ),
        user: null,
        userId: null,
      };
    }

    // Check allowed roles if specified
    if (options.allowedRoles && !options.allowedRoles.includes(payload.role)) {
      return {
        authenticated: false,
        response: NextResponse.json(
          { message: `Access denied for ${payload.role} role` },
          { status: 403 }
        ),
        user: null,
        userId: null,
      };
    }

    return {
      authenticated: true,
      response: null,
      user: {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        jobId: payload.jobId,
      },
      userId: payload.id,
      userRole: payload.role,
    };
  } catch (error) {
    console.error('[Auth Middleware] Error:', error);
    return {
      authenticated: false,
      response: NextResponse.json(
        { message: 'Invalid or malformed authentication token' },
        { status: 401 }
      ),
      user: null,
      userId: null,
    };
  }
}

/**
 * Middleware to check CSRF token for state-changing requests
 */
export async function requireCSRF(request: NextRequest) {
  try {
    const csrfToken =
      request.headers.get('x-csrf-token') ||
      request.cookies.get('csrf-token')?.value;

    if (!csrfToken) {
      return {
        valid: false,
        response: NextResponse.json(
          { message: 'CSRF token is required for this action' },
          { status: 403 }
        ),
      };
    }

    return {
      valid: true,
      response: null,
      token: csrfToken,
    };
  } catch (error) {
    console.error('[CSRF Middleware] Error:', error);
    return {
      valid: false,
      response: NextResponse.json(
        { message: 'CSRF validation failed' },
        { status: 403 }
      ),
    };
  }
}

/**
 * Middleware to handle both auth and CSRF checks
 */
export async function requireAuthAndCSRF(
  request: NextRequest,
  authOptions: AuthMiddlewareOptions = {}
) {
  // Check authentication first
  const auth = await requireAuth(request, authOptions);
  if (!auth.authenticated) {
    return auth;
  }

  // Check CSRF for state-changing requests
  const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(
    request.method.toUpperCase()
  );

  if (isStateChanging) {
    const csrf = await requireCSRF(request);
    if (!csrf.valid) {
      return csrf;
    }
  }

  return auth;
}

/**
 * Error response helper
 */
export function authError(message: string, status: number = 401) {
  return NextResponse.json({ message }, { status });
}

/**
 * Success response helper with auth context
 */
export function authSuccess(data: any, userId: string, status: number = 200) {
  const response = NextResponse.json(data, { status });
  response.headers.set('x-user-id', userId);
  return response;
}

export default {
  requireAuth,
  requireCSRF,
  requireAuthAndCSRF,
  authError,
  authSuccess,
};
