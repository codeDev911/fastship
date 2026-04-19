import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const assignDriverSchema = z.object({
  shipmentId: z.string(),
  driverId: z.string(),
  businessId: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const driverId = searchParams.get("driverId");
    const businessId = searchParams.get("businessId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const where: any = {};
    if (driverId) where.driverId = driverId;
    if (businessId) where.businessId = businessId;

    const assignments = await prisma.driverAssignment.findMany({
      where,
      include: {
        shipment: true,
        driver: true,
        business: true,
      },
      orderBy: {
        assignedAt: "desc",
      },
      take: limit,
      skip,
    });

    const total = await prisma.driverAssignment.count({ where });

    return NextResponse.json({
      data: assignments,
      pagination: {
        total,
        skip,
        limit,
      },
    });
  } catch (error) {
    console.error("Get assignments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = assignDriverSchema.parse(body);

    // Check if shipment exists and is PENDING
    const shipment = await prisma.shipment.findUnique({
      where: { id: validated.shipmentId },
    });

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    if (shipment.status !== "PENDING") {
      return NextResponse.json(
        { error: "Shipment is not available for assignment" },
        { status: 400 }
      );
    }

    // Check if driver exists and is active
    const driver = await prisma.driver.findUnique({
      where: { id: validated.driverId },
    });

    if (!driver || !driver.isActive) {
      return NextResponse.json(
        { error: "Driver not found or is inactive" },
        { status: 404 }
      );
    }

    // Create assignment
    const assignment = await prisma.driverAssignment.create({
      data: validated,
      include: {
        shipment: true,
        driver: true,
        business: true,
      },
    });

    // Update shipment status
    await prisma.shipment.update({
      where: { id: validated.shipmentId },
      data: {
        status: "ASSIGNED",
      },
    });

    // Create activity log
    await prisma.shipmentActivity.create({
      data: {
        shipmentId: validated.shipmentId,
        status: "ASSIGNED",
        description: `Driver ${driver.id} assigned to shipment`,
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Create assignment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
