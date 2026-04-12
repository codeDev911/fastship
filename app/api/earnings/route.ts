import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createEarningSchema = z.object({
  driverId: z.string(),
  amount: z.number().positive(),
  shipmentId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const driverId = searchParams.get("driverId");
    const isSettled = searchParams.get("isSettled") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const where: any = {};
    if (driverId) where.driverId = driverId;
    if (searchParams.has("isSettled")) where.isSettled = isSettled;

    const earnings = await prisma.earning.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip,
    });

    const total = await prisma.earning.count({ where });

    return NextResponse.json({
      data: earnings,
      pagination: {
        total,
        skip,
        limit,
      },
    });
  } catch (error) {
    console.error("Get earnings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createEarningSchema.parse(body);

    const driver = await prisma.driver.findUnique({
      where: { id: validated.driverId },
    });

    if (!driver) {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      );
    }

    const earning = await prisma.earning.create({
      data: validated,
    });

    // Update driver's total earnings
    await prisma.driver.update({
      where: { id: validated.driverId },
      data: {
        totalEarnings: {
          increment: validated.amount,
        },
        totalDeliveries: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(earning, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Create earning error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
