import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!driverId) {
      return NextResponse.json(
        { message: 'Driver ID required' },
        { status: 400 }
      );
    }

    const whereClause: any = { driverId };
    if (status) {
      whereClause.status = status;
    }

    const shipments = await prisma.shipment.findMany({
      where: whereClause,
      include: {
        seller: {
          select: {
            userId: true,
            id: true,
          },
        },
        driver: {
          select: {
            id: true,
            vehicleNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.shipment.count({
      where: whereClause,
    });

    return NextResponse.json({
      data: shipments,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[v0] Driver orders error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch orders';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { shipmentId, status, location, notes } = await request.json();

    if (!shipmentId || !status) {
      return NextResponse.json(
        { message: 'Shipment ID and status required' },
        { status: 400 }
      );
    }

    const shipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status,
        ...(location && { currentLocation: location }),
        updatedAt: new Date(),
      },
      include:{
        assignment:{
          select:{
            driverId:true
          }
        }
      }
    });

    // Log activity
    if (shipment.assignment?.driverId) {
      await prisma.shipmentActivity.create({
        data: {
          shipmentId,
          driverId: shipment.assignment.driverId,
          status,
          description: notes || `Status updated to ${status}`,
          createdAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      message: 'Order status updated',
      data: shipment,
    });
  } catch (error) {
    console.error('[v0] Update order status error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update order';
    return NextResponse.json({ message }, { status: 500 });
  }
}
