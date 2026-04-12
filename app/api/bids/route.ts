import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const shipmentId = request.nextUrl.searchParams.get('shipmentId');

    if (!shipmentId) {
      return NextResponse.json(
        { error: 'shipmentId is required' },
        { status: 400 }
      );
    }

    const bids = await prisma.bid.findMany({
      where: { shipmentId },
      include: {
        business: true,
      },  
      orderBy: { amount: 'asc' },
    });

    return NextResponse.json({
      data: bids,
      count: bids.length,
    });
  } catch (error) {
    console.error('Error fetching bids:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bids' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shipmentId, businessId, price, estimatedDays } = body;

    if (!shipmentId || !businessId || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const bid = await prisma.bid.create({
      data: {
        shipmentId,
        businessId,
        price,
        estimatedDays: estimatedDays || 3,
        status: 'PENDING',
      },
      include: {
        business: true,
        shipment: true,
      },
    });

    return NextResponse.json(bid, { status: 201 });
  } catch (error) {
    console.error('Error creating bid:', error);
    return NextResponse.json(
      { error: 'Failed to create bid' },
      { status: 500 }
    );
  }
}
