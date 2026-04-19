import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get('businessId');
    const sellerId = request.nextUrl.searchParams.get('sellerId');
    const driverId = request.nextUrl.searchParams.get('driverId');
    const period = request.nextUrl.searchParams.get('period') || 'day'; // day, week, month

    // Get shipment stats
    const shipmentStats = await prisma.shipment.groupBy({
      by: ['status'],
      where:
        businessId ? { businessId }
        : sellerId ? { sellerId }
        : driverId ? { driverId }
        : {},
      _count: true,
    });

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayShipments = await prisma.shipment.count({
      where: {
        ...(businessId ? { businessId } : sellerId ? { sellerId } : driverId ? { driverId } : {}),
        createdAt: { gte: today },
      },
    });

    // Get delivered count
    const deliveredCount = await prisma.shipment.count({
      where: {
        ...(businessId ? { businessId } : sellerId ? { sellerId } : driverId ? { driverId } : {}),
        status: 'DELIVERED',
      },
    });

    // Get revenue (for businesses)
    const revenue = businessId
      ? await prisma.transaction.aggregate({
          where: {
            businessId,
            type: 'EARNINGS',
          },
          _sum: { amount: true },
        })
      : null;

    // Get driver earnings
    const earnings = driverId
      ? await prisma.transaction.aggregate({
          where: {
            driverId,
            type: { in: ['DELIVERY_EARNINGS', 'BONUS'] },
          },
          _sum: { amount: true },
        })
      : null;

    return NextResponse.json({
      stats: {
        byStatus: shipmentStats,
        todayCount: todayShipments,
        deliveredCount,
        revenue: revenue?._sum?.amount || 0,
        earnings: earnings?._sum?.amount || 0,
      },
      period,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
