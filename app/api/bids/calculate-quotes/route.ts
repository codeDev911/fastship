/**
 * Smart Quote Calculation API
 * GET /api/bids/calculate-quotes?shipmentId=xyz&limit=10
 *
 * Returns intelligent business recommendations with calculated quotes
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bidService } from "@/lib/services/bid.service";
import {
  calculateDistanceByCities,
  estimatePickupTime,
} from "@/lib/utils/distance";

export async function GET(request: NextRequest) {
  try {
    const shipmentId = request.nextUrl.searchParams.get("shipmentId");
    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get("limit") || "10"),
      20
    );

    if (!shipmentId) {
      return NextResponse.json(
        { error: "shipmentId is required" },
        { status: 400 }
      );
    }

    // Fetch shipment details
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    // Calculate distance
    const distance = calculateDistanceByCities(
      shipment.pickupCity,
      shipment.pickupState,
      shipment.deliveryCity,
      shipment.deliveryState
    );

    

    if (!distance) {
      return NextResponse.json(
        {
          error: "Could not calculate distance between cities",
          data: [],
        },
        { status: 400 }
      );
    }

    // Find matching businesses
    const businesses = await bidService.findMatchingBusinesses(
      shipment.weight,
      distance,
      shipment.deliveryCity,
      shipment.deliveryState
    );

    

    if (businesses.length === 0) {
      return NextResponse.json({
        data: [],
        count: 0,
        message: "No businesses available for this shipment",
      });
    }

    // Calculate quotes for each business and sort by quality
    const quotesPromises = businesses.map((business) =>
      bidService.calculateQuote({
        businessId: business.id,
        weight: shipment.weight,
        distance,
        pickupCity: shipment.pickupCity,
        pickupState: shipment.pickupState,
        deliveryCity: shipment.deliveryCity,
        deliveryState: shipment.deliveryState,
      })
    );

    const quotes = await Promise.all(quotesPromises);

    // Filter valid quotes only
    const validQuotes = quotes.filter((q) => q.isValid);

    // Sort by: (1) Has drivers, (2) Rating, (3) Price
    const businessQuotes = validQuotes
      .map((quote) => {
        const business = businesses.find((b) => b.id === quote.businessId)!;
        const serviceArea = business.serviceAreas[0];

        return {
          id: business.id,
          companyName: business.companyName,
          businessType: business.businessType,
          rating: business.rating,
          baseRate: quote.baseRate,
          distanceCharge: quote.distanceCharge,
          weightCharge: quote.weightCharge,
          totalRate: quote.totalRate,
          distance: quote.distanceKm,
          commission: business.commissionRate,
          // Why recommended
          driverCount: serviceArea?.activeDrivers || 0,
          estimatedPickupHours: estimatePickupTime(distance),
          reasonRecommended: getReason(business.rating, quote.totalRate),
          // For database storage
          pickupTime: new Date(Date.now() + estimatePickupTime(distance) * 60 * 60 * 1000),
        };
      })
      .sort((a, b) => {
        // Primary: Has drivers (at least 1)
        const aHasDrivers = a.driverCount > 0 ? 1 : 0;
        const bHasDrivers = b.driverCount > 0 ? 1 : 0;
        if (aHasDrivers !== bHasDrivers) {
          return bHasDrivers - aHasDrivers;
        }

        // Secondary: By rating (higher is better)
        if (Math.abs(a.rating - b.rating) > 0.1) {
          return b.rating - a.rating;
        }

        // Tertiary: By price (lower is better)
        return a.totalRate - b.totalRate;
      })
      .slice(0, limit);

    // Create bids in database for tracking
    const bidPromises = businessQuotes.map((quote) =>
      prisma.bid.upsert({
        where: {
          id: `${shipmentId}-${quote.id}`, // Composite ID pattern
        },
        create: {
          shipmentId,
          businessId: quote.id,
          sellerId: shipment.sellerId,
          amount: quote.totalRate,
          distance: quote.distance,
          estimatedPickupTime: quote.pickupTime,
          description: `${quote.distanceCharge > 0 ? `Distance: ${quote.distance}km × ${quote.baseRate / quote.distance} per km; ` : ""}${quote.weightCharge > 0 ? `Weight surcharge: ${quote.weightCharge} PKR` : ""}`.trim(),
          expiresAt: new Date(Date.now() + 3600000), // 1 hour expiry
        },
        update: {
          amount: quote.totalRate,
          distance: quote.distance,
          estimatedPickupTime: quote.pickupTime,
          updatedAt: new Date(),
        },
      })
    );

    await Promise.all(bidPromises);

    return NextResponse.json({
      data: businessQuotes,
      count: businessQuotes.length,
      shipmentDetails: {
        weight: shipment.weight,
        distance,
        pickupCity: shipment.pickupCity,
        deliveryCity: shipment.deliveryCity,
      },
    });
  } catch (error) {
    console.error("[calculate-quotes] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to calculate quotes",
      },
      { status: 500 }
    );
  }
}

/**
 * Determine why business was recommended
 */
function getReason(rating: number, totalRate: number): string {
  if (rating >= 4.8) return "⭐ Excellent ratings";
  if (totalRate < 1000) return "💰 Best price";
  if (rating >= 4.0) return "👍 Good quality";
  return "Available";
}
