import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get("businessId") || "";
    const sellerId = request.nextUrl.searchParams.get("sellerId") || "";

    if (!businessId && !sellerId) {
      return NextResponse.json({ error: "Ids reqiured" }, { status: 400 });
    }

    const payments = await prisma.payment.findMany({
      where: {
        shipment: {
          OR: [{ sellerId }, { businessId }],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const completedAmount = payments
      .filter((p) => p.paymentStatus === "COMPLETED")
      .reduce((sum, current) => sum + Number(current.amount), 0);

    // 2. Calculate sum of pending payments
    const pendingAmount = payments
      .filter((p) => p.paymentStatus === "PENDING")
      .reduce((sum, current) => sum + Number(current.amount), 0);

    // 3. Calculate the ratio (Handling edge case to avoid division by zero)
    const amountRatio =
      completedAmount > 0 ? pendingAmount / completedAmount : 0;

    const totalPayments = payments.reduce(
      (sum, current) => sum + Number(current.amount),
      0,
    );

    return NextResponse.json(
      { payments,stats:{ pendingAmount, amountRatio, totalPayments} },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}


export async function PATCH(req:NextRequest){
    try {
        const {paymentId,status,paidAt} = await req.json() 

        await prisma.payment.update({
            where:{
                id:paymentId
            },
            data:{
                paidAt,
                paymentStatus:status.toUpperCase()
            }
        })

        return NextResponse.json({success:true,message:"Payment status updated!"},{status:201})

    } catch (error) {
          return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    );
    }
}