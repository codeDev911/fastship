import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // 'id', 'email', 'name', 'vehicle', 'all'
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return NextResponse.json(
        { message: 'Search query required' },
        { status: 400 }
      );
    }

    let whereClause: any = {
      isActive: true,
    };

    // Build search query based on type
    if (type === 'all') {
      whereClause = {
        ...whereClause,
        OR: [
          { user: { email: { contains: query, mode: 'insensitive' } } },
          { user: { name: { contains: query, mode: 'insensitive' } } },
          { user: { id: { contains: query, mode: 'insensitive' } } },
          { vehicleNumber: { contains: query, mode: 'insensitive' } },
        ],
      };
    } else if (type === 'email') {
      whereClause.user = { email: { contains: query, mode: 'insensitive' } };
    } else if (type === 'name') {
      whereClause.user = { name: { contains: query, mode: 'insensitive' } };
    } else if (type === 'id') {
      whereClause.user = { id: { contains: query, mode: 'insensitive' } };
    } else if (type === 'vehicle') {
      whereClause.vehicleNumber = { contains: query, mode: 'insensitive' };
    }

    const drivers = await prisma.driver.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
      },
      take: limit,
    });

    return NextResponse.json({
      data: drivers.map((driver) => ({
        id: driver.id,
        userId: driver.userId,
        email: driver.user?.email,
        name: driver.user?.name,
        phone: driver.user?.phone,
        vehicleNumber: driver.vehicleNumber,
        vehicleType: driver.vehicleType,
        licenseNumber: driver.licenseNumber,
        totalDeliveries: driver.totalDeliveries,
        totalEarnings: driver.totalEarnings,
      })),
      total: drivers.length,
    });
  } catch (error) {
    console.error('[v0] Driver search error:', error);
    const message = error instanceof Error ? error.message : 'Failed to search drivers';
    return NextResponse.json({ message }, { status: 500 });
  }
}
