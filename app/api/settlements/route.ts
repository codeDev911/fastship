import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSettlementSchema = z.object({
  businessId: z.string(),
  driverId: z.string().optional(),
  periodStart: z.string(),
  periodEnd: z.string(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get("businessId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const where: any = {};
    if (businessId) where.businessId = businessId;
    if (status) where.status = status;

    const settlements = await prisma.settlement.findMany({
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

    const total = await prisma.settlement.count({ where });

    return NextResponse.json({
      data: settlements,
      pagination: {
        total,
        skip,
        limit,
      },
    });
  } catch (error) {
    console.error("Get settlements error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createSettlementSchema.parse(body);

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

    const periodStart = new Date(validated.periodStart);
    const periodEnd = new Date(validated.periodEnd);

    // Calculate total earnings and commission
    const earnings = await prisma.earning.findMany({
      where: {
        earnedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
        isSettled: false,
      },
    });

    const totalAmount = earnings.reduce(
      (sum, earning) => sum + earning.amount,
      0
    );
    const commission = totalAmount * (business.commissionRate / 100);
    const netAmount = totalAmount - commission;

    const settlement = await prisma.settlement.create({
      data: {
        businessId: validated.businessId,
        driverId: validated.driverId,
        periodStart,
        periodEnd,
        totalAmount,
        commission,
        netAmount,
        notes: validated.notes,
      },
      include: {
        business: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    return NextResponse.json(settlement, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Create settlement error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
