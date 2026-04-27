import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import currencyService from "@/lib/services/currency.service";

export async function GET(request: NextRequest) {
  try {
    const sellerId = request.nextUrl.searchParams.get("sellerId");
    const shipmentId = request.nextUrl.searchParams.get("shipmentId");
    const status = request.nextUrl.searchParams.get("status");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");
    const offset = parseInt(request.nextUrl.searchParams.get("offset") || "0");

    if (!sellerId) {
      return NextResponse.json(
        { error: "sellerId is required" },
        { status: 400 },
      );
    }

    const where: any = { sellerId };
    if (status) where.status = status;
    if(shipmentId) where.id = shipmentId;

    let shipments = await prisma.shipment.findMany({
      where,
      include: {
        payment: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            paymentStatus: true,
            commission: true,
            driverPayable: true,
            paidAt: true,
            notes: true,
            tax: true,
            transactionId: true,
            updatedAt: true,
          },
        },
        seller: {
          select: {
            id: true,
            wallet: {
              select: {
                id: true,
                currency: true,
              },
            },
          },
        },
        assignment: {
          include: {
            business: {
              select: {
                id: true,
                companyName: true,
                rating: true,
                isActive: true,
              },
            },
            driver: {
              select: {
                id: true,
                rating: true,
                status: true,
                user: {
                  select: {
                    name: true,
                    phone: true,
                    profileImage: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const userCurrency = shipments[0]?.seller?.wallet?.currency
    
    if (shipments[0].seller.wallet?.currency !== "USD") {
      const exchangeRate = await currencyService.getExchangeRate(
        "USD",
        userCurrency || "USD",
      );
       shipments = shipments.map((shipment) => ({
        ...shipment,
        actualRate: Math.round(Number(shipment.actualRate) * (exchangeRate || 1) * 100) / 100, // rounding to 2 decimal places
      }));
    }

    return NextResponse.json({
      data: shipments,
      total: shipments.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sellerId, destinationCity, weight, amount, paymentMethod } = body;

    if (!sellerId || !destinationCity || !weight || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const shipment = await prisma.shipment.create({
      data: {
        sellerId,
        weight,
        actualRate: amount,
        paymentMethod: paymentMethod || "PREPAID",
        status: "PENDING",
        pickupAddress: body.pickupLocation,
        deliveryName: body.recipientName,
        deliveryPhone: body.recipientPhone,
        description: body.description,
      },
      include: {
        seller: true,
      },
    });

    return NextResponse.json(shipment, { status: 201 });
  } catch (error) {
    console.error("Error creating seller order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}
