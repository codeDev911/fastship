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

export async function POST(request: NextRequest) {
  try {
    // Initialize persistent cache (cleanup expired entries)
    initializePersistentCache();

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
      ...body
    } = rs;

    // Validate required fields
    if (
      !sellerId ||
      !weight ||
      !pickupCity ||
      !pickupState ||
      !deliveryCity ||
      !deliveryState
    ) {
      return NextResponse.json(
        {
          message:
            "Missing required fields: sellerId, weight, pickupCity, pickupState, deliveryCity, deliveryState",
        },
        { status: 400 },
      );
    }

    // Calculate distance and get coordinates
    let distance = inCityDistance;
    let pickupLatitude = null;
    let pickupLongitude = null;
    let deliveryLatitude = null;
    let deliveryLongitude = null;

    if(!isInCityDelivery){
      console.log("Not in city");
      try {
        const distanceResult = await calculateDistanceByCities(
          pickupCity,
          pickupState,
          deliveryCity,
          deliveryState,
        );

        if (distanceResult) {
          distance = distanceResult.distance;
          console.log("[create-order] Distance calculated:", {
            distance: distance.toFixed(2),
            method: distanceResult.method,
          });
        }

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
        // Continue without distance - it's not critical for shipment creation
      }
    }

    // Create shipment with calculated distance and coordinates
    const shipment = await prisma.shipment.create({
      data: {
        ...body,

        weight: parseFloat(weight),
        isInCityDelivery,
        sellerId,
        dimensions,
        paymentMethod,
        description,
        pickupState,
        deliveryState,
        distance, // Save calculated distance
        pickupLatitude,
        pickupLongitude,
        pickupCity,
        deliveryCity,
        deliveryLatitude,
        deliveryLongitude,
        status: "PENDING",
        createdAt: new Date(),
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

    console.log("[create-order] Shipment created:", {
      id: shipment.id,
      distance: shipment.distance,
      route: `${pickupCity}, ${pickupState} → ${deliveryCity}, ${deliveryState}`,
    });

    return NextResponse.json(shipment, { status: 201 });
  } catch (error) {
    console.error("[create-order] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ message }, { status: 500 });
  }
}
