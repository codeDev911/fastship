import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { IntegrationService } from '@/lib/services/integration.service';

/**
 * POST /api/integrations/shopify/update-status
 * Updates Shopify order status and tracking info when shipment status changes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shipmentId, integrationId, status } = body;

    if (!shipmentId || !integrationId || !status) {
      return NextResponse.json(
        { error: 'Missing shipmentId, integrationId, or status' },
        { status: 400 }
      );
    }

    // Get shipment details
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        seller: {
          include: {
            integrations: true,
          },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    // Get the associated Shopify order
    const shopifyOrder = await prisma.shopifyOrder.findFirst({
      where: {
        shipmentId: shipmentId,
        integrationId: integrationId,
      },
      include: {
        integration: true,
      },
    });

    if (!shopifyOrder) {
      return NextResponse.json(
        { error: 'Shopify order not found for this shipment' },
        { status: 404 }
      );
    }

    // Get the integration service
    const shopifyService = await IntegrationService.getShopifyService(integrationId);

    if (!shopifyService) {
      return NextResponse.json(
        { error: 'Failed to initialize Shopify service' },
        { status: 500 }
      );
    }

    // Map shipment status to Shopify-friendly status
    const statusMap: Record<string, string> = {
      PENDING: 'PENDING',
      ASSIGNED: 'PROCESSING',
      PICKUP: 'PROCESSING',
      PICKED_UP: 'IN_TRANSIT',
      IN_TRANSIT: 'IN_TRANSIT',
      DELIVERED: 'DELIVERED',
      FAILED: 'FAILED',
      CANCELLED: 'CANCELLED',
      RETURNED: 'RETURNED',
    };

    const shopifyStatus = statusMap[status] || status;

    // Build tracking info with current status
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const trackingUrl = `${baseUrl}/track?id=${shipmentId}`;

    const trackingInfo = {
      trackingNumber: shipmentId,
      carrier: 'FastShip',
      url: trackingUrl,
      status: shopifyStatus,
      eta: shipment.deliveredAt ? undefined : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ETA
    };

    // Update tracking metafield in Shopify
    const trackingUpdated = await shopifyService.addTrackingMetafield(
      shopifyOrder.shopifyOrderId,
      trackingInfo
    );

    if (!trackingUpdated) {
      console.warn('Failed to update tracking metafield in Shopify order');
    }

    // Update ShopifyOrder sync timestamp
    await prisma.shopifyOrder.update({
      where: { id: shopifyOrder.id },
      data: {
        lastStatusSyncAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Shopify order status updated successfully',
      shipmentStatus: status,
      shopifyStatus: shopifyStatus,
      trackingUrl,
      trackingNumber: shipmentId,
    });
  } catch (error) {
    console.error('Shopify status update error:', error);
    return NextResponse.json(
      { error: 'Failed to update Shopify order status' },
      { status: 500 }
    );
  }
}
