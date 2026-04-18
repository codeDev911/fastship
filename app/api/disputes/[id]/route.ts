import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateDisputeSchema = z.object({
  status: z.enum(['OPEN', 'RESOLVED', 'REJECTED']),
  resolution: z.string().optional(),
  refundAmount: z.number().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, resolution, refundAmount } = updateDisputeSchema.parse(body);

    // Find dispute
    const dispute = await prisma.dispute.findUnique({
      where: { id: (await params).id },
    });

    if (!dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    // Update dispute
    const updatedDispute = await prisma.dispute.update({
      where: { id: (await params).id },
      data: {
        status,
        resolvedAt: status !== 'OPEN' ? new Date() : null,
        updatedAt: new Date(),
      },
      include: {
        seller: true,
        driver: true,
      },
    });

    // If resolved and refund amount specified, handle wallet adjustment
    if (status === 'RESOLVED' && refundAmount && refundAmount > 0) {
      // Award refund to seller
      if (dispute.sellerId) {
        const wallet = await prisma.wallet.findUnique({
          where: { sellerId: dispute.sellerId },
        });

        if (wallet) {
          await prisma.wallet.update({
            where: { id: wallet.id },
            data: {
              balance: { increment: refundAmount },
            },
          });
        }
      }

      // Alternatively, deduct from driver if it's their fault
      if (dispute.driverId && refundAmount > 0) {
        const driverWallet = await prisma.wallet.findUnique({
          where: { driverId: dispute.driverId },
        });

        if (driverWallet) {
          await prisma.wallet.update({
            where: { id: driverWallet.id },
            data: {
              balance: { decrement: Math.min(refundAmount, driverWallet.balance) },
            },
          });
        }
      }
    }

    return NextResponse.json(
      {
        message: 'Dispute updated successfully',
        dispute: {
          id: updatedDispute.id,
          status: updatedDispute.status,
          resolvedAt: updatedDispute.resolvedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating dispute:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update dispute' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dispute = await prisma.dispute.findUnique({
      where: { id: (await params).id },
      include: {
        seller: true,
        driver: true,
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        data: dispute,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching dispute:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dispute' },
      { status: 500 }
    );
  }
}
