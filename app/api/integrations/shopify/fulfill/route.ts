import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { IntegrationService } from '@/lib/services/integration.service';

/**
 * POST /api/integrations/shopify/fulfill
 * Fulfills a Shopify order with tracking information when a courier is assigned
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shipmentId, integrationId } = body;

    if (!shipmentId || !integrationId) {
      return NextResponse.json(
        { error: 'Missing shipmentId or integrationId' },
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

    // Build tracking info
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const trackingUrl = `${baseUrl}/track?id=${shipmentId}`;

    const trackingInfo = {
      trackingNumber: shipmentId, // Use shipment ID as tracking number
      carrier: 'FastShip',
      url: trackingUrl,
      status: 'PICKED_UP', // Initial status when fulfillment is created
    };

    // Add tracking metafield to Shopify order
    const trackingAdded = await shopifyService.addTrackingMetafield(
      shopifyOrder.shopifyOrderId,
      trackingInfo
    );

    if (!trackingAdded) {
      console.warn('Failed to add tracking metafield to Shopify order');
    }

    // Update ShopifyOrder with fulfillment timestamp
    await prisma.shopifyOrder.update({
      where: { id: shopifyOrder.id },
      data: {
        lastStatusSyncAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Shopify order fulfilled successfully',
      trackingUrl,
      trackingNumber: shipmentId,
    });
  } catch (error) {
    console.error('Shopify fulfillment error:', error);
    return NextResponse.json(
      { error: 'Failed to fulfill Shopify order' },
      { status: 500 }
    );
  }
}
