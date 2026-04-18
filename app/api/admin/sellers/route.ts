import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    let where: any = {};

    if (status === 'verified') {
      where.isVerified = true;
    } else if (status === 'pending') {
      where.isVerified = false;
    }

    const sellers = await prisma.seller.findMany({
      where,
      select: {
        id: true,
        companyName: true,
        address: true,
        city: true,
        state: true,
        rating: true,
        totalOrders: true,
        isVerified: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const formattedSellers = sellers.map(seller => ({
      id: seller.id,
      companyName: seller.companyName,
      email: seller.user.email,
      phone: seller.user.phone,
      city: seller.city,
      state: seller.state,
      address: seller.address,
      rating: seller.rating,
      totalOrders: seller.totalOrders,
      isVerified: seller.isVerified,
      createdAt: seller.createdAt,
    }));

    return NextResponse.json({ data: formattedSellers });
  } catch (error) {
    console.error('Error fetching sellers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sellers' },
      { status: 500 }
    );
  }
}
