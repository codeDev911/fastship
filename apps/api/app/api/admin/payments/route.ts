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

    const payments = await prisma.payment.findMany({
      where,
      select: {
        id: true,
        amount: true,
        paymentStatus: true,
        paymentMethod: true,
        transactionId: true,
        createdAt: true,
        shipmentId:true
       
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      status: payment.paymentStatus,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.id,
      referenceId:payment.shipmentId,
      createdAt: payment.createdAt,
    }));

    return NextResponse.json({ data: formattedPayments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
