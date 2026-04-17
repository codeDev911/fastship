import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderSyncService } from '@/lib/services/order-sync.service';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

/**
 * GET /api/integrations/shopify/orders?integrationId=xxx&page=1&limit=50
 * Fetch list of available orders ready to import
 */
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

    // Get query parameters
    const { searchParams } = request.nextUrl;
    const integrationId = searchParams.get('integrationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 250);

    if (!integrationId) {
      return NextResponse.json(
        { message: 'Integration ID is required' },
        { status: 400 }
      );
    }

    // Verify integration belongs to seller
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      include: { seller: true },
    });

    if (!integration) {
      return NextResponse.json(
        { message: 'Integration not found' },
        { status: 404 }
      );
    }

    if (integration.sellerId !== sellerId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if integration is active
    if (!integration.isActive) {
      return NextResponse.json(
        { message: 'Integration is not active' },
        { status: 400 }
      );
    }

    // Get available orders
    const allOrders =
      await OrderSyncService.getAvailableOrdersForImport(integrationId);

    // Paginate results
    const startIdx = (page - 1) * limit;
    const paginatedOrders = allOrders.slice(startIdx, startIdx + limit);

    // Format orders for frontend
    const formattedOrders = paginatedOrders.map((order) => ({
      id: order.id,
      orderNumber: order.name,
      email: order.email,
      totalPrice: order.total_price,
      createdAt: order.created_at,
      fulfillmentStatus: order.fulfillment_status,
      shippingAddress: {
        firstName: order.shipping_address?.first_name,
        lastName: order.shipping_address?.last_name,
        address: order.shipping_address?.address1,
        city: order.shipping_address?.city,
        state: order.shipping_address?.province,
        zipCode: order.shipping_address?.zip,
        country: order.shipping_address?.country,
        phone: order.shipping_address?.phone,
      },
      lineItems: (order.line_items || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination: {
          page,
          limit,
          total: allOrders.length,
          hasMore: startIdx + limit < allOrders.length,
        },
      },
    });
  } catch (error) {
    console.error('[Available Orders] Error:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch available orders',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
