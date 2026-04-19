import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { message: 'Business ID required' },
        { status: 400 }
      );
    }

    // Get shipments stats
    const totalShipments = await prisma.shipment.count({
      where: { businessId },
    });

    const pendingShipments = await prisma.shipment.count({
      where: { businessId, status: 'PENDING' },
    });

    const inTransit = await prisma.shipment.count({
      where: { businessId, status: 'IN_TRANSIT' },
    });

    const delivered = await prisma.shipment.count({
      where: { businessId, status: 'DELIVERED' },
    });

    // Get revenue stats
    const allTransactions = await prisma.transaction.findMany({
      where: { wallet:{ businessId} },
    });

    const totalRevenue = allTransactions
      .filter((t) => t.type === 'CREDIT')
      .reduce((sum, t) => sum + t.amount, 0);

    // Get active drivers
    const activeDrivers = await prisma.driver.count({
      
    });

    // Get recent shipments for chart data
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentShipments = await prisma.shipment.findMany({
      where: {
        businessId, 
        createdAt: { gte: last7Days },
      },
      select: { createdAt: true, status: true },
    });

    // Group by date for chart
    const chartData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = recentShipments.filter(
        (s) => s.createdAt.toISOString().split('T')[0] === dateStr
      ).length;
      return { date: dateStr, orders: count };
    });

    return NextResponse.json({
      stats: {
        totalShipments,
        pendingShipments,
        inTransit,
        delivered,
        totalRevenue,
        activeDrivers,
      },
      chartData,
    });
  } catch (error) {
    console.error('[v0] Business analytics error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch analytics';
    return NextResponse.json({ message }, { status: 500 });
  }
}
