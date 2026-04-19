import { prisma } from '@fastship/lib';
import { ShopifyService } from './shopify.service';

export class IntegrationService {
  /**
   * Connect a Shopify store via OAuth (Public Apps)
   */
  static async connectShopifyStore(
    sellerId: string,
    storeUrl: string,
    accessToken: string,
    refreshToken?: string
  ) {
    try {
      // Validate seller exists
      const seller = await prisma.seller.findUnique({
        where: { id: sellerId },
      });

      if (!seller) {
        throw new Error('Seller not found');
      }

      // Normalize store URL
      const normalizedUrl = storeUrl.includes('.myshopify.com')
        ? storeUrl
        : `${storeUrl}.myshopify.com`;

      // Create or update integration
      const integration = await prisma.integration.upsert({
        where: {
          sellerId_integrationType: {
            sellerId,
            integrationType: 'SHOPIFY',
          },
        },
        create: {
          sellerId,
          integrationType: 'SHOPIFY',
          shopifyStoreUrl: normalizedUrl,
          accessToken,
          refreshToken: refreshToken || null,
          isActive: true,
          syncStatus: 'IDLE',
        },
        update: {
          shopifyStoreUrl: normalizedUrl,
          accessToken,
          refreshToken: refreshToken || null,
          isActive: true,
          syncStatus: 'IDLE',
          lastSyncErrorMsg: null,
        },
      });

      return integration;
    } catch (error) {
      console.error('Error connecting Shopify store:', error);
      throw error;
    }
  }

  /**
   * Connect via Custom App credentials (API Key/Secret)
   */
  static async connectCustomApp(
    sellerId: string,
    storeUrl: string,
    apiKey: string,
    apiSecret: string
  ) {
    try {
      // Validate seller exists
      const seller = await prisma.seller.findUnique({
        where: { id: sellerId },
      });

      if (!seller) {
        throw new Error('Seller not found');
      }

      // Normalize store URL
      const normalizedUrl = storeUrl.includes('.myshopify.com')
        ? storeUrl
        : `${storeUrl}.myshopify.com`;

      // Create or update integration
      const integration = await prisma.integration.upsert({
        where: {
          sellerId_integrationType: {
            sellerId,
            integrationType: 'SHOPIFY',
          },
        },
        create: {
          sellerId,
          integrationType: 'SHOPIFY',
          shopifyStoreUrl: normalizedUrl,
          apiKey,
          apiSecret,
          isActive: true,
          syncStatus: 'IDLE',
        },
        update: {
          shopifyStoreUrl: normalizedUrl,
          apiKey,
          apiSecret,
          isActive: true,
          syncStatus: 'IDLE',
          lastSyncErrorMsg: null,
        },
      });

      return integration;
    } catch (error) {
      console.error('Error connecting custom app:', error);
      throw error;
    }
  }

  /**
   * Disconnect/remove a seller's integration
   */
  static async disconnectIntegration(integrationId: string) {
    try {
      // Soft delete by marking inactive and clearing tokens
      const integration = await prisma.integration.update({
        where: { id: integrationId },
        data: {
          isActive: false,
          accessToken: null,
          refreshToken: null,
          apiKey: null,
          apiSecret: null,
          lastSyncErrorMsg: null,
        },
      });

      return integration;
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      throw error;
    }
  }

  /**
   * Get seller's active Shopify integration
   */
  static async getActiveShopifyIntegration(sellerId: string) {
    try {
      const integration = await prisma.integration.findFirst({
        where: {
          sellerId,
          integrationType: 'SHOPIFY',
          isActive: true,
        },
      });

      return integration;
    } catch (error) {
      console.error('Error fetching Shopify integration:', error);
      throw error;
    }
  }

  /**
   * Get all integrations for a seller
   */
  static async getSellerIntegrations(sellerId: string) {
    try {
      const integrations = await prisma.integration.findMany({
        where: { sellerId },
        orderBy: { createdAt: 'desc' },
      });

      return integrations;
    } catch (error) {
      console.error('Error fetching seller integrations:', error);
      throw error;
    }
  }

  /**
   * Test connection to a Shopify store
   */
  static async testConnection(integrationId: string): Promise<boolean> {
    try {
      const integration = await prisma.integration.findUnique({
        where: { id: integrationId },
      });

      if (!integration || !integration.shopifyStoreUrl || !integration.accessToken) {
        throw new Error('Invalid integration');
      }

      const service = await ShopifyService.createFromIntegration(
        integration.shopifyStoreUrl,
        integration.accessToken
      );

      const isValid = await service.validateStoreConnection();

      if (isValid) {
        // Update last sync info on successful connection
        await prisma.integration.update({
          where: { id: integrationId },
          data: {
            syncStatus: 'SUCCESS',
            lastSyncErrorMsg: null,
          },
        });
      } else {
        await prisma.integration.update({
          where: { id: integrationId },
          data: {
            syncStatus: 'FAILED',
            lastSyncErrorMsg: 'Store connection validation failed',
          },
        });
      }

      return isValid;
    } catch (error) {
      console.error('Error testing connection:', error);

      // Update sync status
      await prisma.integration
        .update({
          where: { id: integrationId },
          data: {
            syncStatus: 'FAILED',
            lastSyncErrorMsg: error instanceof Error ? error.message : 'Unknown error',
          },
        })
        .catch(() => {}); // Ignore if integration not found

      return false;
    }
  }

  /**
   * Update integration sync status
   */
  static async updateSyncStatus(
    integrationId: string,
    status: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'FAILED',
    errorMsg?: string
  ) {
    try {
      const data: any = {
        syncStatus: status,
      };

      if (status === 'SUCCESS') {
        data.lastSyncedAt = new Date();
        data.lastSyncErrorMsg = null;
      } else if (status === 'FAILED') {
        data.lastSyncErrorMsg = errorMsg || 'Sync failed';
      }

      const integration = await prisma.integration.update({
        where: { id: integrationId },
        data,
      });

      return integration;
    } catch (error) {
      console.error('Error updating sync status:', error);
      throw error;
    }
  }

  /**
   * Get ShopifyService instance from integration
   * Automatically detects Custom App vs OAuth
   */
  static async getShopifyService(integrationId: string): Promise<ShopifyService> {
    try {
      const integration = await prisma.integration.findUnique({
        where: { id: integrationId },
      });

      if (!integration || !integration.shopifyStoreUrl) {
        throw new Error('Invalid integration');
      }

      // Check if it's a Custom App (has apiKey) or OAuth (has accessToken)
      if (integration.apiKey) {
        // Custom App - use API Key as access token
        return await ShopifyService.createFromCustomApp(
          integration.shopifyStoreUrl,
          integration.apiKey
        );
      } else if (integration.accessToken) {
        // OAuth - use access token
        return await ShopifyService.createFromIntegration(
          integration.shopifyStoreUrl,
          integration.accessToken
        );
      } else {
        throw new Error('No valid credentials found for integration');
      }
    } catch (error) {
      console.error('Error creating ShopifyService:', error);
      throw error;
    }
  }
}
