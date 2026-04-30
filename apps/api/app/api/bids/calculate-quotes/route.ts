/**
 * Smart Quote Calculation API
 * GET /api/bids/calculate-quotes?shipmentId=xyz&limit=10
 *
 * Returns intelligent business recommendations with calculated quotes
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bidService } from "@/lib/services/bid.service";
import { calculateDistanceByCities, estimatePickupTime } from "@/lib/utils/distance";
import currencyService from "@/lib/services/currency.service";

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

    // Use pre-calculated distance from shipment (calculated at shipment creation)
    let distance = shipment.distance;
    let distanceMethod = 'saved';
    let distanceDuration = 0;

    if (!distance) {
      // Fallback if distance wasn't calculated at creation time
      console.warn(`[calculate-quotes] No distance found for shipment ${shipmentId}, defaulting to 0`);
      let ress = await calculateDistanceByCities(shipment.pickupCity,shipment.pickupState,shipment.deliveryCity,shipment.deliveryState)
      distanceMethod = "calculated again"
      distance = ress?.distance || 0;
    }else{
      console.log("used saved distance");
    }
 
      let sellerCurr = await prisma.seller.findUnique({where:{id:shipment.sellerId},select:{wallet:{select:{currency:true}}}})

    // Find matching businesses
    const businesses = await bidService.findMatchingBusinesses(
      shipment.weight,
      distance,
      shipment.deliveryCity,
      shipment.deliveryState,
      shipment.isInCityDelivery,
    );

    if (businesses.length === 0) {
      return NextResponse.json({
        data: [],
        count: 0,
        message: "No businesses available for this shipment",
      });
    }

    // Get all rate cards from all businesses and calculate quotes for each
    const allQuotes: any[] = [];

    const getExchangeRateForSellerCurrency = await currencyService.getExchangeRate('USD',sellerCurr?.wallet?.currency);

    for (const business of businesses) {
      // Get all rate cards for this business
      const rateCards = business.rateCards || [];
      
      for (const rateCard of rateCards) {
        // Calculate quote for each rate card
        const quote = await bidService.calculateQuote({
          businessId: business.id,
          rateCardId: rateCard.id, // Pass specific rate card ID
          weight: shipment.weight,
          distance,
          pickupCity: shipment.pickupCity,
          pickupState: shipment.pickupState,
          deliveryCity: shipment.deliveryCity,
          deliveryState: shipment.deliveryState,
        });

        if (quote.isValid) {
          const serviceArea = business.serviceAreas[0];
          
          // do conversion in user's currency
          if(sellerCurr?.wallet?.currency && sellerCurr.wallet.currency !== 'USD'){
            quote.baseRate = quote.baseRate * getExchangeRateForSellerCurrency;
            quote.distanceCharge = quote.distanceCharge * getExchangeRateForSellerCurrency;
            quote.weightCharge = quote.weightCharge * getExchangeRateForSellerCurrency;
            quote.totalRate = quote.totalRate * getExchangeRateForSellerCurrency;
          }
           

          allQuotes.push({
            id: business.id,
            rateCardId: rateCard.id,
            rateCardName: rateCard.name || 'Standard Service',
            companyName: business.companyName,
            businessType: business.businessType,
            rating: business.rating,
            baseRate: quote.baseRate,
            distanceCharge: quote.distanceCharge,
            weightCharge: quote.weightCharge,
            totalRate: quote.totalRate,
            distance: quote.distanceKm,
            commission: business.commissionRate,
            currencyDisplay: sellerCurr?.wallet?.currency || 'USD',
            // Why recommended
            driverCount: serviceArea?.activeDrivers || 0,
            estimatedPickupHours: estimatePickupTime(distance),
            reasonRecommended: getReason(business.rating, quote.totalRate),
            // For database storage
            pickupTime: new Date(Date.now() + estimatePickupTime(distance) * 60 * 60 * 1000),
          });
        }
      }
    }

    // Sort all quotes by total rate (ascending - lowest price first)
    const sortedQuotes = allQuotes
      .sort((a, b) => {
        // Primary: By rate (lower is better)
        if (a.totalRate !== b.totalRate) {
          return a.totalRate - b.totalRate;
        }

        // Secondary: By rating (higher is better)
        if (Math.abs(a.rating - b.rating) > 0.1) {
          return b.rating - a.rating;
        }

        // Tertiary: Has drivers (at least 1)
        const aHasDrivers = a.driverCount > 0 ? 1 : 0;
        const bHasDrivers = b.driverCount > 0 ? 1 : 0;
        return bHasDrivers - aHasDrivers;
      })
      .slice(0, limit);

    return NextResponse.json({
      data: sortedQuotes,
      count: sortedQuotes.length,
      totalAvailable: allQuotes.length,
      shipmentDetails: {
        weight: shipment.weight,
        distance: distance.toFixed(2),
        duration: Math.round(distanceDuration / 60), // Convert to minutes
        method: distanceMethod,
        isEstimate: distance === 0,
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
