import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const type = searchParams.get('type') || 'all'; // all, seller, driver, business

    const where: any = {};
    if (type === 'seller') where.sellerId = { not: null };
    if (type === 'driver') where.driverId = { not: null };
    if (type === 'business') where.businessId = { not: null };

    const [wallets, total] = await Promise.all([
      prisma.wallet.findMany({
        where,
        select: {
          id: true,
          balance: true,
          escrowBalance: true,
          totalEarnings: true,
          totalWithdrawals: true,
          createdAt: true,
          lastUpdated: true,
          seller: {
            select: {
              id: true,
              companyName: true,
              user: { select: { email: true, phone: true } },
            },
          },
          driver: {
            select: {
              id: true,
              user: { select: { name: true, email: true, phone: true } },
              totalDeliveries: true,
            },
          },
          business: {
            select: {
              id: true,
              companyName: true,
              user: { select: { email: true, phone: true } },
            },
          },
        },
        orderBy: { balance: 'desc' },
        skip,
        take: limit,
      }),
      prisma.wallet.count({ where }),
    ]);

    const formattedWallets = wallets.map((wallet) => {
      let name = 'Unknown';
      let entityId = '';
      let entityType = '';

      if (wallet.seller) {
        name = wallet.seller.companyName;
        entityId = wallet.seller.id;
        entityType = 'Seller';
      } else if (wallet.driver) {
        name = wallet.driver.user.name;
        entityId = wallet.driver.id;
        entityType = 'Driver';
      } else if (wallet.business) {
        name = wallet.business.companyName;
        entityId = wallet.business.id;
        entityType = 'Business';
      }

      return {
        id: wallet.id,
        name,
        entityId,
        entityType,
        balance: wallet.balance,
        escrow: wallet.escrowBalance,
        available: wallet.balance - wallet.escrowBalance,
        totalEarnings: wallet.totalEarnings,
        totalWithdrawals: wallet.totalWithdrawals,
        createdAt: wallet.createdAt,
        lastUpdated: wallet.lastUpdated,
      };
    });

    return NextResponse.json({
      data: formattedWallets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching wallets:', error);
    return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 });
  }
}
