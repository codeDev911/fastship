import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encryptToken } from '@/lib/encryption';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;

if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET) {
  console.log('SHOPIFY_API_KEY and SHOPIFY_API_SECRET environment variables are required');
}

/**
 * POST /api/auth/oauth/shopify/callback
 * Handles OAuth callback from Shopify after user authorization
 * Query params: code, shop, state
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const shop = searchParams.get('shop');
    const state = searchParams.get('state');

    // Validate required parameters
    if (!code || !shop || !state) {
      return NextResponse.json(
        { message: 'Missing required OAuth parameters' },
        { status: 400 }
      );
    }

    // Get OAuth state from session/cookies to verify CSRF
    const oauthState = request.cookies.get('shopify_oauth_state')?.value;

    if (!oauthState || oauthState !== state) {
      return NextResponse.json(
        { message: 'Invalid OAuth state - possible CSRF attack' },
        { status: 403 }
      );
    }

    // Get seller ID from session
    const authToken = request.cookies.get('auth_token')?.value;
    let sellerId: string;

    if (!authToken) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token
    try {
      const verified = await jwtVerify(authToken, JWT_SECRET);
      sellerId = verified.payload.jobId as string;
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid authentication token' },
        { status: 401 }
      );
    }

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

    // Normalize shop URL
    const normalizedShop = shop.endsWith('.myshopify.com') 
      ? shop 
      : `${shop}.myshopify.com`;

    // Exchange authorization code for access token
    const tokenResponse = await fetch(
      `https://${normalizedShop}/admin/oauth/access_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: SHOPIFY_API_KEY,
          client_secret: SHOPIFY_API_SECRET,
          code: code,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Shopify OAuth error:', errorData);
      return NextResponse.json(
        { message: 'Failed to authenticate with Shopify', error: errorData.error_description },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token; // May be included if using offline access

    if (!accessToken) {
      return NextResponse.json(
        { message: 'No access token received from Shopify' },
        { status: 400 }
      );
    }

    // Encrypt tokens before storing
    const encryptedAccessToken = encryptToken(accessToken);
    const encryptedRefreshToken = refreshToken ? encryptToken(refreshToken) : null;

    // Verify store connection by calling Shopify API
    const verifyResponse = await fetch(
      `https://${normalizedShop}/admin/api/2024-01/shop.json`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      }
    );

    if (!verifyResponse.ok) {
      console.error('Failed to verify Shopify store connection');
      return NextResponse.json(
        { message: 'Failed to verify Shopify store connection' },
        { status: 400 }
      );
    }

    const shopData = await verifyResponse.json();

    // Update or create Integration record
    const integration = await prisma.integration.upsert({
      where: {
        sellerId_integrationType: {
          sellerId: sellerId,
          integrationType: 'SHOPIFY',
        },
      },
      create: {
        sellerId,
        integrationType: 'SHOPIFY',
        shopifyStoreUrl: normalizedShop,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        isActive: true,
        syncStatus: 'IDLE',
        metadata: JSON.stringify({
          shopName: shopData.shop?.name,
          shopDomain: shopData.shop?.myshopify_domain,
          shopEmail: shopData.shop?.email,
        }),
      },
      update: {
        shopifyStoreUrl: normalizedShop,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        isActive: true,
        syncStatus: 'IDLE',
        lastSyncErrorMsg: null,
        metadata: JSON.stringify({
          shopName: shopData.shop?.name,
          shopDomain: shopData.shop?.myshopify_domain,
          shopEmail: shopData.shop?.email,
        }),
        updatedAt: new Date(),
      },
    });

    // Clear OAuth state cookie
    const response = NextResponse.redirect(
      `${request.nextUrl.origin}/seller/integrations?status=connected&store=${normalizedShop}`
    );
    response.cookies.delete('shopify_oauth_state');
    response.cookies.delete('shopify_oauth_nonce');

    return response;
  } catch (error) {
    console.error('[OAuth Callback] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error during OAuth callback' },
      { status: 500 }
    );
  }
}
