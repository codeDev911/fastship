import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiErrorResponse } from '@/lib/api-response';
import { validateCSRFMiddleware } from '@/lib/csrf-middleware';
import { validateApiKey } from '@/lib/api-key-middleware';

/**
 * Example API Route with Multi-Layer Security
 *
 * Supports:
 * ✅ CSRF token authentication (for browser-based requests)
 * ✅ API key authentication (for third-party/backend requests)
 * ✅ CORS headers (automatic via apiResponse helper)
 * ✅ Role-based access control
 * ✅ Proper error responses with context
 *
 * Usage:
 * - Browser request: GET /api/example/secure-endpoint with X-CSRF-Token header
 * - API key request: GET /api/example/secure-endpoint with Authorization: Bearer sk_test_xxx header
 */

export async function GET(request: NextRequest) {
  try {
    // Step 1: Check for API key authentication (third-party requests)
    const authHeader = request.headers.get('Authorization');
    
    if (authHeader?.startsWith('Bearer sk_')) {
      // Third-party request using API key
      const apiKeyValidation = await validateApiKey(request);
      
      if (!apiKeyValidation.valid) {
        return apiErrorResponse(
          apiKeyValidation.error || 'Invalid API key',
          request,
          apiKeyValidation.statusCode || 401
        );
      }

      // Validate API key has read scope
      if (!apiKeyValidation.apiKeyId) {
        return apiErrorResponse('No API key ID found', request, 401);
      }

      // Optional: Check scope for read access
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: apiKeyValidation.apiKeyId },
      });

      if (!apiKey || (!apiKey.scope.includes('read') && !apiKey.scope.includes('all'))) {
        return apiErrorResponse(
          'API key does not have read scope',
          request,
          403
        );
      }

      // API key authenticated - fetch and return data
      const data = await fetchSecureData(apiKeyValidation.userId);
      return apiResponse(data, request, 200);
    }

    // Step 2: Check for CSRF token (browser-based requests)
    // GET requests don't require CSRF (read-only), but you might want to validate auth
    const userId = request.headers.get('X-User-ID'); // Set by middleware
    
    if (!userId) {
      return apiErrorResponse(
        'Authentication required',
        request,
        401
      );
    }

    // Fetch and return secure data
    const data = await fetchSecureData(userId);
    return apiResponse(data, request, 200);

  } catch (error) {
    console.error('[/api/example/secure-endpoint] Error:', error);
    return apiErrorResponse(
      'Internal server error',
      request,
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Step 1: Check for API key (for programmatic writes)
    const authHeader = request.headers.get('Authorization');
    
    if (authHeader?.startsWith('Bearer sk_')) {
      const apiKeyValidation = await validateApiKey(request);
      
      if (!apiKeyValidation.valid) {
        return apiErrorResponse(
          apiKeyValidation.error || 'Invalid API key',
          request,
          apiKeyValidation.statusCode || 401
        );
      }

      // Validate write scope
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: apiKeyValidation.apiKeyId },
      });

      if (!apiKey || (!apiKey.scope.includes('write') && !apiKey.scope.includes('all'))) {
        return apiErrorResponse(
          'API key does not have write scope',
          request,
          403
        );
      }

      // Parse body and create resource
      const body = await request.json();
      const result = await createSecureResource(apiKeyValidation.userId, body);
      
      return apiResponse(result, request, 201);
    }

    // Step 2: Check for CSRF token (browser-based requests)
    const csrfValid = await validateCSRFMiddleware(request);
    if (!csrfValid) {
      return apiErrorResponse(
        'CSRF token validation failed',
        request,
        403
      );
    }

    const userId = request.headers.get('X-User-ID');
    if (!userId) {
      return apiErrorResponse(
        'Authentication required',
        request,
        401
      );
    }

    // Parse body and create resource
    const body = await request.json();
    const result = await createSecureResource(userId, body);
    
    return apiResponse(result, request, 201);

  } catch (error) {
    console.error('[/api/example/secure-endpoint] Error:', error);
    return apiErrorResponse(
      'Internal server error',
      request,
      500
    );
  }
}

/**
 * Helper: Fetch secure data for user
 */
async function fetchSecureData(userId: string) {
  // Example: fetch user's shipments
  const shipments = await prisma.shipment.findMany({
    where: { userId },
    select: {
      id: true,
      reference: true,
      status: true,
      createdAt: true,
    },
    take: 10,
  });

  return {
    success: true,
    data: shipments,
    meta: {
      total: shipments.length,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Helper: Create secure resource for user
 */
async function createSecureResource(userId: string, body: Record<string, unknown>) {
  // Validate body
  if (!body.name) {
    throw new Error('Name is required');
  }

  // Create resource in database
  const resource = await prisma.shipment.create({
    data: {
      userId,
      reference: `REF-${Date.now()}`,
      status: 'pending',
    },
  });

  return {
    success: true,
    id: resource.id,
    message: 'Resource created successfully',
    data: resource,
  };
}
