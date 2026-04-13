import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { financialService } from "@/lib/services/financial.service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get("businessId");
    if (!businessId) {
      return NextResponse.json(
        { error: "businessId is required" },
        { status: 400 },
      );
    }

    const business = await prisma.business.findUnique({
      where: {
        id: businessId,
      },
      select: {
        drivers: {
          select: {
            driverId: true,
          },
        },
      },
    });

    // get unique driverIds

    const uniqueDriverIds = [
      ...new Set(business?.drivers.map((d) => d.driverId)),
    ];

    const driverDebts = [];

    for (const driver of uniqueDriverIds || []) {
      const debt = await prisma.driver.findMany({
        where: {
          AND: [
            { id: driver.driverId },
            {
              OR:[
                {debts: {
                some: {
                  isSettled: {
                    equals:false
                  },
                },
              },},
              {
                currentDebt:{
                    not:{
                        equals:0
                    }
                }
              }
              ]
            },
          ],
        },
        select: {
          id: true,
          currentDebt: true,
          totalDeliveries: true,
          debts: true,
          totalEarnings: true,
          user: {
            select: {
              name: true,
              id: true,
              phone: true,
              email: true,
            },
          },
        },
      });
      driverDebts.push(...debt);
    }

    return NextResponse.json({ data: driverDebts });
  } catch (error) {
    console.error("Error fetching driver departments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { driverId, amount ,uniqueId} = await request.json();
    if (!driverId || !amount || uniqueId) {
      return NextResponse.json(
        { error: "driverId and amount are required" },
        { status: 400 },
      );
    }

    // Update shipment as settled
    return await prisma.$transaction(async(tx)=>{
      await financialService.settleCODDebt(tx,driverId, Number(amount),uniqueId);
      return NextResponse.json({"success":true,message:"Driver dept settled success!"})
    })
  } catch (error) {
    console.error("Error processing driver debt settlement:", error);
    return NextResponse.json(
      { error: "Failed to process driver debt settlement" },
      { status: 500 },
    );
  }
}
