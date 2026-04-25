import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/user/currency
 * Fetch user's preferred currency
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        preferredCurrency: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      preferredCurrency: user.preferredCurrency || "USD",
    });
  } catch (error) {
    console.error("Error fetching user currency:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/user/currency
 * Update user's preferred currency
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, jobId, preferredCurrency } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    if (!preferredCurrency) {
      return NextResponse.json(
        { error: "preferredCurrency is required" },
        { status: 400 },
      );
    }

    // Validate currency is a valid value
    const validCurrencies = [
      "USD",
      "EUR",
      "GBP",
      "INR",
      "AED",
      "PKR",
      "SGD",
      "MYR",
      "THB",
      "IDR",
    ];

    if (!validCurrencies.includes(preferredCurrency)) {
      return NextResponse.json(
        {
          error: `Invalid currency. Supported currencies: ${validCurrencies.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Update user's preferred currency
    const updatedUser = await prisma.$transaction(
      async (tx) => {
        let user = await tx.user.update({
          where: { id: userId },
          data: {
            preferredCurrency: preferredCurrency,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            preferredCurrency: true,
          },
        });

        let where: any = {};
        if (user.role === "SELLER") {
          where.sellerId = jobId;
        } else if (user.role === "BUSINESS") {
          where.businessId = jobId;
        } else {
          where.driverId = jobId;
        }

        await tx.wallet.update({
          where,
          data: {
            currency: preferredCurrency,
          },
        });
      },
      { timeout: 100000 },
    );

    return NextResponse.json(
      {
        success: true,
        message: `Currency updated to ${preferredCurrency}`,
        user: updatedUser,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error updating user currency:", error);

    if (error.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
