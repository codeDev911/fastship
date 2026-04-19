import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    let where: any = {};

    if (status !== 'all') {
      where.status = status;
    }

    const shipments = await prisma.shipment.findMany({
      where,
      select: {
        id: true,
        pickupCity: true,
        deliveryCity: true,
        weight: true,
        status: true,
        paymentMethod: true,
        actualRate: true,
        createdAt: true,
        seller: {
          select: {
            companyName: true,
          },
        },
        assignment: {
          select: {
            business: {
              select: {
                companyName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const formattedShipments = shipments.map(shipment => ({
      id: shipment.id,
      pickupCity: shipment.pickupCity,
      deliveryCity: shipment.deliveryCity,
      weight: shipment.weight,
      status: shipment.status,
      paymentMethod: shipment.paymentMethod,
      actualRate: shipment.actualRate,
      createdAt: shipment.createdAt,
      sellerName: shipment.seller?.companyName,
      businessName: shipment.assignment?.business?.companyName,
    }));

    return NextResponse.json({ data: formattedShipments });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipments' },
      { status: 500 }
    );
  }
}
