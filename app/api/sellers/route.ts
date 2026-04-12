import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSellerSchema = z.object({
  userId: z.string(),
  companyName: z.string(),
  businessType: z.string(),
  taxId: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  accountHolder: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const where: any = {};
    if (userId) where.userId = userId;

    const sellers = await prisma.seller.findMany({
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
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip,
    });

    const total = await prisma.seller.count({ where });

    return NextResponse.json({
      data: sellers,
      pagination: {
        total,
        skip,
        limit,
      },
    });
  } catch (error) {
    console.error("Get sellers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createSellerSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: validated.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const seller = await prisma.seller.create({
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

    // Create wallet for seller
    await prisma.wallet.create({
      data: {
        sellerId: seller.id,
      },
    });

    return NextResponse.json(seller, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Create seller error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
