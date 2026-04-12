import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get('businessId');
    const status = request.nextUrl.searchParams.get('status');

    const where: any = {};
    if (businessId) where.businessId = businessId;
    if (status) where.status = status;

    const orders = await prisma.shipment.findMany({
      where: {
        ...where,
        status: { in: ['PENDING', 'ASSIGNED', 'IN_TRANSIT'] },
      },
      include: {
        business: true,
        seller: true,
        driver: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    console.error('Error fetching dispatch orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dispatch orders' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { shipmentId, driverId, strategy } = body;

    if (!shipmentId) {
      return NextResponse.json(
        { error: 'shipmentId is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (driverId) {
      updateData.driverId = driverId;
      updateData.status = 'ASSIGNED';
    }

    if (strategy) {
      updateData.dispatchStrategy = strategy;
    }

    const updated = await prisma.shipment.update({
      where: { id: shipmentId },
      data: updateData,
      include: {
        business: true,
        driver: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating dispatch order:', error);
    return NextResponse.json(
      { error: 'Failed to update dispatch order' },
      { status: 500 }
    );
  }
}
