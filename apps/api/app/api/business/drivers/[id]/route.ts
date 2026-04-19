import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { message: 'Business ID required' },
        { status: 400 }
      );
    }

    // Delete the assignment
    await prisma.businessDriver.delete({
      where: {
        businessId_driverId: {
          businessId,
          driverId: params.id,
        },
      },
    });

    return NextResponse.json({ message: 'Driver removed from business' });
  } catch (error) {
    console.error('[v0] Remove driver error:', error);
    return NextResponse.json(
      { message: 'Failed to remove driver' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const driverWithStats = await prisma.driver.findUnique({
      where: { id: params.id },
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
    });

    if (!driverWithStats) {
      return NextResponse.json(
        { message: 'Driver not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: driverWithStats.id,
      email: driverWithStats.user?.email,
      name: driverWithStats.user?.name,
      phone: driverWithStats.user?.phone,
      vehicleNumber: driverWithStats.vehicleNumber,
      vehicleType: driverWithStats.vehicleType,
      licenseNumber: driverWithStats.licenseNumber,
      totalDeliveries: driverWithStats.totalDeliveries,
      totalEarnings: driverWithStats.totalEarnings,
      isActive: driverWithStats.isActive,
    });
  } catch (error) {
    console.error('[v0] Get driver stats error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch driver stats' },
      { status: 500 }
    );
  }
}
