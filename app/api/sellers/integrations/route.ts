import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');

    if (!sellerId) {
      return NextResponse.json(
        { message: 'Seller ID required' },
        { status: 400 }
      );
    }

    // Mock integrations data - in real system would fetch from database
    const integrations = [
      {
        id: 'stripe',
        name: 'Stripe',
        type: 'payment',
        status: 'connected',
        description: 'Online payment processing',
        connectedAt: new Date('2024-01-15'),
        icon: '💳',
      },
      {
        id: 'bank',
        name: 'Bank Account',
        type: 'payment',
        status: 'connected',
        description: 'Direct bank transfer',
        connectedAt: new Date('2024-01-10'),
        icon: '🏦',
      },
      {
        id: 'easypaisa',
        name: 'EasyPaisa',
        type: 'payment',
        status: 'disconnected',
        description: 'Mobile wallet payment',
        connectedAt: null,
        icon: '📱',
      },
      {
        id: 'shopify',
        name: 'Shopify',
        type: 'platform',
        status: 'disconnected',
        description: 'E-commerce integration',
        connectedAt: null,
        icon: '🛍️',
      },
    ];

    return NextResponse.json({
      data: integrations,
      total: integrations.length,
    });
  } catch (error) {
    console.error('[v0] Integrations error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}
