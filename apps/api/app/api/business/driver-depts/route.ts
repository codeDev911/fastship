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
            id: true,
          },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ data: [] });
    }

    const shipmentIds = (
      await prisma.shipment.findMany({
      where: { businessId },
      select: { id: true },
      })
    ).map((s) => s.id);

    if (shipmentIds.length === 0) {
      return NextResponse.json({ data: [] });
    }
    
    
    const driverIds = [...new Set(business.drivers.map((d) => d.id))];

    const driverDebts = await prisma.driver.findMany({
      where: {
        OR: [
          {id: { in: driverIds }},
        {
        debts: {
          some: {
          shipmentId: { in: shipmentIds },
          isSettled: false,
          },
        },
        },
        { currentDebt: { not: 0 } },
      ],
      },
      select: {
      id: true,
      currentDebt: true,
      totalDeliveries: true,
      totalEarnings: true,
      user: {
        select: { id: true, name: true, phone: true, email: true },
      },
      debts: {
        where: { shipmentId: { in: shipmentIds } },
      },
      },
    });

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
