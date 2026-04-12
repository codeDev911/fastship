import { prisma } from "@/lib/prisma";
import { ShipmentStatus, PaymentMethod } from "@prisma/client";
import { financialService } from "./financial.service";

export const shipmentService = {
  async getShipmentsByStatus(status: ShipmentStatus, limit = 50, skip = 0) {
    return prisma.shipment.findMany({
      where: { status },
      include: {
        seller: true,
        assignment: {
          include: {
            driver: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip,
    });
  },

  async getShipmentsByBusiness(businessId: string, limit = 50, skip = 0) {
    return prisma.shipment.findMany({
      where: { businessId },
      include: {
        seller: true,
        assignment: {
          include: {
            driver: true,
          },
        },
        payment: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip,
    });
  },

  async getShipmentsBySeller(sellerId: string, limit = 50, skip = 0) {
    return prisma.shipment.findMany({
      where: { sellerId },
      include: {
        assignment: {
          include: {
            driver: true,
          },
        },
        payment: true,
        tracking: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip,
    });
  },

  async calculateShipmentRate(weight: number, distance: number = 10) {
    // Base calculation: 2 per kg + 0.5 per km
    const baseRate = weight * 2;
    const distanceCharge = distance * 0.5;
    const tax = (baseRate + distanceCharge) * 0.1; // 10% tax
    const total = baseRate + distanceCharge + tax;

    return {
      baseRate: Math.round(baseRate),
      distanceCharge: Math.round(distanceCharge),
      tax: Math.round(tax),
      total: Math.round(total),
    };
  },

  async processPickup(shipmentId: string) {
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        assignment: {
          include: {
            driver: true,
          },
        },
      },
    });

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    if (shipment.status !== "ASSIGNED") {
      throw new Error("Shipment must be assigned before pickup");
    }

    const updated = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: "PICKED_UP",
        pickedUpAt: new Date(),
      },
    });

    await prisma.shipmentActivity.create({
      data: {
        shipmentId,
        status: "PICKED_UP",
        description: "Package picked up by driver",
      },
    });

    
    await financialService.processPayment(
      shipmentId,
      shipment.codAmount || shipment.actualRate || shipment.expectedRate || 0,
      shipment.paymentMethod as PaymentMethod,
    );


    return updated;
  },

  async processDelivery(
    shipmentId: string,
    location?: string,
    latitude?: number,
    longitude?: number,
  ) {
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },

      include: {
        seller: {
          select: {
            wallet: {
              select: {
                id: true,
                balance: true,
                escrowBalance: true,
              },
            },
          },
        },
        assignment: {
          include: {
            driver: {
              include: {
                wallet: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    if (shipment.status !== "IN_TRANSIT") {
      throw new Error("Shipment must be in transit before delivery");
    }

    const updated = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
      },
    });

    // Update tracking
    await prisma.tracking.update({
      where: { shipmentId },
      data: {
        currentStatus: "DELIVERED",
        currentLocation: location,
        latitude,
        longitude,
        actualDelivery: new Date(),
      },
    });

    // Create activity
    await prisma.shipmentActivity.create({
      data: {
        shipmentId,
        status: "DELIVERED",
        description: "Package delivered successfully",
        location,
        latitude,
        longitude,
      },
    });

    // Process payment based on payment method
    if (shipment.paymentMethod === "COD") {
      // create codDebt for driver
       await financialService.addCODDebt(
        shipment.assignment?.driver?.id || "",
        shipment.codAmount || 0,
        shipment.id,
      );
    }

    // cut the escrow if payment method is not COD, and release the fund to the business and driver
    if (shipment.paymentMethod === "PREPAID") {
      await prisma.$transaction(async (tx) => {
        // cut escrow from sellet wallet
        await tx.wallet.update({
          where: { id: shipment.seller.wallet?.id },
          data: {
            balance: {
              decrement: shipment.actualRate || shipment.expectedRate || 0,
            },
            escrowBalance: {
              decrement: shipment.actualRate || shipment.expectedRate || 0,
            },
          },
        });
        await tx.transaction.create({
          data: {
            walletId: shipment.seller.wallet?.id || "",
            amount: shipment.actualRate || shipment.expectedRate || 0,
            type: "DEBIT",
            description: `${shipment.actualRate || shipment.expectedRate || 0} Escrow cut for shipment ${shipment.id}`,
          },
        });

        // release fund to business wallet
        let businessWallet = await tx.wallet.update({
          where: { businessId: shipment.businessId || "" },
          select: {
            id: true,
          },
          data: {
            balance: {
              increment:
                (shipment.actualRate || shipment.expectedRate || 0) * 0.1, // 10% to business
            },
          },
        });

        await tx.transaction.create({
          data: {
            walletId: businessWallet.id,
            amount: (shipment.actualRate || shipment.expectedRate || 0) * 0.1, // 10% to business
            type: "CREDIT",
            description: `10% Credit to business wallet for shipment ${shipment.id}`,
          },
        });

      });
      await financialService.settleDriverPayment(shipment.assignment?.driverId, (shipment.actualRate || shipment.expectedRate || 0) * 0.8)         
    }

    

    return updated;
  },

  async failDelivery(shipmentId: string, reason: string) {
    const updated = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: "FAILED",
      },
      select: {
        paymentMethod: true,
        actualRate: true,
        seller: {
          select: {
            wallet: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    // unload escrow if payment method is not COD
    if (updated.paymentMethod !== "COD") {
      await financialService.releaseEscrow(
        updated?.seller?.wallet?.id,
        updated.actualRate || 0,
        "Shipping fee released due to failed delivery",
      );
    }

    await prisma.shipmentActivity.create({
      data: {
        shipmentId,
        status: "FAILED",
        description: `Delivery failed: ${reason}`,
      },
    });

    await prisma.transaction.create({
      data: {
        walletId: updated.seller.wallet?.id || "",
        amount: updated.actualRate || updated.actualRate || 0,
        type: "CREDIT",
        description: `Refund for failed delivery of shipment ${shipmentId}`,
      },
    });

    return updated;
  },

  async cancelShipment(shipmentId: string, reason: string) {
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    if (["DELIVERED", "FAILED", "CANCELLED"].includes(shipment.status)) {
      throw new Error("Cannot cancel shipment in current status");
    }

    const updated = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: "CANCELLED",
      },
    });

    await prisma.shipmentActivity.create({
      data: {
        shipmentId,
        status: "CANCELLED",
        description: `Cancelled: ${reason}`,
      },
    });

    return updated;
  },
};
