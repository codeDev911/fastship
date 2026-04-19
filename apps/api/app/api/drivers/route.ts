import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createDriverSchema = z.object({
  userId: z.string(),
  licenseNumber: z.string(),
  licenseExpiry: z.string(),
  licenseImage: z.string().optional(),
  vehicleType: z.string(),
  vehicleNumber: z.string(),
  vehicleImage: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get("isActive") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const where: any = {};
    if (searchParams.has("isActive")) where.isActive = isActive;
    if (searchParams.has("businessId")) where.businessId = searchParams.get("businessId");

    const drivers = await prisma.driver.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            name: true,
            profileImage: true,
          },
        },
        wallet: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip,
    });

    const total = await prisma.driver.count({ where });

    return NextResponse.json({
      data: drivers,
      pagination: {
        total,
        skip,
        limit,
      },
    });
  } catch (error) {
    console.error("Get drivers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createDriverSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: validated.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if driver already exists for this user
    const existingDriver = await prisma.driver.findUnique({
      where: { userId: validated.userId },
    });

    if (existingDriver) {
      return NextResponse.json(
        { error: "Driver profile already exists for this user" },
        { status: 400 }
      );
    }

    const driver = await prisma.driver.create({
      data: {
        ...validated,
        licenseExpiry: new Date(validated.licenseExpiry),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            name: true,
          },
        },
      },
    });

    // Create wallet for driver
    await prisma.wallet.create({
      data: {
        driverId: driver.id,
      },
    });

    return NextResponse.json(driver, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Create driver error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
