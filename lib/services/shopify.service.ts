import { decryptToken } from '@/lib/encryption';

interface ShopifyOrder {
  id: string;
  name: string;
  email: string;
  created_at: string;
  total_price: string;
  fulfillment_status: string | null;
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
  };
  line_items: Array<{
    id: string;
    title: string;
    quantity: number;
    price: string;
  }>;
  customer?: {
    id: string;
    email: string;
    phone?: string;
    first_name: string;
    last_name: string;
  };
}

interface ShopifyOrdersResponse {
  orders: ShopifyOrder[];
}

interface ShopifyMetafieldInput {
  namespace: string;
  key: string;
  value: string;
  type: string;
}

/**
 * ShopifyService - Handles all Shopify API interactions
 * Supports both OAuth (Public Apps) and Custom App authentication
 */
export class ShopifyService {
  private storeUrl: string;
  private accessToken: string;

  constructor(storeUrl: string, accessToken: string) {
    this.storeUrl = storeUrl;
    this.accessToken = accessToken;
  }

  /**
   * Create from OAuth access token (Public Apps)
   */
  static async createFromIntegration(
    storeUrl: string,
    encryptedToken: string
  ): Promise<ShopifyService> {
    try {
      const accessToken = decryptToken(encryptedToken);
      return new ShopifyService(storeUrl, accessToken);
    } catch (error) {
      throw new Error('Failed to decrypt Shopify access token');
    }
  }

  /**
   * Create from Custom App API credentials
   */
  static async createFromCustomApp(
    storeUrl: string,
    encryptedApiKey: string
  ): Promise<ShopifyService> {
    try {
      // For Custom Apps, the API Key IS the access token
      const accessToken = decryptToken(encryptedApiKey);
      return new ShopifyService(storeUrl, accessToken);
    } catch (error) {
      throw new Error('Failed to decrypt Shopify API key');
    }
  }

  /**
   * Validate store connection
   */
  async validateStoreConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/shop.json', 'GET');
      return !!response.shop;
    } catch (error) {
      console.error('Failed to validate store connection:', error);
      return false;
    }
  }

  /**
   * Fetch orders from Shopify
   * Filters: status=any (all orders), financial_status, fulfillment_status, etc.
   */
  async fetchOrders(params?: {
    limit?: number;
    status?: 'any' | 'cancelled' | 'fulfilled' | 'paid' | 'pending' | 'refunded' | 'voided' | 'authorized' | 'partially_paid' | 'partially_refunded' | 'voided';
    financial_status?: 'authorized' | 'pending' | 'paid' | 'refunded' | 'voided' | 'partially_paid' | 'partially_refunded' | 'any';
    fulfillment_status?: 'fulfilled' | 'partial' | 'unshipped' | 'unfullfilled' | 'any' | 'restocked' | 'scheduled';
    created_at_min?: string;
    created_at_max?: string;
    updated_at_min?: string;
    updated_at_max?: string;
    limit?: number;
    fields?: string;
  }): Promise<ShopifyOrder[]> {
    try {
      const queryParams = new URLSearchParams();

      // Default: fetch last 250 orders with all statuses
      queryParams.append('status', params?.status || 'any');
      queryParams.append('limit', String(params?.limit || 250));

      if (params?.financial_status) {
        queryParams.append('financial_status', params.financial_status);
      }

      if (params?.fulfillment_status) {
        queryParams.append('fulfillment_status', params.fulfillment_status);
      }

      if (params?.created_at_min) {
        queryParams.append('created_at_min', params.created_at_min);
      }

      if (params?.created_at_max) {
        queryParams.append('created_at_max', params.created_at_max);
      }

      if (params?.updated_at_min) {
        queryParams.append('updated_at_min', params.updated_at_min);
      }

      if (params?.updated_at_max) {
        queryParams.append('updated_at_max', params.updated_at_max);
      }

      // Request specific fields for performance
      const fields = params?.fields || 'id,name,email,created_at,total_price,fulfillment_status,shipping_address,line_items,customer';
      queryParams.append('fields', fields);

      const response = await this.makeRequest(
        `/orders.json?${queryParams.toString()}`,
        'GET'
      );

      return response.orders || [];
    } catch (error) {
      console.error('Failed to fetch Shopify orders:', error);
      throw error;
    }
  }

  /**
   * Fetch a single order by ID
   */
  async fetchOrderDetails(orderId: string): Promise<ShopifyOrder | null> {
    try {
      // Extract numeric ID if GraphQL ID is provided
      
    //   const numericId = orderId && orderId?.includes('/')
    //     ? orderId?.split('/').pop()
        // : orderId;

        const numericId = orderId

      const response = await this.makeRequest(
        `/orders/${numericId}.json`,
        'GET'
      );

      return response.order || null;
    } catch (error) {
      console.error('Failed to fetch Shopify order details:', error);
      throw error;
    }
  }

  /**
   * Update order metafields with tracking information
   */
  async updateOrderMetafields(
    orderId: string,
    metafields: ShopifyMetafieldInput[]
  ): Promise<boolean> {
    try {
      // Extract numeric ID if GraphQL ID is provided
      
      const numericId = orderId?.includes('/')
        ? orderId?.split('/').pop()
        : orderId;

      const response = await this.makeRequest(
        `/orders/${numericId}.json`,
        'PUT',
        {
          order: {
            id: numericId,
            metafields: metafields,
          },
        }
      );

      return !!response.order;
    } catch (error) {
      console.error('Failed to update order metafields:', error);
      throw error;
    }
  }

  /**
   * Add tracking metafield to order
   */
  async addTrackingMetafield(
    orderId: string,
    tracking: {
      trackingNumber: string;
      carrier: string;
      url?: string;
      eta?: string;
      status: string;
    }
  ): Promise<boolean> {
    const metafields: ShopifyMetafieldInput[] = [
      {
        namespace: 'fulfillment_tracking',
        key: 'tracking_number',
        value: tracking.trackingNumber,
        type: 'single_line_text_field',
      },
      {
        namespace: 'fulfillment_tracking',
        key: 'carrier',
        value: tracking.carrier,
        type: 'single_line_text_field',
      },
      {
        namespace: 'fulfillment_tracking',
        key: 'status',
        value: tracking.status,
        type: 'single_line_text_field',
      },
    ];

    if (tracking.url) {
      metafields.push({
        namespace: 'fulfillment_tracking',
        key: 'tracking_url',
        value: tracking.url,
        type: 'single_line_text_field',
      });
    }

    if (tracking.eta) {
      metafields.push({
        namespace: 'fulfillment_tracking',
        key: 'estimated_delivery',
        value: tracking.eta,
        type: 'single_line_text_field',
      });
    }

    return this.updateOrderMetafields(orderId, metafields);
  }

  /**
   * Make authenticated request to Shopify API
   */
  private async makeRequest(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<any> {
    const url = `https://${this.storeUrl}/admin/api/2024-01${path}`;

    const options: RequestInit = {
      method,
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          `Shopify API error: ${response.status} - ${JSON.stringify(error)}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Shopify API request failed: ${method} ${path}`, error);
      throw error;
    }
  }
}
