import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { IntegrationService } from '@/lib/services/integration.service';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

/**
 * DELETE /api/integrations/[id]
 * Disconnect/remove an integration
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const integrationId = params.id;

    // Verify integration belongs to seller
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
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

    // Disconnect integration
    const disconnected = await IntegrationService.disconnectIntegration(
      integrationId
    );

    return NextResponse.json({
      success: true,
      message: 'Integration disconnected successfully',
      data: {
        id: disconnected.id,
        integrationType: disconnected.integrationType,
        isActive: disconnected.isActive,
      },
    });
  } catch (error) {
    console.error('[Disconnect Integration] Error:', error);
    return NextResponse.json(
      {
        message: 'Failed to disconnect integration',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/[id]
 * Get integration details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const integrationId = params.id;

    // Get integration
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
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

    // Get related ShopifyOrder count
    const ordersCount = await prisma.shopifyOrder.count({
      where: { integrationId },
    });

    const shippedCount = await prisma.shopifyOrder.count({
      where: {
        integrationId,
        shipmentId: { not: null },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: integration.id,
        integrationType: integration.integrationType,
        shopifyStoreUrl: integration.shopifyStoreUrl,
        isActive: integration.isActive,
        syncStatus: integration.syncStatus,
        lastSyncedAt: integration.lastSyncedAt,
        lastSyncErrorMsg: integration.lastSyncErrorMsg,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
        stats: {
          totalOrders: ordersCount,
          importedOrders: shippedCount,
        },
      },
    });
  } catch (error) {
    console.error('[Get Integration] Error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch integration' },
      { status: 500 }
    );
  }
}
