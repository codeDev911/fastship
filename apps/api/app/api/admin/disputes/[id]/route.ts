import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateDisputeSchema = z.object({
  status: z.enum(['OPEN', 'RESOLVED', 'REJECTED']).optional(),
  refundAmount: z.number().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, refundAmount } = updateDisputeSchema.parse(body);

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: params.id },
      include: { seller: true },
    });

    if (!dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    const updatedDispute = await prisma.dispute.update({
      where: { id: params.id },
      data: {
        status,
        resolvedAt: new Date(),
      },
    });

    // Process refund if approved
    if (status === 'RESOLVED' && refundAmount && dispute.sellerId) {
      // Find seller's wallet and credit it
      const wallet = await prisma.wallet.findUnique({
        where: { sellerId: dispute.sellerId },
      });

      if (wallet) {
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: wallet.balance + refundAmount,
          },
        });
      }

      // Create transaction record
      await prisma.payment.create({
        data: {
          sellerId: dispute.sellerId,
          amount: refundAmount,
          status: 'COMPLETED',
          paymentMethod: 'DISPUTE_REFUND',
          transactionId: `dispute-${params.id}`,
        },
      });
    }

    return NextResponse.json({ data: updatedDispute });
  } catch (error) {
    console.error('Error updating dispute:', error);
    return NextResponse.json(
      { error: 'Failed to update dispute' },
      { status: 500 }
    );
  }
}
