import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTransactionSchema = z.object({
  walletId: z.string(),
  type: z.enum(["CREDIT", "DEBIT", "COMMISSION", "SETTLEMENT"]),
  amount: z.number().positive(),
  description: z.string(),
  referenceId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletId = searchParams.get("walletId");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const where: any = {};
    if (walletId) where.walletId = walletId;
    if (type) where.type = type;

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip,
    });

    const total = await prisma.transaction.count({ where });

    return NextResponse.json({
      data: transactions,
      pagination: {
        total,
        skip,
        limit,
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createTransactionSchema.parse(body);

    // Check if wallet exists
    const wallet = await prisma.wallet.findUnique({
      where: { id: validated.walletId },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found" },
        { status: 404 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: validated,
    });

    // Update wallet balance
    const balanceChange =
      validated.type === "CREDIT" || validated.type === "SETTLEMENT"
        ? validated.amount
        : -validated.amount;

    await prisma.wallet.update({
      where: { id: validated.walletId },
      data: {
        balance: {
          increment: balanceChange,
        },
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Create transaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
