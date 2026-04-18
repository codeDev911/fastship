import { prisma } from '@/lib/prisma';
import { ShopifyService } from './shopify.service';

/**
 * OrderUpdateService - Syncs FastShip shipment status back to Shopify orders
 */
export class OrderUpdateService {
  /**
   * Sync shipment status to connected Shopify order
   * Called when shipment status changes
   */
  static async syncShipmentStatusToShop(shipmentId: string): Promise<boolean> {
    try {
      // Get shipment with status
      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
        include: {
          shopifyOrders: true,
        },
      });

      if (!shipment || !shipment.shopifyOrders || shipment.shopifyOrders.length === 0) {
        console.log(`No Shopify orders found for shipment ${shipmentId}`);
        return false;
      }

      // Get the first Shopify order mapping
      const shopifyOrder = shipment.shopifyOrders[0];

      // Get integration details
      const integration = await prisma.integration.findUnique({
        where: { id: shopifyOrder.integrationId },
      });

      if (!integration || !integration.accessToken || !integration.shopifyStoreUrl) {
        throw new Error('Integration not found or inactive');
      }

      // Create Shopify service
      const shopifyService = await ShopifyService.createFromIntegration(
        integration.shopifyStoreUrl,
        integration.accessToken
      );

      // Map FastShip status to Shopify tracking status
      const trackingStatus = this.mapShipmentStatusToTrackingStatus(
        shipment.status
      );

      // Prepare tracking data
      const trackingData = {
        trackingNumber: `FS-${shipmentId.substring(0, 8).toUpperCase()}`,
        carrier: 'FastShip', // Could be more specific
        status: trackingStatus,
        eta: this.estimateDeliveryDate(shipment.status),
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/track?id=${shipmentId}`,
      };

      // Update Shopify order metafields
      const success = await shopifyService.addTrackingMetafield(
        shopifyOrder.shopifyOrderId,
        trackingData
      );

      if (success) {
        // Update last status sync timestamp
        await prisma.shopifyOrder.update({
          where: { id: shopifyOrder.id },
          data: {
            lastStatusSyncAt: new Date(),
          },
        });

        // Log activity
        await prisma.shipmentActivity.create({
          data: {
            shipmentId,
            action: 'SHOPIFY_SYNC',
            status: shipment.status,
            description: `Synced status to Shopify order ${shopifyOrder.shopifyOrderNumber}`,
            timestamp: new Date(),
          },
        }).catch(() => {}); // Ignore if ShipmentActivity creation fails

        console.log(
          `Successfully synced shipment ${shipmentId} status to Shopify`
        );
        return true;
      }

      throw new Error('Failed to update Shopify order metafields');
    } catch (error) {
      console.error(
        `Error syncing shipment status to Shopify for ${shipmentId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Sync all pending status updates for a seller
   */
  static async syncAllPendingUpdates(sellerId: string): Promise<number> {
    try {
      // Get shipments with Shopify orders that haven't been synced recently
      const shipments = await prisma.shipment.findMany({
        where: {
          sellerId,
          shopifyOrders: {
            some: {
              integration: {
                isActive: true,
              },
            },
          },
        },
        include: {
          shopifyOrders: {
            include: {
              integration: true,
            },
          },
        },
      });

      let syncedCount = 0;

      for (const shipment of shipments) {
        // Check if status sync is needed (either never synced or synced > 30 min ago)
        const lastSync = shipment.shopifyOrders[0]?.lastStatusSyncAt;
        const needsSync =
          !lastSync ||
          new Date().getTime() - new Date(lastSync).getTime() > 30 * 60 * 1000;

        if (needsSync) {
          const success = await this.syncShipmentStatusToShop(shipment.id);
          if (success) {
            syncedCount++;
          }
        }
      }

      return syncedCount;
    } catch (error) {
      console.error('Error syncing pending updates:', error);
      return 0;
    }
  }

  /**
   * Map FastShip shipment status to Shopify tracking status
   */
  private static mapShipmentStatusToTrackingStatus(status: string): string {
    const statusMap: Record<string, string> = {
      PENDING: 'pending',
      ASSIGNED: 'processing',
      PICKUP: 'processing',
      PICKED_UP: 'in_transit',
      IN_TRANSIT: 'in_transit',
      DELIVERED: 'delivered',
      FAILED: 'failed',
      CANCELLED: 'cancelled',
      RETURNED: 'returned',
    };

    return statusMap[status] || 'pending';
  }

  /**
   * Estimate delivery date based on current status
   */
  private static estimateDeliveryDate(status: string): string | undefined {
    if (status === 'DELIVERED') {
      return new Date().toISOString().split('T')[0];
    }

    if (status === 'IN_TRANSIT' || status === 'PICKED_UP') {
      // Estimate 2-3 days delivery
      const eta = new Date();
      eta.setDate(eta.getDate() + 2);
      return eta.toISOString().split('T')[0];
    }

    if (status === 'ASSIGNED' || status === 'PENDING') {
      // Estimate 3-4 days
      const eta = new Date();
      eta.setDate(eta.getDate() + 3);
      return eta.toISOString().split('T')[0];
    }

    return undefined;
  }

  /**
   * Get Shopify order mapping for a shipment
   */
  static async getShopifyOrderMapping(shipmentId: string) {
    try {
      return await prisma.shopifyOrder.findFirst({
        where: { shipmentId },
        include: {
          integration: true,
        },
      });
    } catch (error) {
      console.error('Error getting Shopify order mapping:', error);
      return null;
    }
  }

  /**
   * Get sync status between shipment and Shopify
   */
  static async getSyncStatus(shipmentId: string) {
    try {
      const shopifyOrder = await this.getShopifyOrderMapping(shipmentId);

      if (!shopifyOrder) {
        return null;
      }

      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
      });

      return {
        shopifyOrderId: shopifyOrder.shopifyOrderId,
        shopifyOrderNumber: shopifyOrder.shopifyOrderNumber,
        lastSyncedAt: shopifyOrder.lastStatusSyncAt,
        shipmentStatus: shipment?.status,
        isSynced: !!shopifyOrder.lastStatusSyncAt,
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return null;
    }
  }
}
