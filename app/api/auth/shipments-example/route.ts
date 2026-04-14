import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';
import { validateCSRFMiddleware, csrfErrorResponse } from '@/lib/csrf-middleware';
import { validateApiKey, apiKeyErrorResponse } from '@/lib/api-key-middleware';

/**
 * GET /api/shipments
 * List shipments - accessible via:
 * 1. CSRF tokens (authenticated frontend users)
 * 2. API keys (third-party integrations)
 */
export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null;

    // Try API key authentication first
    const apiKeyResult = await validateApiKey(request);
    if (apiKeyResult.valid) {
      userId = apiKeyResult.userId;
    } else {
      // Fall back to CSRF token authentication
      const token = request.cookies.get('auth_token')?.value;

      if (!token) {
        return NextResponse.json(
          {
            message:
              'Unauthorized: Provide either a valid API key or authentication token',
          },
          { status: 401 }
        );
      }

      try {
        const secret = new TextEncoder().encode(
          process.env.JWT_SECRET || 'your-secret-key'
        );
        const verified = await jwtVerify(token, secret);
        userId = (verified.payload as any).id;
      } catch (error) {
        return NextResponse.json(
          { message: 'Invalid authentication token' },
          { status: 401 }
        );
      }
    }

    // Query for shipments based on user role/id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        seller: true,
        driver: true,
        business: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    let shipments;

    if (user.seller) {
      // Sellers see their own shipments
      shipments = await prisma.shipment.findMany({
        where: { sellerId: user.seller.id },
        include: { assignment: true, tracking: true },
        take: 50,
      });
    } else if (user.business) {
      // Businesses see assignments
      shipments = await prisma.shipment.findMany({
        where: {
          assignment: {
            businessId: user.business.id,
          },
        },
        include: { assignment: true, tracking: true },
        take: 50,
      });
    } else {
      // Drivers see assigned shipments
      shipments = await prisma.shipment.findMany({
        where: {
          assignment: {
            driverId: user.driver?.id,
          },
        },
        include: { assignment: true, tracking: true },
        take: 50,
      });
    }

    return NextResponse.json({
      data: shipments,
      count: shipments.length,
    });
  } catch (error) {
    console.error('[Shipments] GET error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch shipments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shipments
 * Create shipment - only for authenticated frontend users
 * Third-party API keys need explicit SCOPE permission
 */
export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null;
    let apiKeyId: string | null = null;

    // Try API key authentication first
    const apiKeyResult = await validateApiKey(request);
    if (apiKeyResult.valid) {
      userId = apiKeyResult.userId;
      apiKeyId = apiKeyResult.apiKeyId;

      // Check if API key has write scope
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: apiKeyId },
      });

      if (!apiKey || !apiKey.scope.includes('write')) {
        return apiKeyErrorResponse(
          'API key does not have write permission',
          403
        );
      }

      console.log(
        `[Shipments] Request from API key: ${apiKey.prefix} (user: ${userId})`
      );
    } else {
      // Fall back to CSRF token authentication
      if (!(await validateCSRFMiddleware(request))) {
        return csrfErrorResponse();
      }

      const token = request.cookies.get('auth_token')?.value;

      if (!token) {
        return NextResponse.json(
          { message: 'Unauthorized' },
          { status: 401 }
        );
      }

      try {
        const secret = new TextEncoder().encode(
          process.env.JWT_SECRET || 'your-secret-key'
        );
        const verified = await jwtVerify(token, secret);
        userId = (verified.payload as any).id;
      } catch (error) {
        return NextResponse.json(
          { message: 'Invalid authentication token' },
          { status: 401 }
        );
      }
    }

    // Parse and validate request
    const body = await request.json();
    const {
      pickupName,
      pickupPhone,
      pickupAddress,
      deliveryName,
      deliveryPhone,
      deliveryAddress,
      weight,
      packageType,
      description,
    } = body;

    if (
      !pickupName ||
      !pickupPhone ||
      !deliveryName ||
      !deliveryPhone ||
      !weight ||
      !packageType
    ) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get seller ID from user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { seller: true },
    });

    if (!user || !user.seller) {
      return NextResponse.json(
        { message: 'Only sellers can create shipments' },
        { status: 403 }
      );
    }

    // Create shipment (simplified for example)
    // In real app, validate all fields and business logic
    const shipment = await prisma.shipment.create({
      data: {
        sellerId: user.seller.id,
        pickupName,
        pickupPhone,
        pickupAddress,
        pickupCity: body.pickupCity || 'N/A',
        pickupState: body.pickupState || 'N/A',
        pickupZipCode: body.pickupZipCode || 'N/A',
        deliveryName,
        deliveryPhone,
        deliveryAddress,
        deliveryCity: body.deliveryCity || 'N/A',
        deliveryState: body.deliveryState || 'N/A',
        deliveryZipCode: body.deliveryZipCode || 'N/A',
        weight,
        packageType,
        description: description || '',
      },
    });

    return NextResponse.json(
      {
        message: 'Shipment created successfully',
        data: shipment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Shipments] POST error:', error);
    return NextResponse.json(
      { message: 'Failed to create shipment' },
      { status: 500 }
    );
  }
}
