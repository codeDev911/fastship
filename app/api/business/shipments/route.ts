import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get("businessId");
    const driverId = searchParams.get("driverId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const where: any = {};
    if (businessId) where.businessId = businessId;
    if (driverId) where.assignment = { driverId };
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
