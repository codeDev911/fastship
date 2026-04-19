import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
  try {
    const { shipmentId, driverId, businessId } = await request.json();

    if (!shipmentId || !driverId || !businessId) {
      return NextResponse.json(
        { message: 'Shipment ID, Driver ID, and Business ID required' },
        { status: 400 }
      );
    }

    // Verify driver belongs to business
    const driverAssignment = await prisma.driver.findUnique({
      where: {
        id: driverId,
        assignments:{
          every:{
            businessId,
          }
        }
      },
    });

    if (!driverAssignment) {
      return NextResponse.json(
        { message: 'Driver not assigned to this business' },
        { status: 403 }
      );
    }

    // Update shipment
    const shipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        driverId,
        businessId,
        status: 'ASSIGNED',
        assignedAt: new Date(),
      },
    });

    // Create activity log
    await prisma.shipmentActivity.create({
      data: {
        shipmentId,
        driverId,
        status: 'ASSIGNED',
        description: `Order assigned to driver`,
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Order assigned successfully',
      data: shipment,
    });
  } catch (error) {
    console.error('[v0] Assign order error:', error);
    const message = error instanceof Error ? error.message : 'Failed to assign order';
    return NextResponse.json({ message }, { status: 500 });
  }
}
