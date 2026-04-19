import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get all metrics in parallel
    const [
      shipments,
      users,
      drivers,
      sellers,
      businesses,
      approvals,
      disputes,
      payments,
      revenue,
      totalSettlements,
    ] = await Promise.all([
      // Total shipments
      prisma.shipment.count(),
      // Total users
      prisma.user.count(),
      // Active drivers
      prisma.driver.count({ where: { isActive: true } }),
      // Verified sellers
      prisma.seller.count({ where: { isVerified: true } }),
      // Active businesses
      prisma.business.count({ where: { isActive: true } }),
      // Pending approvals
      prisma.approval.count({ where: { status: 'PENDING' } }),
      // Open disputes
      prisma.dispute.count({ where: { status: 'OPEN' } }),
      // Failed payments
      prisma.payment.count({ where: { paymentStatus: 'FAILED' } }),
      // Total revenue (sum of all completed payments)
      prisma.payment.aggregate({
        where: { paymentStatus: 'COMPLETED' },
        _sum: { amount: true },
      }),
      // Pending settlements
      prisma.settlement.count({ where: { status: 'PENDING' } }),
    ]);

    // Get active shipments
    const activeShipments = await prisma.shipment.count({
      where: {
        status: { in: ['ASSIGNED', 'PICKUP', 'PICKED_UP', 'IN_TRANSIT'] },
      },
    });

    // Get delivered today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const deliveredToday = await prisma.shipment.count({
      where: {
        status: 'DELIVERED',
        deliveredAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get failed shipments
    const failedShipments = await prisma.shipment.count({
      where: { status: 'FAILED' },
    });

    // Get recent shipments
    const recentShipments = await prisma.shipment.findMany({
      select: {
        id: true,
        status: true,
        pickupCity: true,
        deliveryCity: true,
        actualRate: true,
        createdAt: true,
        seller: { select: { companyName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Get recent disputes
    const recentDisputes = await prisma.dispute.findMany({
      select: {
        id: true,
        reason: true,
        status: true,
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Get top performers (drivers by deliveries)
    const topDrivers = await prisma.driver.findMany({
      select: {
        id: true,
        user: { select: { name: true } },
        totalDeliveries: true,
        rating: true,
      },
      orderBy: { totalDeliveries: 'desc' },
      take: 5,
    });

    // Get top sellers
    const topSellers = await prisma.seller.findMany({
      select: {
        id: true,
        companyName: true,
        totalOrders: true,
        rating: true,
      },
      orderBy: { totalOrders: 'desc' },
      take: 5,
    });

    // Get pending settlements
    const pendingSettlements = await prisma.settlement.findMany({
      select: {
        id: true,
        business: { select: { companyName: true } },
        totalAmount: true,
        createdAt: true,
      },
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    // Get pending approvals
    const pendingApprovalsList = await prisma.approval.findMany({
      select: {
        id: true,
        approvedAt: true,
        email: true,
        name:true,
        companyName:true,
        
        applicationType: true,
        updatedAt: true,
      },
      where: { status: 'PENDING' },
      orderBy: { updatedAt: 'desc' },
      take: 3,
    });

    const metrics = {
      totalShipments:shipments,
      activeShipments,
      deliveredToday,
      failedShipments,
      totalRevenue: revenue._sum.amount || 0,
      totalUsers: users,
      activeDrivers: drivers,
      verifiedSellers: sellers,
      activeBusinesses: businesses,
      pendingApprovals: approvals,
      openDisputes: disputes,
      failedPayments: payments,
      pendingSettlements: totalSettlements,
      recentShipments,
      recentDisputes,
      topDrivers,
      topSellers,
      pendingSettlementsList: pendingSettlements,
      pendingApprovalsList,
    };

    return NextResponse.json({ data: metrics });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
