import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createBusinessSchema = z.object({
  userId: z.string(),
  companyName: z.string(),
  businessType: z.string(),
  operatingRegion: z.string(),
  commissionRate: z.number().default(10),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  accountHolder: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    const where: any = {};
    if (userId) where.userId = userId;

    const business = await prisma.business.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            name: true,
          },
        },
        wallet: true,
        drivers: {
          include: {
            driver: true,
          },
        },
        rateCards: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(business);
  } catch (error) {
    console.error("Get business error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createBusinessSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: validated.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const business = await prisma.business.create({
      data: validated,
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

    // Create wallet for business
    await prisma.wallet.create({
      data: {
        businessId: business.id,
      },
    });

    return NextResponse.json(business, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Create business error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
