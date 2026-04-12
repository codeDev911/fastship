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
      const businessCommission = Number(shipment?.actualRate) * 0.2; // cuts 20% , 10% get business and 10% our platform
      const debtAmount =
        Number(shipment.codAmount) + Number(businessCommission);
      // create codDebt for driver
      await financialService.addCODDebt(
        shipment.assignment?.driver?.id || "",
        debtAmount || 0,
        shipment.id,
      );

      // release escrow of seller
      await financialService.releaseEscrow(
        shipment?.seller?.wallet?.id,
        Number(shipment.actualRate),
        "Escrow locked released",
      );
    }

    // cut the escrow if payment method is not COD, and release the fund to the business and driver
    if (shipment.paymentMethod === "PREPAID") {
      await financialService.processShipmentTransactions(shipment);
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
        payment: {
          select: {
            id: true,
          },
        },
        actualRate: true,
        businessId: true,
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

    // unload escrow for seller
    await financialService.releaseEscrow(
      updated?.seller?.wallet?.id,
      updated.actualRate || 0,
      "Shipping fee released due to failed delivery",
    );

    const businessWallet = await prisma.wallet.findUnique({
      where: {
        id: updated.businessId || "",
      },
      select: {
        id: true,
      },
    });

    // cut 10% from locked escrow (business)
    await financialService.cutEscrow(
      businessWallet?.id,
      Number(updated.actualRate) * 0.1,
      "Escrow Cut 10% platform fee",
    );

    await prisma.shipmentActivity.create({
      data: {
        shipmentId,
        status: "FAILED",
        description: `Delivery failed: ${reason}`,
      },
    });

    if (updated.paymentMethod === "COD") {
      // update payment
      await prisma.payment.update({
        where: {
          id: updated.payment?.id,
        },
        data: {
          paymentStatus: "FAILED",
        },
      });
    }

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

  async cancelShipment(
    shipmentId: string,
    reason: string,
    canceledBy?: "driver" | "business" | "seller",
  ) {
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        payment:{
          select:{
            id:true
          }
        },
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

    const businessWallet = await prisma.wallet.findUnique({
      where: {
        businessId: shipment?.businessId || "",
      },
      select: {
        id: true,
      },
    });
    // release the escrow of seller if they canceled in Pending or Assigned phase
    if (
      canceledBy == "seller" &&
      ["PENDING", "ASSIGNED"].includes(shipment.status)
    ) {
      await financialService.releaseEscrow(
        shipment.seller.wallet?.id,
        shipment.actualRate,
        "Shipment canceled by Seller",
      ); // release full escrow of the seller
      await financialService.releaseEscrow(
        businessWallet?.id,
        Number(shipment.actualRate) * 0.1,
        "Shipment canceled by Seller",
      ); // release that 10% escrow of the business
    } else if (
      canceledBy == "seller" &&
      !["PENDING", "ASSIGNED"].includes(shipment.status)
    ) {
      await financialService.processShipmentTransactions(shipment);
    } else {
      await financialService.releaseEscrow(
        shipment.seller.wallet?.id,
        shipment.actualRate,
        "Shipment canceled by Seller",
      ); // release full escrow of the seller
      await financialService.cutEscrow(
        businessWallet?.id,
        Number(shipment.actualRate) * 0.1,
        "10% platform commission ",
      ); // cut escrow from business
    }

    if(shipment.paymentMethod==="COD"){
      // update payment
    await prisma.payment.update({
      where:{
        id:shipment.payment?.id
      },
      data:{
        paymentStatus:"FAILED"
      }
    })

    }

    return updated;
  },

  async returnShipment(shipmentId: string, reason: string) {
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        payment: true,
        seller: {
          include: {
            wallet: {
              select: {
                id: true,
              },
            },
          },
        },
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

    if (["DELIVERED", "FAILED", "CANCELLED"].includes(shipment.status)) {
      throw new Error("Cannot cancel shipment in current status");
    }

    const updated = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: "RETURNED",
      },
      include:{
        payment:{
          select:{
            id:true
          }
        }
      }
    });

    await prisma.shipmentActivity.create({
      data: {
        shipmentId,
        status: "RETURNED",
        description: `Returned: ${reason}`,
      },
    });

    if (shipment.paymentMethod === "COD") {
      const businessCommission = Number(shipment?.actualRate) * 0.2; // cuts 20% , 10% get business and 10% our platform
      const debtAmount =
        Number(shipment.codAmount) + Number(businessCommission);
      // create codDebt for driver
      await financialService.addCODDebt(
        shipment.assignment?.driver?.id || "",
        debtAmount || 0,
        shipment.id,
      );
      // release escrow of seller
      await financialService.releaseEscrow(
        shipment?.seller?.wallet?.id,
        Number(shipment.actualRate),
        "Escrow locked released",
      );
      // update payment
    await prisma.payment.update({
      where:{
        id:updated.payment?.id
      },
      data:{
        paymentStatus:"FAILED"
      }
    })

    } else {
      await financialService.processShipmentTransactions(shipment);
    }
    return updated;
  },
};
