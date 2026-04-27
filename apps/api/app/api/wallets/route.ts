import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import currencyService from "@/lib/services/currency.service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId =
      searchParams.get("userId") ||
      searchParams.get("sellerId") ||
      searchParams.get("driverId") ||
      searchParams.get("businessId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }
    let where: any = {};
    if (searchParams.get("sellerId")) {
      where = {
        sellerId: userId,
      };
    } else if (searchParams.get("businessId")) {
      where = {
        businessId: userId,
      };
    } else if (searchParams.get("driverId")) {
      where = {
        driverId: userId,
      };
    }

    const wallet = await prisma.wallet.findUnique({
      where: where,
      include: {
        transactions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const display = {
      balance: await currencyService.convert(wallet.balance||0,"USD",wallet.currency) || wallet.balance,
      escrowBalance: await currencyService.convert(wallet.escrowBalance||0,"USD",wallet.currency) || wallet.escrowBalance,
      currency: wallet.currency || "USD",
      available: await currencyService.convert(wallet.balance-wallet.escrowBalance||0,"USD",wallet.currency) || wallet.balance-wallet.escrowBalance,
    }

    return NextResponse.json({
      data: {...wallet,display},
    });
  } catch (error) {
    console.error("Get wallet error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
