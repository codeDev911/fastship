import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createDisputeSchema = z.object({
  shipmentId: z.string(),
  reason: z.string(),
  description: z.string(),
  amount: z.number().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shipmentId, reason, description, amount } = createDisputeSchema.parse(body);

    // Get shipment to verify it exists
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { seller: true, assignment: {
        select:{
            driverId:true
        }
      } },
    });

    if (!shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    // Check if dispute already exists for this shipment
    const existingDispute = await prisma.dispute.findFirst({
      where: {
        shipmentId,
        status: 'OPEN',
      },
    });

    if (existingDispute) {
      return NextResponse.json(
        { error: 'A dispute is already open for this shipment' },
        { status: 400 }
      );
    }

    // Create dispute - we'll determine seller/driver from shipment context
    const dispute = await prisma.dispute.create({
      data: {
        shipmentId,
        sellerId: shipment.sellerId,
        driverId: shipment.assignment?.driverId,
        reason,
        description,
        amount,
        status: 'OPEN',
      },
    });

    return NextResponse.json(
      {
        message: 'Dispute reported successfully',
        dispute: {
          id: dispute.id,
          shipmentId: dispute.shipmentId,
          status: dispute.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating dispute:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create dispute' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const shipmentId = searchParams.get('shipmentId');

    let where: any = {};

    if (status) {
      where.status = status;
    }

    if (shipmentId) {
      where.shipmentId = shipmentId;
    }

    const disputes = await prisma.dispute.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            companyName: true,
          },
        },
        driver: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(
      {
        data: disputes,
        count: disputes.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch disputes' },
      { status: 500 }
    );
  }
}
