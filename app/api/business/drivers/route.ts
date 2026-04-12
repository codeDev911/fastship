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

    const businessDrivers = await prisma.driver.findMany({
      where: { assignments:{
        every:{
          businessId
        }
      } },
      include: {
        assignments:true,
        user: {
              select: {
                id: true,
                email: true,
                name: true,
                phone: true,
              },
            },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      data: businessDrivers.map((bd) => ({
        id: bd.id,
        driverId: bd.id,
        businessId: bd.assignments.find(a => a.businessId === businessId)?.businessId || '',
        email: bd.user?.email,
        name: bd.user?.name,
        phone: bd.user?.phone,
        vehicleNumber: bd.vehicleNumber,
        vehicleType: bd.vehicleType,
        totalDeliveries: bd.totalDeliveries,
        totalEarnings: bd.totalEarnings,
        addedAt: bd.createdAt.toISOString(),
      })),
      total: businessDrivers.length,
    });
  } catch (error) {
    console.error('[v0] Get business drivers error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch drivers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { businessId, driverId } = await request.json();

    if (!businessId || !driverId) {
      return NextResponse.json(
        { message: 'Business ID and Driver ID required' },
        { status: 400 }
      );
    }

    // Check if driver exists
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      return NextResponse.json(
        { message: 'Driver not found' },
        { status: 404 }
      );
    }

    // Check if already assigned
    const existing = await prisma.driver.findFirst({
      where: {
        assignments:{
          every:{
            businessId,
            id: driverId
          }
        }
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: 'Driver already assigned to this business' },
        { status: 409 }
      );
    }

    // Create assignment
    const assignment = await prisma.business.update({
      where:{
        id: businessId
      },
      data:{
       drivers:{
        set:[
          ...(existing?.assignments.map(a => a.id) || []),
          driverId
        ]
       }
          
      }
    })

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error('[v0] Add driver error:', error);
    const message = error instanceof Error ? error.message : 'Failed to add driver';
    return NextResponse.json({ message }, { status: 500 });
  }
}
