import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

/**
 * Schema for creating a new rate card with updated fields
 */
const createRateCardSchema = z.object({
  businessId: z.string().min(1, "Business ID required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  baseRate: z.number().positive("Base rate must be positive"),
  perKmRate: z.number().positive("Per km rate must be positive"),
  minimumDistance: z.number().nonnegative("Minimum distance cannot be negative").default(0),
  maximumDistance: z.number().positive("Maximum distance must be positive").default(999999),
  minWeight: z.number().nonnegative("Min weight cannot be negative").default(0),
  maxWeight: z.number().positive("Max weight must be positive").default(100),
  weightSurcharge: z.number().nonnegative("Weight surcharge cannot be negative").default(0),
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

    const [rateCards, total] = await Promise.all([
      prisma.rateCard.findMany({
        where,
        include: {
          business: {
            select: {
              id: true,
              companyName: true,
              rating: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.rateCard.count({ where }),
    ]);
    

    return NextResponse.json({
      data: rateCards,
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
      { status: 500 }
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
      select: { id: true, companyName: true, isActive: true },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    if (!business.isActive) {
      return NextResponse.json(
        { error: "Business is not active" },
        { status: 403 }
      );
    }

    // Validate distance range
    if (validated.minimumDistance >= validated.maximumDistance) {
      return NextResponse.json(
        { error: "Minimum distance must be less than maximum distance" },
        { status: 400 }
      );
    }

    // Validate weight range
    if (validated.minWeight >= validated.maxWeight) {
      return NextResponse.json(
        { error: "Min weight must be less than max weight" },
        { status: 400 }
      );
    }

    const rateCard = await prisma.rateCard.create({
      data: validated,
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

    return NextResponse.json(rateCard, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[rate-cards POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create rate card" },
      { status: 500 }
    );
  }
}  