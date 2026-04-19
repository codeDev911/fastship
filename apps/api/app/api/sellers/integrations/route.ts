import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

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
      sellerId = verified.payload.jobId as string;
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get seller
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      return NextResponse.json(
        { message: 'Seller not found' },
        { status: 404 }
      );
    }

    // Fetch real integrations from database
    const dbIntegrations = await prisma.integration.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
    });

    // Format integrations for response
    const integrations = await Promise.all(
      dbIntegrations.map(async (integration) => {
        // Get order count for this integration
        const ordersCount = await prisma.shopifyOrder.count({
          where: { integrationId: integration.id },
        });

        const importedCount = await prisma.shopifyOrder.count({
          where: {
            integrationId: integration.id,
            shipmentId: { not: null },
          },
        });

        return {
          id: integration.id,
          name: integration.integrationType === 'SHOPIFY' 
            ? `Shopify - ${integration.shopifyStoreUrl}`
            : integration.integrationType,
          type: 'platform',
          status: integration.isActive ? 'connected' : 'disconnected',
          description: `E-commerce store integration`,
          connectedAt: integration.createdAt,
          lastSyncedAt: integration.lastSyncedAt,
          syncStatus: integration.syncStatus,
          icon: integration.integrationType === 'SHOPIFY' ? '🛍️' : '🔗',
          stats: {
            totalOrders: ordersCount,
            importedOrders: importedCount,
          },
        };
      })
    );

    // Add placeholder for disconnected platforms
    const availablePlatforms = ['shopify']; // Will add more later
    const connectedTypes = new Set(dbIntegrations.map((i) => i.integrationType.toLowerCase()));

    const disconnectedIntegrations = availablePlatforms
      .filter((p) => !connectedTypes.has(p))
      .map((platform) => ({
        id: platform,
        name: platform.charAt(0).toUpperCase() + platform.slice(1),
        type: 'platform',
        status: 'disconnected',
        description: `Connect your ${platform} store`,
        connectedAt: null,
        lastSyncedAt: null,
        syncStatus: 'IDLE',
        icon: platform === 'shopify' ? '🛍️' : '🔗',
        stats: {
          totalOrders: 0,
          importedOrders: 0,
        },
      }));

    const allIntegrations = [...integrations, ...disconnectedIntegrations];

    return NextResponse.json({
      data: allIntegrations,
      total: allIntegrations.length,
    });
  } catch (error) {
    console.error('[Integrations] Error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}
