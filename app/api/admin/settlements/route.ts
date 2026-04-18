import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";

    let where: any = {};

    if (status !== "all") {
      where.status = status;
    }

    const settlements = await prisma.settlement.findMany({
      where,
      select: {
        id: true,
        status: true,
        settledAt: true,
        totalAmount: true,
        createdAt: true,
        driverId: true,
      },
      orderBy: { settledAt: "desc" },
      take: 100,
    });

    const formattedSettlements = settlements.map((settlement) => ({
      id: settlement.id,
      amount: settlement.totalAmount,
      status: settlement.status,
      settlementDate: settlement.settledAt,
      processedDate: settlement?.createdAt,
      reference: settlement.id,
    }));

    return NextResponse.json({ data: formattedSettlements });
  } catch (error) {
    console.error("Error fetching settlements:", error);
    return NextResponse.json(
      { error: "Failed to fetch settlements" },
      { status: 500 },
    );
  }
}
