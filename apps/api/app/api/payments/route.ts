import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Currency } from "@prisma/client";
import currencyService from "@/lib/services/currency.service";

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get("businessId") || "";
    const sellerId = request.nextUrl.searchParams.get("sellerId") || "";
    const limit = request.nextUrl.searchParams.get("limit") || 50;

    if (!businessId && !sellerId) {
      return NextResponse.json({ error: "Ids reqiured" }, { status: 400 });
    }

    let select: any = {};

    if (sellerId) {
      select = {
     
        shipment: {
          select: {
            seller: {
              select: {
                user: {
                  select: {
                    preferredCurrency: true,
                  },
                },
              },
            },
          },
        },
      };
    } else if (businessId) {
      select = {
    
        shipment: {
          select: {
            business: {
              select: {
                user: {
                  select: {
                    preferredCurrency: true,
                  },
                },
              },
            },
          },
        },
      };
    }

    let payments = await prisma.payment.findMany({
      where: {
        shipment: {
          OR: [{ sellerId }, { businessId }],
        },
      },
      select:{
        ...select,
        paymentStatus: true,
        paymentMethod: true,
        shipmentId:true,
        amount: true,
        id: true,
        createdAt:true,
      },
      take: Number(limit),
      orderBy: {
        createdAt: "desc",
      },
    });




    let completedAmountBase = payments
      .filter((p) => p.paymentStatus === "COMPLETED")
      .reduce((sum, current) => sum + Number(current.amount), 0);

    // 2. Calculate sum of pending payments
    let pendingAmountBase = payments
      .filter((p) => p.paymentStatus === "PENDING")
      .reduce((sum, current) => sum + Number(current.amount), 0);

    let totalPaymentsBase = payments.reduce(
      (sum, current) => sum + Number(current.amount),
      0,
    );

    let pendingAmount = pendingAmountBase ;
    let totalPayments =  totalPaymentsBase;
    let completedAmount =  completedAmountBase;

    const currency = businessId ? payments[0]?.shipment?.business?.user?.preferredCurrency : payments[0]?.shipment?.seller?.user?.preferredCurrency

    const currencyExchangeRate  = await currencyService.getExchangeRate("USD", currency) || 1

    // convert to user preferred currency if not in USD (Assuming amounts are stored in USD in the database) 
    if(businessId && currency !== Currency.USD){
      payments = payments.map((payment)=>{ 
        const convertedAmount  :number = Number(payment.amount) * currencyExchangeRate
        return {
          ...payment,
          amount: convertedAmount,
        }
      })
      completedAmount = await currencyService.convert(completedAmount,"USD",currency) || completedAmount
      pendingAmount = await currencyService.convert(pendingAmount,"USD",currency) || pendingAmount
      totalPayments = await currencyService.convert(totalPayments,"USD",currency) || totalPayments
    }else if(sellerId && currency !== Currency.USD){
      payments = payments.map((payment)=>{ 
          const convertedAmount  :number = Number(payment.amount) * currencyExchangeRate
            return {
          ...payment,
          amount: Math.round(convertedAmount * 100) / 100, // rounding to 2 decimal places
        }
      })
      
      completedAmount = await currencyService.convert(completedAmount,"USD",currency) || completedAmount
      pendingAmount = await currencyService.convert(pendingAmount,"USD",currency) || pendingAmount
      totalPayments = await currencyService.convert(totalPayments,"USD",currency) || totalPayments
    }

    // Currency exchange end

    // 3. Calculate the ratio (Handling edge case to avoid division by zero)
    const amountRatio =
      completedAmount > 0 ? completedAmount / totalPayments : 0;
 
    return NextResponse.json(
      {
        payments: payments,
        stats: {
          pendingAmount,
          pendingAmountBase,
          amountRatio: amountRatio?.toFixed(2) || 0,
          totalPayments,
          totalPaymentsBase,
          completedAmount,
          completedAmountBase,
          peferredCurrency:currency
        },
      },
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

export async function PATCH(req: NextRequest) {
  try {
    const { paymentId, status, paidAt } = await req.json();

    await prisma.payment.update({
      where: {
        id: paymentId,
      },
      data: {
        paidAt,
        paymentStatus: status.toUpperCase(),
      },
    });

    return NextResponse.json(
      { success: true, message: "Payment status updated!" },
      { status: 201 },
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
