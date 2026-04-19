import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createShipmentSchema = z.object({
  sellerId: z.string(),
  pickupName: z.string(),
  pickupPhone: z.string(),
  pickupAddress: z.string(),
  pickupCity: z.string(),
  pickupState: z.string(),
  pickupZipCode: z.string(),
  deliveryName: z.string(),
  deliveryPhone: z.string(),
  deliveryAddress: z.string(),
  deliveryCity: z.string(),
  deliveryState: z.string(),
  deliveryZipCode: z.string(),
  weight: z.number(),
  dimensions: z.string().optional(),
  packageType: z.string(),
  description: z.string(),
  paymentMethod: z.enum(["PREPAID", "COD"]),
  codAmount: z.number().optional(),
  priority: z.string().default("STANDARD"),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sellerId = searchParams.get("sellerId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const where: any = {};
    if (sellerId) where.sellerId = sellerId;
    if (status) where.status = status;

    const shipments = await prisma.shipment.findMany({
      where,
      include: {
        assignment: {
          include: {
            driver: true,
          },
        },
        
        payment: true,
        tracking: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip,
    });

    const total = await prisma.shipment.count({ where });

    return NextResponse.json({
      data: shipments,
      pagination: {
        total,
        skip,
        limit,
      },
    });
  } catch (error) {
    console.error("Get shipments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = body
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get("businessId");
    
    // Calculate expected rate based on weight and distance
    const rateCard = await prisma.rateCard.findFirst({
      where: {
        businessId: businessId || undefined, 
        isActive: true,
        minWeight: { lte: validated.weight },
        maxWeight: { gte: validated.weight },
      },
    });

    const expectedRate = rateCard
      ? rateCard.baseRate + validated.weight * 0.1
      : validated.weight * 2;

    const shipment = await prisma.shipment.create({
      data: {
        businessId: businessId || undefined,
        ...validated,
        expectedRate,
        status: "PENDING",
      },
      include: {
        seller: true,
      },
    });

    // Create tracking record
    await prisma.tracking.create({
      data: {
        shipmentId: shipment.id,
        currentStatus: "PENDING",
      },
    });

    return NextResponse.json(shipment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Create shipment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
