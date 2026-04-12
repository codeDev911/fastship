import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Fetch all active businesses with their rate cards
    const businesses = await prisma.business.findMany({
      where: { isActive: true },
      include: {
        rateCards: {
          where: { isActive: true, },
          take: 1,
          orderBy: { perKmRate: 'asc' },
        },
      },
      orderBy: { commissionRate: 'asc' },
      take: 20,
    });

    const data = businesses.map((business) => ({
      id: business.id,
      companyName: business.companyName,
      businessType: business.businessType,
      commissionRate: business.commissionRate,
      isActive: business.isActive,
      baseRate: business.rateCards[0]?.baseRate || 0,
    }));

    return NextResponse.json({
      data,
      total: data.length,
    });
  } catch (error) {
    console.error('[v0] Business rates error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch rates';
    return NextResponse.json({ message }, { status: 500 });
  }
}
