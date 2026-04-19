import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calculateDistanceByCities,
  initializePersistentCache,
} from "@/lib/utils/distance";

/**
 * Helper function to get city coordinates from cities.json
 */
async function getCityCoordinates(city: string, state: string) {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/locations/cities?state=${encodeURIComponent(state)}`,
    );
    const data = await response.json();
    const foundCity = data.cities?.find(
      (c: any) => c.name.toLowerCase() === city.toLowerCase(),
    );
    if (foundCity) {
      return {
        latitude: foundCity.latitude,
        longitude: foundCity.longitude,
      };
    }
  } catch (error) {
    console.error("Error fetching city coordinates:", error);
  }
  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { shipmentId: string } }
) {
  try {
    // Initialize persistent cache (cleanup expired entries)
    initializePersistentCache();

    const shipmentId  = (await params).shipmentId;

    if (!shipmentId) {
      return NextResponse.json(
        { message: "Shipment ID is required" },
        { status: 400 }
      );
    }

    // Fetch existing shipment
    const existingShipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!existingShipment) {
      return NextResponse.json(
        { message: "Shipment not found" },
        { status: 404 }
      );
    }

    // Check if shipment is in PENDING or ASSIGNED status
    if (
      existingShipment.status !== "PENDING" &&
      existingShipment.status !== "ASSIGNED"
    ) {
      return NextResponse.json(
        {
          message: `Cannot edit shipment in ${existingShipment.status} status. Only PENDING and ASSIGNED orders can be edited.`,
        },
        { status: 400 }
      );
    }

    const rs = await request.json();

    const {
      sellerId,
      weight,
      dimensions,
      paymentMethod,
      description,
      pickupCity,
      pickupState,
      deliveryCity,
      deliveryState,
      inCityDistance,
      isInCityDelivery,
      pickupLatitude: providedPickupLat,
      pickupLongitude: providedPickupLon,
      deliveryLatitude: providedDeliveryLat,
      deliveryLongitude: providedDeliveryLon,
      ...body
    } = rs;

    // Validate required fields
    if (
      !weight ||
      !pickupCity ||
      !pickupState ||
      !deliveryCity ||
      !deliveryState
    ) {
      return NextResponse.json(
        {
          message:
            "Missing required fields: weight, pickupCity, pickupState, deliveryCity, deliveryState",
        },
        { status: 400 }
      );
    }

    // Calculate distance and get coordinates
    let distance = inCityDistance;
    let pickupLatitude = providedPickupLat || null;
    let pickupLongitude = providedPickupLon || null;
    let deliveryLatitude = providedDeliveryLat || null;
    let deliveryLongitude = providedDeliveryLon || null;

    // Validate in-city delivery data if enabled
    if (isInCityDelivery) {
      if (
        providedPickupLat === undefined ||
        providedPickupLon === undefined ||
        providedDeliveryLat === undefined ||
        providedDeliveryLon === undefined ||
        inCityDistance === undefined
      ) {
        return NextResponse.json(
          {
            message:
              "In-city delivery requires pickupLatitude, pickupLongitude, deliveryLatitude, deliveryLongitude, and inCityDistance",
          },
          { status: 400 }
        );
      }
    }

    if (!isInCityDelivery) {
      try {
        console.log("Calculating distance for city-to-city delivery");
        // Calculate distance for city-to-city delivery
        const result = await calculateDistanceByCities(
          pickupCity,
          pickupState,
          deliveryCity,
          deliveryState,
        );
        distance = result.distance;

        // Get pickup coordinates
        const pickupCoords = await getCityCoordinates(pickupCity, pickupState);
        if (pickupCoords) {
          pickupLatitude = pickupCoords.latitude;
          pickupLongitude = pickupCoords.longitude;
        }

        // Get delivery coordinates
        const deliveryCoords = await getCityCoordinates(
          deliveryCity,
          deliveryState,
        );
        if (deliveryCoords) {
          deliveryLatitude = deliveryCoords.latitude;
          deliveryLongitude = deliveryCoords.longitude;
        }
      } catch (error) {
        console.error("Error calculating distance:", error);
        // Continue without distance - it's not critical for shipment update
      }
    }

    // Update shipment with new data
    const updatedShipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        ...body,
        weight: parseFloat(weight),
        dimensions,
        paymentMethod,
        description,
        pickupState,
        deliveryState,
        distance, // Update distance
        pickupLatitude,
        pickupLongitude,
        pickupCity,
        deliveryCity,
        deliveryLatitude,
        deliveryLongitude,
        isInCityDelivery,
        updatedAt: new Date(),
      },
      include: {
        seller: {
          select: {
            wallet: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    console.log("[update-order] Shipment updated:", {
      id: updatedShipment.id,
      distance: updatedShipment.distance,
      route: `${pickupCity}, ${pickupState} → ${deliveryCity}, ${deliveryState}`,
    });

    return NextResponse.json(updatedShipment, { status: 200 });
  } catch (error) {
    console.error("[update-order] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update order";
    return NextResponse.json({ message }, { status: 500 });
  }
}

/**
 * GET endpoint to fetch a shipment for editing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { shipmentId: string } }
) {
  try {
    const shipmentId  = (await params).shipmentId;

    if (!shipmentId) {
      return NextResponse.json(
        { message: "Shipment ID is required" },
        { status: 400 }
      );
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      return NextResponse.json(
        { message: "Shipment not found" },
        { status: 404 }
      );
    }

    // Check if shipment is in PENDING or ASSIGNED status
    if (
      shipment.status !== "PENDING" &&
      shipment.status !== "ASSIGNED"
    ) {
      return NextResponse.json(
        {
          message: `Cannot edit shipment in ${shipment.status} status. Only PENDING and ASSIGNED orders can be edited.`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(shipment, { status: 200 });
  } catch (error) {
    console.error("[fetch-shipment] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch shipment";
    return NextResponse.json({ message }, { status: 500 });
  }
}
