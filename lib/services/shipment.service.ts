import { prisma } from "@/lib/prisma";
import { ShipmentStatus, PaymentMethod } from "@prisma/client";
import { financialService } from "./financial.service";

const safeNumber = (v: any) => Number(v || 0);

export const shipmentService = {
  // =========================
  // READ ONLY
  // =========================
  async getShipmentsByStatus(status: ShipmentStatus, limit = 50, skip = 0) {
    return prisma.shipment.findMany({
      where: { status },
      include: {
        seller: true,
        assignment: { include: { driver: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    });
  },

  async getShipmentsByBusiness(businessId: string, limit = 50, skip = 0) {
    return prisma.shipment.findMany({
      where: { businessId },
      include: {
        seller: true,
        assignment: { include: { driver: true } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    });
  },

  async getShipmentsBySeller(sellerId: string, limit = 50, skip = 0) {
    return prisma.shipment.findMany({
      where: { sellerId },
      include: {
        assignment: { include: { driver: true } },
        payment: true,
        tracking: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    });
  },

  // =========================
  // RATE CALCULATION
  // =========================
  async calculateShipmentRate(weight: number, distance: number = 10) {
    const baseRate = weight * 2;
    const distanceCharge = distance * 0.5;
    const tax = (baseRate + distanceCharge) * 0.1;

    return {
      baseRate: Math.round(baseRate),
      distanceCharge: Math.round(distanceCharge),
      tax: Math.round(tax),
      total: Math.round(baseRate + distanceCharge + tax),
    };
  },

  // =========================
  // PICKUP FLOW
  // =========================
  async processPickup(shipmentId: string) {
    return prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.findUnique({
        where: { id: shipmentId },
        include: { assignment: { include: { driver: true } } },
      });

      if (!shipment) throw new Error("Shipment not found");
      if (shipment.status !== "ASSIGNED") {
        throw new Error("Shipment must be assigned before pickup");
      }

      const updated = await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          status: "PICKED_UP",
          pickedUpAt: new Date(),
        },
      });

      await tx.shipmentActivity.create({
        data: {
          shipmentId,
          status: "PICKED_UP",
          description: "Package picked up by driver",
        },
      });

      await financialService.processPayment(
        tx,
        shipmentId,
        safeNumber(
          shipment.codAmount || shipment.actualRate || shipment.expectedRate,
        ),
        shipment.paymentMethod as PaymentMethod,
      );

      return updated;
    },{timeout:100000});
  },

  // =========================
  // DELIVERY FLOW
  // =========================
  async processDelivery(
    shipmentId: string,
    location?: string,
    latitude?: number,
    longitude?: number,
  ) {
    return prisma.$transaction(
      async (tx) => {
        const shipment = await tx.shipment.findUnique({
          where: { id: shipmentId },
          include: {
            seller: { select: { wallet: { select: { id: true } } } },
            assignment: { include: { driver: { include: { wallet: true } } } },
            payment: true,
          },
        });

        if (!shipment) throw new Error("Shipment not found");
        if (shipment.status !== "IN_TRANSIT") {
          throw new Error("Shipment must be in transit before delivery");
        }

        const amount = safeNumber(shipment.actualRate);

        const updated = await tx.shipment.update({
          where: { id: shipmentId },
          data: {
            status: "DELIVERED",
            deliveredAt: new Date(),
          },
        });

        await tx.shipmentActivity.create({
          data: {
            shipmentId,
            status: "DELIVERED",
            description: "Package delivered successfully",
            location,
            latitude,
            longitude,
          },
        });

        // ================= COD FLOW =================
        if (shipment.paymentMethod === "COD") {
          const businessCommission = amount * 0.2;
          const debtAmount =
            safeNumber(shipment.codAmount) + businessCommission;

          await financialService.addCODDebt(
            tx,
            shipment.assignment?.driver?.id || "",
            debtAmount,
            shipment.id,
          );

          const businessWallet = await tx.wallet.findUnique({
            where: { businessId: shipment.businessId || "" },
            select: { id: true },
          });

          await financialService.cutEscrow(
            tx,
            businessWallet?.id!,
            amount * 0.1,
            "Platform fee 10%",
          );

          await financialService.releaseEscrow(
            tx,
            shipment.seller.wallet?.id!,
            amount,
            "Escrow released",
          );
        }

        // ================= PREPAID FLOW =================
        if (shipment.paymentMethod === "PREPAID") {
          await financialService.processShipmentTransactions(tx, shipment);
        }

        return updated;
      },
      { timeout: 100000 },
    );
  },

  // =========================
  // FAIL DELIVERY
  // =========================
  async failDelivery(shipmentId: string, reason: string) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.shipment.update({
        where: { id: shipmentId },
        data: { status: "FAILED" },
        select: {
          payment: { select: { id: true, paymentMethod: true } },
          actualRate: true,
          businessId: true,
          seller: { select: { wallet: { select: { id: true } } } },
        },
      });

      if (updated.payment?.paymentMethod === "COD") {
        await tx.payment.update({
          where: { id: updated.payment.id },
          data: {
            notes: "Delivery failed: " + reason,
            paymentStatus: "FAILED",
          },
        });
      }

      await financialService.releaseEscrow(
        tx,
        updated.seller.wallet?.id!,
        safeNumber(updated.actualRate),
        "Failed delivery release",
      );

      const businessWallet = await tx.wallet.findUnique({
        where: { businessId: updated.businessId || "" },
        select: { id: true },
      });

      await financialService.cutEscrow(
        tx,
        businessWallet?.id!,
        safeNumber(updated.actualRate) * 0.1,
        "Platform cut",
      );

      await tx.shipmentActivity.create({
        data: {
          shipmentId,
          status: "FAILED",
          description: `Delivery failed: ${reason}`,
        },
      });

      await tx.transaction.create({
        data: {
          walletId: updated.seller.wallet?.id || "",
          amount: safeNumber(updated.actualRate),
          type: "CREDIT",
          description: `Refund shipment ${shipmentId}`,
        },
      });

      return updated;
    },{timeout:100000});
  },

  // =========================
  // CANCEL SHIPMENT
  // =========================
  async cancelShipment(
    shipmentId: string,
    reason: string,
    canceledBy?: "driver" | "business" | "seller",
  ) {
    return prisma.$transaction(
      async (tx) => {
        const shipment = await tx.shipment.findUnique({
          where: { id: shipmentId },
          include: {
            payment: { select: { id: true } },
            assignment: {
              include: {
                
                driver: { select: { wallet: { select: { id: true } } } },
              },
            },
            seller: { select: { wallet: { select: { id: true } } } },
          },
        });

        if (!shipment) throw new Error("Shipment not found");
        if (["DELIVERED", "FAILED", "CANCELLED"].includes(shipment.status)) {
          throw new Error("Cannot cancel shipment");
        }

        const updated = await tx.shipment.update({
          where: { id: shipmentId },
          data: { status: "CANCELLED" },
        });

        await tx.shipmentActivity.create({
          data: {
            shipmentId,
            status: "CANCELLED",
            description: `Cancelled: ${reason}`,
          },
        });

        const businessWallet = await tx.wallet.findUnique({
          where: { businessId: shipment.businessId || "" },
          select: { id: true },
        });

        const amount = safeNumber(shipment.actualRate);

        if (
          canceledBy === "seller" &&
          ["PENDING", "ASSIGNED"].includes(shipment.status)
        ) {
          await financialService.releaseEscrow(
            tx,
            shipment.seller.wallet?.id!,
            amount,
            "Seller cancel",
          );
          await financialService.releaseEscrow(
            tx,
            businessWallet?.id!,
            amount * 0.1,
            "Platform refund",
          );
        } else if (canceledBy === "seller") {
          await financialService.processShipmentTransactions(tx, shipment);
        } else {
          await financialService.releaseEscrow(
            tx,
            shipment.seller.wallet?.id!,
            amount,
            "Business cancel",
          );

          await financialService.cutEscrow(
            tx,
            businessWallet?.id!,
            amount * 0.1,
            "Platform fee",
          );
        }

        if (shipment.paymentMethod === "COD") {
          await tx.payment.update({
            where: { id: shipment.payment?.id },
            data: {
              notes: "Cancelled: " + reason,
              paymentStatus: "FAILED",
            },
          });
        }

        return updated;
      },
      { timeout: 100000 },
    );
  },

  // =========================
  // RETURN SHIPMENT
  // =========================
  async returnShipment(shipmentId: string, reason: string) {
    return prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.findUnique({
        where: { id: shipmentId },
        include: {
          payment: true,
          seller: { include: { wallet: true } },
          assignment: { include: { driver: true } },
        },
      });

      if (!shipment) throw new Error("Shipment not found");
      if (["DELIVERED", "FAILED", "CANCELLED"].includes(shipment.status)) {
        throw new Error("Invalid state");
      }

      const updated = await tx.shipment.update({
        where: { id: shipmentId },
        data: { status: "RETURNED" },
        include: { payment: { select: { id: true } } },
      });

      await tx.shipmentActivity.create({
        data: {
          shipmentId,
          status: "RETURNED",
          description: `Returned: ${reason}`,
        },
      });

      if (shipment.paymentMethod === "COD") {
        const businessCommission = safeNumber(shipment.actualRate) * 0.2;
        const debtAmount = safeNumber(shipment.codAmount) + businessCommission;

        await financialService.addCODDebt(
          tx,
          shipment.assignment?.driver?.id || "",
          debtAmount,
          shipment.id,
        );

        await financialService.cutEscrow(
          tx,
          shipment.seller.wallet?.id!,
          safeNumber(shipment.actualRate),
          "Escrow deducted of return delivery",
        );

        await tx.payment.update({
          where: { id: updated.payment?.id },
          data: {
            notes: "Returned: " + reason,
            paymentStatus: "FAILED",
          },
        });
      } else {
        await financialService.processShipmentTransactions(tx, shipment);
      }

      return updated;
    },{timeout:100000});
  },
};
