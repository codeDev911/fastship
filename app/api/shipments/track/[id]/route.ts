/**
 * API Endpoint: GET /api/shipments/track/[id]
 * Fetches detailed shipment tracking information
 * 
 * Usage:
 * - GET /api/shipments/track/shipment-1
 * 
 * Returns:
 * - 200: Shipment data with tracking information
 * - 404: Shipment not found
 * - 500: Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shipmentId = (await params).id;

    if (!shipmentId) {
      return NextResponse.json(
        { error: 'Shipment ID is required' },
        { status: 400 }
      );
    }

    // Fetch shipment by ID or shipment number with all related data
    const shipment = await prisma.shipment.findFirst({
      where: {
        OR: [
          { id: shipmentId },
        ],
      },
      include: {
        seller: true,
        tracking: true,
        assignment: {
          include: {
            driver: {
              include: {
                user: true,
              },
            },
          },
          
        },
        payment: true,
        activities: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    // Get the latest driver assignment
    const latestAssignment = shipment?.assignment;
    const driver = latestAssignment?.driver;
    const payment = shipment.payment;

    // Transform to match TrackingShipment interface with REAL data
    const trackingData = {
      id: shipment.id,
      shipmentNumber: shipment.id,
      status: shipment.status,
      paymentMethod:shipment.paymentMethod,
      createdAt: shipment.createdAt,
      totalAmount: payment?.amount || 0, // Real amount from Payment table
      deliveryFee: shipment.actualRate || 0, // Real fee from Payment table
      customer: {
        name: shipment.deliveryName,
        email: shipment.deliveryName || '', // No email field on Shipment, using name as fallback
        phone: shipment.deliveryPhone,
        address: shipment.deliveryAddress,
        city: shipment.deliveryCity,
        state: shipment.deliveryState,
        zipCode: shipment.deliveryZipCode,
        coordinates: shipment.tracking?.latitude && shipment.tracking?.longitude ? {
          lat: shipment.tracking.latitude,
          lng: shipment.tracking.longitude,
        } : undefined,
      },
      pickupLocation: {
        name: shipment.seller?.companyName || 'Pickup Location',
        address: shipment.pickupAddress,
        city: shipment.pickupCity,
        state: shipment.pickupState,
        zipCode: shipment.pickupZipCode,
        coordinates: undefined, // No pickup coordinates in Shipment schema - can be added later
      },
      driverId: driver?.id,
      driver: driver ? {
        id: driver.id,
        name: driver.user?.name || 'Unknown Driver',
        phone: driver.user?.phone || '',
        vehicle: {
          type: driver.vehicleType,
          licensePlate: driver.vehicleNumber,
        },
        rating: driver.rating,
        totalDeliveries: driver.totalDeliveries,
        currentLocation: driver.latitude && driver.longitude ? {
          lat: driver.latitude,
          lng: driver.longitude,
          timestamp: shipment.tracking?.updatedAt || new Date(),
        } : undefined,
      } : undefined,
      products: [], // Products are not configured in current schema - can be added as ShipmentItem model later
      estimatedDelivery: shipment.tracking?.estimatedDelivery,
      actualDelivery: shipment.deliveredAt,      activities: shipment.activities?.map(activity => ({
        id: activity.id,
        status: activity.status,
        description: activity.description,
        location: activity.location,
        latitude: activity.latitude,
        longitude: activity.longitude,
        createdAt: activity.createdAt,
      })) || [],    };

    return NextResponse.json({
      shipment: trackingData,
    });
  } catch (error) {
    console.error('Error fetching shipment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipment details' },
      { status: 500 }
    );
  }
}
