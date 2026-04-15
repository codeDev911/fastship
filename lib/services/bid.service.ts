/**
 * Bid Service - Validates and manages bids
 */

import { prisma } from "@/lib/prisma";
import { calculateDistanceByCities } from "@/lib/utils/distance";

interface BidValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface QuoteCalculationParams {
  businessId: string;
  weight: number;
  distance: number;
  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;
}

interface Quote {
  businessId: string;
  baseRate: number;
  distanceCharge: number;
  weightCharge: number;
  totalRate: number;
  distanceKm: number;
  isValid: boolean;
  reason?: string;
}

export const bidService = {
  /**
   * Calculate a quote for a specific business and shipment
   */
  async calculateQuote(params: QuoteCalculationParams): Promise<Quote> {
    try {
      const { businessId, weight, distance, deliveryCity, deliveryState } =
        params;

      // Fetch business and rate cards
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: {
          rateCards: {
            where: { isActive: true },
            take: 1,
          },
          serviceAreas: {
            where: {
              city: deliveryCity,
              state: deliveryState,
              isActive: true,
            },
          },
        },
      });

      if (!business) {
        return {
          businessId,
          baseRate: 0,
          distanceCharge: 0,
          weightCharge: 0,
          totalRate: 0,
          distanceKm: distance,
          isValid: false,
          reason: "Business not found",
        };
      }

      if (business.rateCards.length === 0) {
        return {
          businessId,
          baseRate: 0,
          distanceCharge: 0,
          weightCharge: 0,
          totalRate: 0,
          distanceKm: distance,
          isValid: false,
          reason: "No active rate cards",
        };
      }

      const rateCard = business.rateCards[0];

      // Validate constraints
      if (weight < rateCard.minWeight || weight > rateCard.maxWeight) {
        return {
          businessId,
          baseRate: 0,
          distanceCharge: 0,
          weightCharge: 0,
          totalRate: 0,
          distanceKm: distance,
          isValid: false,
          reason: `Weight ${weight}kg outside limits (${rateCard.minWeight}-${rateCard.maxWeight}kg)`,
        };
      }

      if (
        distance < rateCard.minimumDistance ||
        distance > rateCard.maximumDistance
      ) {
        return {
          businessId,
          baseRate: 0,
          distanceCharge: 0,
          weightCharge: 0,
          totalRate: 0,
          distanceKm: distance,
          isValid: false,
          reason: `Distance ${distance}km outside limits (${rateCard.minimumDistance}-${rateCard.maximumDistance}km)`,
        };
      }

      // Calculate charges
      const baseRate = rateCard.baseRate;
      const distanceCharge = distance * rateCard.perKmRate;

      // Weight surcharge: only apply if weight exceeds minimum
      const weightCharge =
        weight > rateCard.minWeight
          ? (weight - rateCard.minWeight) * rateCard.weightSurcharge
          : 0;

      const totalRate = baseRate + distanceCharge + weightCharge;

      return {
        businessId,
        baseRate,
        distanceCharge: Math.round(distanceCharge * 100) / 100,
        weightCharge: Math.round(weightCharge * 100) / 100,
        totalRate: Math.round(totalRate * 100) / 100,
        distanceKm: distance,
        isValid: true,
      };
    } catch (error) {
      return {
        businessId: params.businessId,
        baseRate: 0,
        distanceCharge: 0,
        weightCharge: 0,
        totalRate: 0,
        distanceKm: params.distance,
        isValid: false,
        reason: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Find all matching businesses for a shipment
   */
  async findMatchingBusinesses(
    weight: number,
    distance: number,
    deliveryCity: string,
    deliveryState: string
  ) {
    try {
      // Find businesses that meet basic criteria
      
      const businesses = await prisma.business.findMany({
        where: {
          isActive: true,
          rateCards: {
            some: {
              isActive: true,
              minWeight: { lte: weight },
              maxWeight: { gte: weight },
              minimumDistance: { lte: distance },
              maximumDistance: { gte: distance },
            },
          },
          // Service area must exist for delivery city
          serviceAreas: {
            some: {
              city: deliveryCity,
              state: deliveryState,
              isActive: true,
            },
          },
        },
        include: {
          rateCards: {
            where: { isActive: true },
            take: 1,
          },
          serviceAreas: {
            where: {
              city: deliveryCity,
              state: deliveryState,
              isActive: true,
            },
          },
        },
      });
      
      return businesses;
    } catch (error) {
      console.error("Error finding matching businesses:", error);
      return [];
    }
  },

  /**
   * Validate a bid acceptance
   */
  async validateBidAcceptance(
    shipmentId: string,
    bidAmount: number,
    businessId: string
  ): Promise<BidValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check bid exists and valid
      const bid = await prisma.bid.findFirst({
        where: {
          shipmentId,
          businessId,
        },
      });

      if (!bid) {
        errors.push("Bid not found");
        return { isValid: false, errors, warnings };
      }

      if (bid.expiresAt < new Date()) {
        errors.push("Bid has expired");
        return { isValid: false, errors, warnings };
      }

      if (Math.abs(bid.amount - bidAmount) > 0.01) {
        errors.push(
          `Bid amount mismatch: expected ${bid.amount}, got ${bidAmount}`
        );
        return { isValid: false, errors, warnings };
      }

      // Check business is active
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: {
          wallet: true,
          serviceAreas: true,
        },
      });

      if (!business || !business.isActive) {
        errors.push("Business is not active");
        return { isValid: false, errors, warnings };
      }

      // Check shipment exists
      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
        include: {
          seller: { include: { wallet: true } },
        },
      });

      if (!shipment) {
        errors.push("Shipment not found");
        return { isValid: false, errors, warnings };
      }

      // Check seller has sufficient escrow balance
      if (!shipment.seller.wallet) {
        errors.push("Seller wallet not found");
        return { isValid: false, errors, warnings };
      }

      if (shipment.seller.wallet.balance < bidAmount) {
        errors.push(
          `Insufficient seller balance: ${shipment.seller.wallet.balance} < ${bidAmount}`
        );
        return { isValid: false, errors, warnings };
      }

      // Check business has drivers in delivery region
      const hasDriversInRegion =
        business.serviceAreas.length > 0 &&
        business.serviceAreas[0].activeDrivers > 0;

      if (!hasDriversInRegion) {
        warnings.push("Business has limited driver availability in this region");
      }

      return {
        isValid: true,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Unknown error");
      return { isValid: false, errors, warnings };
    }
  },
};
