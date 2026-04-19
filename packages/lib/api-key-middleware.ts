import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '../lib/prisma';
import {
  getApiKeyFromHeaders,
  hashApiKey,
  isApiKeyValid,
  hasScope,
} from './api-key';

export interface ApiKeyValidationResult {
  valid: boolean;
  userId?: string;
  apiKeyId?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Validate API key from request headers
 * Returns validation result with userId if valid
 * Also tracks rate limiting and last used time
 */
export async function validateApiKey(
  request: NextRequest
): Promise<ApiKeyValidationResult> {
  try {
    const apiKey = getApiKeyFromHeaders(request.headers);

    if (!apiKey) {
      return {
        valid: false,
        error: 'Missing API key in Authorization header',
        statusCode: 401,
      };
    }

    // Hash the provided key and look it up
    const keyHash = hashApiKey(apiKey);

    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: true },
    });

    if (!apiKeyRecord) {
      return {
        valid: false,
        error: 'Invalid API key',
        statusCode: 401,
      };
    }

    // Check if key is valid (active, not revoked, not expired)
    if (!isApiKeyValid(apiKeyRecord)) {
      return {
        valid: false,
        error: 'API key is inactive, revoked, or expired',
        statusCode: 401,
      };
    }

    // Check rate limiting
    const clientIp =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown';

    const rateLimitResult = await checkRateLimit(apiKeyRecord.id, clientIp);
    if (!rateLimitResult.allowed) {
      return {
        valid: false,
        error: `Rate limit exceeded. Max ${apiKeyRecord.rateLimit} requests per hour`,
        statusCode: 429,
      };
    }

    // Update last used time
    try {
      await prisma.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: {
          lastUsedAt: new Date(),
          lastUsedIp: clientIp,
          requestCount: {
            increment: 1,
          },
          requestCountHour: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      console.warn('[API Key] Failed to update last used time:', error);
    }

    return {
      valid: true,
      userId: apiKeyRecord.userId,
      apiKeyId: apiKeyRecord.id,
    };
  } catch (error) {
    console.error('[API Key] Validation error:', error);
    return {
      valid: false,
      error: 'Internal server error',
      statusCode: 500,
    };
  }
}

/**
 * Check rate limiting for an API key
 * Resets hourly counter if hour has passed
 */
async function checkRateLimit(
  apiKeyId: string,
  clientIp: string
): Promise<{ allowed: boolean }> {
  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: apiKeyId },
    });

    if (!apiKey) {
      return { allowed: false };
    }

    // Check if hour has passed since last reset
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    if (apiKey.requestCountReset < hourAgo) {
      // Reset hourly counter
      await prisma.apiKey.update({
        where: { id: apiKeyId },
        data: {
          requestCountHour: 1,
          requestCountReset: now,
        },
      });
      return { allowed: true };
    }

    // Check against rate limit
    const allowed = apiKey.requestCountHour < apiKey.rateLimit;

    return { allowed };
  } catch (error) {
    console.error('[Rate Limit] Check failed:', error);
    return { allowed: false };
  }
}

/**
 * Generate error response for API key validation failures
 */
export function apiKeyErrorResponse(
  error: string,
  statusCode: number = 401
) {
  return NextResponse.json({ message: error }, { status: statusCode });
}

/**
 * Validate API key has required scope
 */
export async function validateApiKeyScope(
  apiKeyId: string,
  requiredScope: string
): Promise<boolean> {
  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: apiKeyId },
    });

    if (!apiKey) {
      return false;
    }

    return hasScope(apiKey.scope, requiredScope);
  } catch (error) {
    console.error('[API Key] Scope validation error:', error);
    return false;
  }
}
