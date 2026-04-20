import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    let where: any = {};

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const businesses = await prisma.business.findMany({
      where,
      select: {
        id: true,
        companyName: true,
        operatingRegion: true,
        commissionRate: true,
        rating: true,
        isActive: true,
        drivers: true,
        createdAt: true,
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const formattedBusinesses = businesses.map(business => ({
      id: business.id,
      companyName: business.companyName,
      email: business.user.email,
      operatingRegion: business.operatingRegion,
      commissionRate: business.commissionRate,
      rating: business.rating,
      isActive: business.isActive,
      activeDrivers: business?.drivers?.length ||0,
      createdAt: business.createdAt,
    }));

    return NextResponse.json({ data: formattedBusinesses });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 }
    );
  }
}
