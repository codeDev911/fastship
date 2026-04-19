import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encryptToken } from '@/lib/encryption';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

/**
 * POST /api/integrations/shopify/connect-custom-app
 * For Custom Apps: Directly authenticate using API credentials
 * No OAuth redirect needed
 * 
 * Request body:
 * {
 *   shopUrl: "mystore.myshopify.com",
 *   apiKey: "xxx",
 *   apiSecret: "shpss_xxx"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    let sellerId: string;
    try {
      const verified = await jwtVerify(authToken, JWT_SECRET);
      sellerId = verified.payload.userId as string;
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { shopUrl, apiKey, apiSecret } = body;

    if (!shopUrl || !apiKey || !apiSecret) {
      return NextResponse.json(
        { message: 'Shop URL, API Key, and API Secret are required' },
        { status: 400 }
      );
    }

    // Normalize shop URL
    const normalizedShop = shopUrl.includes('.myshopify.com')
      ? shopUrl
      : shopUrl.endsWith('.myshopify.com')
      ? shopUrl
      : `${shopUrl.replace(/https?:\/\//, '')}.myshopify.com`;

    // Validate shop URL format
    if (!normalizedShop.match(/^[a-zA-Z0-9-]+\.myshopify\.com$/)) {
      return NextResponse.json(
        { message: 'Invalid Shopify store URL format' },
        { status: 400 }
      );
    }

    // Test connection by calling Shopify API
    try {
      const shopResponse = await fetch(
        `https://${normalizedShop}/admin/api/2024-01/shop.json`,
        {
          headers: {
            'X-Shopify-Access-Token': apiKey,
          },
        }
      );

      if (!shopResponse.ok) {
        return NextResponse.json(
          { message: 'Invalid API credentials or store URL' },
          { status: 400 }
        );
      }

      const shopData = await shopResponse.json();

      // Encrypt API key before storing
      const encryptedApiKey = encryptToken(apiKey);
      const encryptedApiSecret = encryptToken(apiSecret);

      // Validate seller exists
      const seller = await prisma.seller.findUnique({
        where: { id: sellerId },
      });

      if (!seller) {
        return NextResponse.json(
          { message: 'Seller not found' },
          { status: 404 }
        );
      }

      // Create or update Integration
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
          shopifyStoreUrl: normalizedShop,
          apiKey: encryptedApiKey,
          apiSecret: encryptedApiSecret,
          isActive: true,
          syncStatus: 'IDLE',
          metadata: JSON.stringify({
            shopName: shopData.shop?.name,
            shopDomain: shopData.shop?.myshopify_domain,
            shopEmail: shopData.shop?.email,
            appType: 'CUSTOM_APP',
          }),
        },
        update: {
          shopifyStoreUrl: normalizedShop,
          apiKey: encryptedApiKey,
          apiSecret: encryptedApiSecret,
          isActive: true,
          syncStatus: 'IDLE',
          lastSyncErrorMsg: null,
          metadata: JSON.stringify({
            shopName: shopData.shop?.name,
            shopDomain: shopData.shop?.myshopify_domain,
            shopEmail: shopData.shop?.email,
            appType: 'CUSTOM_APP',
          }),
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Custom app connected successfully',
        data: {
          id: integration.id,
          shopUrl: normalizedShop,
          shopName: shopData.shop?.name,
          status: 'connected',
        },
      });
    } catch (error) {
      console.error('Failed to verify Shopify credentials:', error);
      return NextResponse.json(
        { message: 'Failed to verify Shopify credentials. Check your API key and secret.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Custom App Connect] Error:', error);
    return NextResponse.json(
      { message: 'Failed to connect Shopify store' },
      { status: 500 }
    );
  }
}
