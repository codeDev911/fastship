import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Currency } from "@prisma/client";
import { toCents } from "@fastship/lib/server";
import currencyService from "@/lib/services/currency.service";

/**
 * Schema for creating a new rate card with updated fields
 */
const createRateCardSchema = z.object({
  businessId: z.string().min(1, "Business ID required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  baseRate: z.number().min(0.0001, "Base rate cannot be negative"),
  perKmRate: z.number().min(0.0001, "Base rate cannot be negative"),
  minimumDistance: z
    .number()
    .nonnegative("Minimum distance cannot be negative")
    .default(0),
  maximumDistance: z
    .number()
    .positive("Maximum distance must be positive")
    .default(999999),
  minWeight: z.number().nonnegative("Min weight cannot be negative").default(0),
  maxWeight: z.number().positive("Max weight must be positive").default(100),
  weightSurcharge: z
    .number()
    .nonnegative("Weight surcharge cannot be negative")
    .default(0),
  serviceStates: z.array(z.string()).default([]),
  inCityDelivery: z.boolean().default(false),
  serviceCities: z.array(z.string()).default([]),
});

/**
 * GET /api/rate-cards
 * Fetch rate cards for a business or all active rate cards
 *
 * Query params:
 * - businessId: Filter by business (optional)
 * - isActive: Only active cards (default: true)
 * - limit: Results per page (default: 50, max: 100)
 * - skip: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get("businessId");
    const isActive = searchParams.get("isActive") !== "false";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const skip = parseInt(searchParams.get("skip") || "0");

    const where: any = { isActive };
    if (businessId) where.businessId = businessId;

    const [total] = await Promise.all([prisma.rateCard.count({ where })]);

    let buss = await prisma.business.findUnique({
      where: { id: businessId || undefined },
      select: {
        user: { select: { preferredCurrency: true } },
      },
    });

    const currencyConversionRate = await currencyService.getExchangeRate(
      "USD",
      buss?.user.preferredCurrency,
    );
    
    const rateCards = await prisma.$queryRaw`
        SELECT
          rc.*,
          b."companyName",
          b.rating,
          rc."baseRate" * ${currencyConversionRate}::numeric AS "displayBaseRate",
          rc."perKmRate" * ${currencyConversionRate}::numeric AS "displayPerKmRate",
          rc."weightSurcharge" * ${currencyConversionRate}::numeric AS "displaySurChargeRate"
        FROM "RateCard" rc
        INNER JOIN "Business" b ON b.id = rc."businessId"
        WHERE rc."businessId" = ${businessId}
          AND rc."isActive" = ${isActive}
        ORDER BY rc."createdAt" DESC
        LIMIT ${Number(limit)}
        OFFSET ${Number(skip)};
      `;

    return NextResponse.json({
      data: {rateCards,
          peferredCurrency:buss?.user.preferredCurrency,

      },
      pagination: {
        total,
        skip,
        limit,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error("[rate-cards GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rate cards" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/rate-cards
 * Create a new rate card for a business
 *
 * Required: businessId, name, baseRate, perKmRate
 * Optional: description, minimumDistance, maximumDistance, minWeight, maxWeight, weightSurcharge, serviceStates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createRateCardSchema.parse(body);

    // Check if business exists
    const business = await prisma.business.findUnique({
      where: { id: validated.businessId },
      select: {
        id: true,
        companyName: true,
        isActive: true,
        user: { select: { preferredCurrency: true } },
      },
    });
    


    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }



    if (!business.isActive) {
      return NextResponse.json(
        { error: "Business is not active" },
        { status: 403 },
      );
    }

    // Validate distance range
    if (validated.minimumDistance >= validated.maximumDistance) {
      console.error("Validation error: Minimum distance must be less than maximum distance");
      return NextResponse.json(
        { error: "Minimum distance must be less than maximum distance" },
        { status: 400 },
      );
    }

    // Validate weight range
    if (validated.minWeight >= validated.maxWeight) {
      console.error("Validation error: Minimum distance must be less than maximum distance");
      return NextResponse.json(
        { error: "Min weight must be less than max weight" },
        { status: 400 },
      );
    }

    // do currency logic

    let rateCard = await prisma.$transaction(
      async (tx) => {
        let { baseRate, perKmRate, weightSurcharge, ...rest }: any = validated;
        const userCurrency = business.user.preferredCurrency;

        if (userCurrency !== Currency.USD) {
          baseRate = await currencyService.toBaseCurrency(
            baseRate,
            userCurrency,
          );
          perKmRate = await currencyService.toBaseCurrency(
            perKmRate,
            userCurrency,
          );
          weightSurcharge = await currencyService.toBaseCurrency(
            weightSurcharge,
            userCurrency,
          );
        }

        return await tx.rateCard.create({
          data: {
            ...rest,
            baseRate_cents: toCents(baseRate),
            perKmRate_cents: toCents(perKmRate),
            weightSurcharge_cents: toCents(weightSurcharge),
            baseRate,
            perKmRate,
            weightSurcharge,
          },
          include: {
            business: {
              select: {
                id: true,
                companyName: true,
                rating: true,
              },
            },
          },
        });
      },
      { timeout: 10000 },
    );

    return NextResponse.json(rateCard, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }
    console.error("[rate-cards POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create rate card" },
      { status: 500 },
    );
  }
}
