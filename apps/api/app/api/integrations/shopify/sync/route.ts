import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderSyncService } from '@/lib/services/order-sync.service';
import { IntegrationService } from '@/lib/services/integration.service';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

/**
 * POST /api/integrations/shopify/sync
 * Manually trigger order import from Shopify
 * Body: { integrationId: string, orderIds?: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '');
    const cookieToken = request.cookies.get('auth_token')?.value || authToken;

    if (!cookieToken) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    let sellerId: string;
    try {
      const verified = await jwtVerify(cookieToken, JWT_SECRET);
      sellerId = verified.payload.jobId as string;
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { integrationId, orderIds } = body;

    if (!integrationId) {
      return NextResponse.json(
        { message: 'Integration ID is required' },
        { status: 400 }
      );
    }

    // Verify integration belongs to seller
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      include: { seller: true },
    });

    if (!integration) {
      return NextResponse.json(
        { message: 'Integration not found' },
        { status: 404 }
      );
    }

    if (integration.sellerId !== sellerId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Start sync
    const result = await OrderSyncService.syncShopifyOrders(
      integrationId,
      sellerId,
      orderIds
    );

    

    return NextResponse.json({
      success: true,
      data: result,
      message: `Imported ${result.imported} orders, skipped ${result.skipped}, ${result.errors} errors`,
    });
  } catch (error) {
    console.error('[Order Sync] Error:', error);
    return NextResponse.json(
      {
        message: 'Failed to sync orders',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/shopify/sync?integrationId=xxx
 * Get sync status
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '');
    const cookieToken = request.cookies.get('auth_token')?.value || authToken;

    if (!cookieToken) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    let sellerId: string;
    try {
      const verified = await jwtVerify(cookieToken, JWT_SECRET);
      sellerId = verified.payload.userId as string;
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = request.nextUrl;
    const integrationId = searchParams.get('integrationId');

    if (!integrationId) {
      return NextResponse.json(
        { message: 'Integration ID is required' },
        { status: 400 }
      );
    }

    // Verify integration belongs to seller
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      include: { seller: true },
    });

    if (!integration) {
      return NextResponse.json(
        { message: 'Integration not found' },
        { status: 404 }
      );
    }

    if (integration.sellerId !== sellerId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Return sync status
    return NextResponse.json({
      success: true,
      data: {
        integrationId,
        syncStatus: integration.syncStatus,
        lastSyncedAt: integration.lastSyncedAt,
        lastSyncErrorMsg: integration.lastSyncErrorMsg,
        isActive: integration.isActive,
      },
    });
  } catch (error) {
    console.error('[Sync Status] Error:', error);
    return NextResponse.json(
      { message: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
