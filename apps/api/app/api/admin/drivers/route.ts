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

    const drivers = await prisma.driver.findMany({
      where,
      select: {
        id: true,
        licenseNumber: true,
        vehicleType: true,
        status: true,
        rating: true,
        totalDeliveries: true,
        isVerified: true,
        isActive: true,
        latitude: true,
        longitude: true,
        currentLocation: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const formattedDrivers = drivers.map(driver => ({
      id: driver.id,
      name: driver.user.name,
      email: driver.user.email,
      phone: driver.user.phone,
      licenseNumber: driver.licenseNumber,
      vehicleType: driver.vehicleType,
      status: driver.status,
      rating: driver.rating,
      totalDeliveries: driver.totalDeliveries,
      isVerified: driver.isVerified,
      isActive: driver.isActive,
      currentLocation: driver.currentLocation,
      coordinates: {
        lat: driver.latitude,
        lng: driver.longitude,
      },
    }));

    return NextResponse.json({ data: formattedDrivers });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drivers' },
      { status: 500 }
    );
  }
}
