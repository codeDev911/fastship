import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createRateCardSchema = z.object({
  businessId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  baseRate: z.number().positive(),
  perKmRate: z.number().positive(),
  minimumDistance: z.number().default(0),
  maximumDistance: z.number().default(999999),
  minWeight: z.number().default(0),
  maxWeight: z.number().default(100),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get("businessId");
    const isActive = searchParams.get("isActive") !== "false";
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const where: any = {
      isActive,
    };

    if (businessId) where.businessId = businessId;

    const rateCards = await prisma.rateCard.findMany({
      where,
      include: {
        business: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip,
    });

    const total = await prisma.rateCard.count({ where });

    return NextResponse.json({
      data: rateCards,
      pagination: {
        total,
        skip,
        limit,
      },
    });
  } catch (error) {
    console.error("Get rate cards error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validated = createRateCardSchema.parse(body);

    // Check if business exists
    const business = await prisma.business.findUnique({
      where: { id: validated.businessId },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    const rateCard = await prisma.rateCard.create({
      data: validated,
      include: {
        business: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    return NextResponse.json(rateCard, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Create rate card error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
