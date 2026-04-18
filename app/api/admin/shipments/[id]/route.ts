import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = (await params).id;

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      select: {
        id: true,
        sellerId: true,
        businessId: true,
        pickupName: true,
        pickupPhone: true,
        pickupAddress: true,
        pickupCity: true,
        pickupState: true,
        pickupZipCode: true,
        pickupLatitude: true,
        pickupLongitude: true,
        deliveryName: true,
        deliveryPhone: true,
        deliveryAddress: true,
        deliveryCity: true,
        deliveryState: true,
        deliveryZipCode: true,
        deliveryLatitude: true,
        deliveryLongitude: true,
        weight: true,
        distance: true,
        dimensions: true,
        packageType: true,
        isInCityDelivery: true,
        description: true,
        paymentMethod: true,
        codAmount: true,
        expectedRate: true,
        actualRate: true,
        status: true,
        priority: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        pickedUpAt: true,
        deliveredAt: true,
        seller: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        assignment: {
          select: {
            id: true,
            driverId: true,
            businessId: true,
            assignedAt: true,
            pickupCompletedAt: true,
            deliveryCompletedAt: true,
            assignmentStatus: true,
            notes: true,
            driver: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                    phone: true,
                  },
                },
                vehicleType: true,
                vehicleNumber: true,
              },
            },
            business: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            tax: true,
            commission: true,
            driverPayable: true,
            paymentMethod: true,
            paymentStatus: true,
            paidAt: true,
            createdAt: true,
          },
        },
        tracking: {
          select: {
            id: true,
            currentStatus: true,
            currentLocation: true,
            latitude: true,
            longitude: true,
            estimatedDelivery: true,
            actualDelivery: true,
          },
        },
        activities: {
          select: {
            id: true,
            status: true,
            description: true,
            location: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!shipment) {
        console.log("no shipment");
        
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    // Get disputes for this shipment
    const disputes = await prisma.dispute.findMany({
      where: { shipmentId: id },
      select: {
        id: true,
        reason: true,
        status: true,
        amount: true,
        description: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ 
      data: {
        ...shipment,
        disputes,
      },
    });
  } catch (error) {
    console.error('Error fetching shipment details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipment details' },
      { status: 500 }
    );
  }
}
