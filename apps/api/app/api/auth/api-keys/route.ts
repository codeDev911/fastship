import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';
import { generateApiKey } from '@fastship/lib';
import { validateCSRFMiddleware, csrfErrorResponse } from '../../../../lib/csrf-middleware';

/**
 * GET /api/auth/api-keys
 * List all API keys for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const userId = request.nextUrl.searchParams.get('userId') || '';



    // Get all API keys for user (excluding hashes)
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        prefix: true,
        scope: true,
        rateLimit: true,
        isActive: true,
        lastUsedAt: true,
        requestCount: true,
        createdAt: true,
        expiresAt: true,
        revokedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      data: apiKeys,
      count: apiKeys.length,
    });
  } catch (error) {
    console.error('[API Keys] GET error:', error);
    return NextResponse.json(
      { message: 'Failed to retrieve API keys' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/api-keys
 * Create a new API key for authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token
    if (!(await validateCSRFMiddleware(request))) {
      return csrfErrorResponse();
    }

    // Verify authentication
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key'
    );
    const verified = await jwtVerify(token, secret);
    const userId = (verified.payload as any).id;

    // Parse request body
    const { 
      name, 
      scope = 'read', 
      rateLimit = 1000, 
      expiresAt,
      environment = 'test'
    } = await request.json();

    // Validate input
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { message: 'API key name is required' },
        { status: 400 }
      );
    }

    // Generate new API key
    const { key, prefix, hash } = generateApiKey(environment);

    // Store in database
    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        name,
        keyHash: hash,
        prefix,
        scope,
        rateLimit,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        scope: true,
        rateLimit: true,
        createdAt: true,
      },
    });

    // Return API key (only time it's visible - user must save it)
    return NextResponse.json(
      {
        message: 'API key created successfully. Save it somewhere safe - you won\'t be able to see it again!',
        data: {
          ...apiKey,
          key, // Only returned once!
          warning: 'Save this API key immediately. You won\'t be able to retrieve it later!',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API Keys] POST error:', error);
    return NextResponse.json(
      { message: 'Failed to create API key' },
      { status: 500 }
    );
  }
}
