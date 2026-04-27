import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export async function GET(request: NextRequest) {
  try {
    // Verify authentication
     const sellerId = request.nextUrl.searchParams.get('sellerId');
    if (!sellerId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
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
