import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = (await params).id;

    const driver = await prisma.driver.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        licenseNumber: true,
        licenseExpiry: true,
        licenseImage: true,
        vehicleType: true,
        vehicleNumber: true,
        vehicleImage: true,
        insuranceProvider: true,
        insuranceNumber: true,
        status: true,
        isVerified: true,
        isActive: true,
        rating: true,
        totalDeliveries: true,
        cancelledDeliveries: true,
    totalEarnings: true,
        currentDebt: true,
        currentLocation: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        wallet: {
          select: {
            id: true,
            balance: true,
            escrowBalance: true,
          },
        },
        assignments: {
          select: {
            id: true,
            shipmentId: true,
            shipment: {
              select: {
                id: true,
                status: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        earnings: {
          select: {
            id: true,
            amount: true,
            shipmentId: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: driver });
  } catch (error) {
    console.error('Error fetching driver details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch driver details' },
      { status: 500 }
    );
  }
}
