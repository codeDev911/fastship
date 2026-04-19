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

    const disputes = await prisma.dispute.findMany({
      where,
      select: {
        id: true,
        shipmentId: true,
        status: true,
        amount: true,
        createdAt: true,
        resolvedAt:true,
        description: true,
        reason:true,
        seller: {

          select: {
            companyName: true,
          },
        },
         driver: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
       }
    }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const formattedDisputes = disputes.map(dispute => ({
      id: dispute.id,
      shipmentId: dispute.shipmentId,
      sellerName: dispute.seller?.companyName || 'Unknown',
      driverName: dispute?.driver?.user?.name || 'Unknown',
      reason: dispute.reason,
      status: dispute.status,
      amount: dispute.amount,
      claimedAt: dispute.createdAt,
      description: dispute.description,
    }));

    return NextResponse.json({ data: formattedDisputes });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch disputes' },
      { status: 500 }
    );
  }
}
