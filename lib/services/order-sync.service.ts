import { prisma } from '@/lib/prisma';
import { ShopifyService } from './shopify.service';
import { Prisma } from '@prisma/client';

export interface ShopifyOrderData {
  id: string;
  name: string;
  email: string;
  total_price: string;
  total_weight?: number;
  total_tax?: string;
  payment_gateway_names: string[];
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  shipping_address: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    zip: string;
    country: string;
    phone?: string;
    latitude:number;
    longitude:number;
  };
  line_items: Array<{
    title: string;
    quantity: number;
  }>;
}

export interface SyncResult {
  imported: number;
  skipped: number;
  errors: number;
  details: {
    success: string[];
    skipped: string[];
    failed: { id: string; error: string }[];
  };
}

/**
 * OrderSyncService - Handles synchronization of Shopify orders to FastShip shipments
 */
export class OrderSyncService {
  /**
   * Sync Shopify orders to FastShip shipments
   */
  static async syncShopifyOrders(
    integrationId: string,
    sellerId: string,
    orderIds?: string[]
  ): Promise<SyncResult> {
    const result: SyncResult = {
      imported: 0,
      skipped: 0,
      errors: 0,
      details: {
        success: [],
        skipped: [],
        failed: [],
      },
    };

    try {
      // Get integration and Shopify service
      const integration = await prisma.integration.findUnique({
        where: { id: integrationId },
      });

      if (!integration || !integration.shopifyStoreUrl || !integration.accessToken) {
        throw new Error('Invalid integration');
      }

      // Update sync status
      await prisma.integration.update({
        where: { id: integrationId },
        data: { syncStatus: 'SYNCING' },
      });

      const shopifyService = await ShopifyService.createFromIntegration(
        integration.shopifyStoreUrl,
        integration.accessToken
      );

      // Fetch orders from Shopify
      let shopifyOrders: any[] = [];

      if (orderIds && orderIds.length > 0) {
        // Fetch specific orders
        for (const orderId of orderIds) {
          try {
            const order = await shopifyService.fetchOrderDetails(orderId);
            if (order) {
              shopifyOrders.push(order);
            }
          } catch (error) {
            result.details.failed.push({
              id: orderId,
              error: `Failed to fetch order: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
            result.errors++;
          }
        }
      } else {
        // Fetch all recent unfulfilled orders
        shopifyOrders = await shopifyService.fetchOrders({
          status: 'any',
          fulfillment_status: 'unshipped',
          limit: 250,
        });
      }

      // Process each order
      for (const shopifyOrder of shopifyOrders) {
        try {
          // Check for duplicate import
          const existingMapping = await prisma.shopifyOrder.findUnique({
            where: {
              integrationId_shopifyOrderId: {
                integrationId,
                shopifyOrderId: shopifyOrder.id.toString(),
              },
            },
          });

          if (existingMapping && existingMapping.shipmentId) {
            result.details.skipped.push(`Order ${shopifyOrder.name} already imported`);
            result.skipped++;
            
            continue;
          }

          

          // Transform Shopify order to shipment
          const shipmentData = this.transformShopifyOrderToShipment(
            shopifyOrder,
            sellerId
          );

          

          // Validate shipment data
          await this.validateShipmentData(shipmentData);

          await prisma.$transaction(async (tx) => {
            // Create shipment
          const shipment = await tx.shipment.create({
            data: shipmentData,
          });

          

          // Create or update ShopifyOrder mapping
          await tx.shopifyOrder.upsert({
            where: {
              integrationId_shopifyOrderId: {
                integrationId,
                shopifyOrderId: shopifyOrder.id.toString(),
              },
            },
            create: {
              integrationId,
              shopifyOrderId: shopifyOrder.id.toString(),
              shopifyOrderNumber: shopifyOrder.name,
              shipmentId: shipment.id,
              metadata: JSON.stringify({
                customerEmail: shopifyOrder.email,
                customerPhone: shopifyOrder.shipping_address?.phone,
                lineItems: shopifyOrder.line_items,
                sourceOrder: 'shopify',
              }),
            },
            update: {
              shipmentId: shipment.id,
              syncedAt: new Date(),
            },
          });

          result.details.success.push(shopifyOrder.name);
          result.imported++;
          },{timeout: 10000}); // Set transaction timeout to 10 seconds
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : 'Unknown error';
          result.details.failed.push({
            id: shopifyOrder.id,
            error: errorMsg,
          });

          console.log(error);
          
          
          result.errors++;
        }
      }

      // Update sync status
      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          syncStatus: 'SUCCESS',
          lastSyncedAt: new Date(),
          lastSyncErrorMsg: null,
        },
      });

      return result;
    } catch (error) {
      console.error('Error syncing Shopify orders:', error);
        
      // Update sync status on error
      await prisma.integration
        .update({
          where: { id: integrationId },
          data: {
            syncStatus: 'FAILED',
            lastSyncErrorMsg: error instanceof Error ? error.message : 'Unknown error',
          },
        })
        .catch(() => {});

      throw error;
    }
  }

  /**
   * Transform Shopify order to FastShip shipment
   */
  static transformShopifyOrderToShipment(
    shopifyOrder: ShopifyOrderData,
    sellerId: string
  ): Prisma.ShipmentCreateInput {
    const shippingAddress = shopifyOrder.shipping_address;
    const customerInfo = shopifyOrder.customer || {
      first_name: shippingAddress.first_name,
      last_name: shippingAddress.last_name,
      email: shopifyOrder.email,
      phone: shippingAddress.phone,
    };


    

    // Build description from line items
    const description =
      shopifyOrder.line_items
        .map((item) => `${item.title} (x${item.quantity})`)
        .join(', ') || 'Order items';

    // Extract customer phone or email for contact
    const customerPhone =
      customerInfo.phone ||
      '0000000000'; // Fallback if no phone available
    const customerEmail = customerInfo.email || 'unknown@example.com';

    // Note: In a real scenario, you'd get pickup address from seller profile
    // For now, using placeholder that should be configured per seller
    const shipment: Prisma.ShipmentCreateInput = {
      seller: {
        connect: { id: sellerId },
      },
      
      // Pickup (from seller's store - should be configured)
      pickupName: 'Store Pickup',
      pickupPhone: '03000000000',
      pickupAddress: '123 Store St',
      pickupCity: 'Lahore',
      pickupState: 'Punjab',
      pickupZipCode: '42000',

      // Delivery (from customer address in Shopify order)
      deliveryName: `${customerInfo.first_name} ${customerInfo.last_name}`,
      deliveryPhone: customerPhone,
      deliveryAddress: shippingAddress.address1 || "",
      deliveryCity: shippingAddress.city || "",
      deliveryState: shippingAddress.province || "",
      deliveryZipCode: shippingAddress.zip || "0000",
      deliveryLatitude: shippingAddress?.latitude || 0,
      deliveryLongitude: shippingAddress?.longitude || 0,
      // Package info (defaults - should ideally come from order)
      weight: Number(shopifyOrder?.total_weight)/1000 || 1, // Default 1 kg - should be calculated from items
      dimensions: null,
      packageType: 'PARCEL',
      description,

      // Payment method
      paymentMethod: shopifyOrder?.payment_gateway_names[0]?.includes("Cash on Delivery")?"COD":"PREPAID", // Assuming prepaid from e-commerce order
      codAmount:Number(shopifyOrder?.total_price)||0,

      // Status
      status: 'PENDING',
      priority: 'STANDARD',
      notes: `Imported from Shopify order ${shopifyOrder.name}. Customer: ${customerEmail}`,

      // Metadata for tracking
      isInCityDelivery: false,
    };

    

    return shipment;
  }

  /**
   * Validate shipment data before creation
   */
  static async validateShipmentData(
    shipmentData: Prisma.ShipmentCreateInput
  ): Promise<void> {
    // Check required fields
    const requiredFields = [
      'pickupName',
      'pickupPhone',
      'pickupAddress',
      'pickupCity',
      'pickupState',
      'pickupZipCode',
      'deliveryName',
      'deliveryPhone',
      'deliveryAddress',
      'deliveryCity',
    //   'deliveryState',
    //   'deliveryZipCode',
      'weight',
      'packageType',
      'description',
    ];

    for (const field of requiredFields) {
      const value = shipmentData[field as keyof typeof shipmentData];
      if (!value || value === '' || value === null) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate phone format (basic)
   
    // Validate weight
    if (typeof shipmentData.weight !== 'number' || shipmentData.weight <= 0) {
      throw new Error('Invalid weight');
    }
  }

  /**
   * Check if Shopify order has already been imported
   */
  static async checkDuplicateImport(
    integrationId: string,
    shopifyOrderId: string
  ): Promise<boolean> {
    try {
      const existing = await prisma.shopifyOrder.findUnique({
        where: {
          integrationId_shopifyOrderId: {
            integrationId,
            shopifyOrderId,
          },
        },
      });

      return !!existing && !!existing.shipmentId;
    } catch (error) {
      console.error('Error checking duplicate import:', error);
      return false;
    }
  }

  /**
   * Get list of available orders ready to import (not yet imported)
   */
  static async getAvailableOrdersForImport(
    integrationId: string
  ): Promise<any[]> {
    try {
      // Get integration and Shopify service
      const integration = await prisma.integration.findUnique({
        where: { id: integrationId },
      });

      if (!integration || !integration.shopifyStoreUrl || !integration.accessToken) {
        throw new Error('Invalid integration');
      }

      const shopifyService = await ShopifyService.createFromIntegration(
        integration.shopifyStoreUrl,
        integration.accessToken
      );

      // Fetch unfulfilled orders
      const allOrders = await shopifyService.fetchOrders({
        status: 'any',
        fulfillment_status: 'unshipped',
        limit: 250,
      });

      // Get already imported order IDs
      const imported = await prisma.shopifyOrder.findMany({
        where: {
          integrationId,
          shipmentId: { not: null },
        },
        select: { shopifyOrderId: true },
      });

      const importedIds = new Set(imported.map((o) => o.shopifyOrderId));

      // Filter out already imported orders
      return allOrders.filter(
        (order) => !importedIds.has(order.id)
      );
    } catch (error) {
      console.error('Error getting available orders:', error);
      throw error;
    }
  }
}
