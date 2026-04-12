import { NextRequest, NextResponse } from "next/server";
import { shipmentService } from "@/lib/services/shipment.service";
import prisma from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const shipmentId = request.nextUrl.searchParams.get("shipmentId");
    const newStatus = request.nextUrl.searchParams.get("status");
    const canceledBy = request.nextUrl.searchParams.get("canceledBy") || 'business'
    if (!shipmentId) {
      return NextResponse.json(
        { error: "Shipment ID is required" },
        { status: 400 },
      );
    }

    if (newStatus === "PICKED_UP") {
      console.log("yes");
      await shipmentService.processPickup(shipmentId);
      
      console.log("yes");
    } 
    else if (newStatus === "IN_TRANSIT") {
      await prisma.shipment.update({
        where: { id: shipmentId },
        data: {
          status: "IN_TRANSIT",
        },
      });
      await prisma.shipmentActivity.create({
        data: {
          status: "IN_TRANSIT",
          description: "Shipment is in transit",
          shipmentId,
          createdAt: new Date(),
        },
      });
    }
    else if (newStatus === "DELIVERED") {
      await shipmentService.processDelivery(shipmentId, newStatus);
    } else if (newStatus === "CANCELED") {
      await shipmentService.cancelShipment(shipmentId, "Delivery canceled",canceledBy?.toLocaleLowerCase());
    } else if (newStatus === "RETURNED") {
      await shipmentService.returnShipment(shipmentId, "Delivery returned");
    } else if (newStatus === "FAILED") {
      await shipmentService.failDelivery(shipmentId, newStatus);
    } 

    return NextResponse.json({ message: "Shipment updated successfully" });
  } catch (error) {
    console.error("Update shipment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
