import { prisma } from "@fastship/lib";
import { ShipmentStatus, PaymentMethod, Currency } from "@prisma/client";
import { toDecimal, financialService } from "./financial.service";
import currencyService from "./currency.service";

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
    return prisma.$transaction(
      async (tx) => {
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
          shipment?.currency || "USD",
        );

        return updated;
      },
      { timeout: 1000000 },
    );
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
            seller: {
              select: {
                wallet: {
                  select: {
                    id: true,
                    currency: true,
                    transactions: {
                      where: {
                        referenceId: shipmentId,
                        type: "ESCROW_LOCK",
                      },
                      select: {
                        currency: true,
                        id: true,
                        amount: true,
                        displayAmount: true,
                        exchangeRate: true,
                      },
                    },
                  },
                },
              },
            },
            assignment: {
              include: {
                driver: {
                  include: {
                    wallet: {
                      select: {
                        id: true,
                        currency: true,
                        transactions: {
                          where: {
                            referenceId: shipmentId,
                            type: "ESCROW_LOCK",
                          },
                          select: {
                            currency: true,
                            id: true,
                            amount: true,
                            displayAmount: true,
                            exchangeRate: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
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
          const businessCommission = amount * 0.2; // 10% platform fee + 10% business fee. giving 10% platform fee beacuse we cut that from escrow
          const debtAmount: number =
            safeNumber(shipment.codAmount) + businessCommission;

          await financialService.addCODDebt(
            tx,
            shipment.assignment?.driver?.id || "",
            Number(debtAmount),
            shipment.id,
            shipment.assignment?.driver?.wallet?.currency || "USD",
          );

          const businessWallet = await tx.wallet.findUnique({
            where: { businessId: shipment.businessId || "" },
            select: {
              id: true,
              currency: true,
              transactions: {
                where: {
                  referenceId: shipment.id,
                  type: "ESCROW_LOCK",
                },
                select: {
                  currency: true,
                  id: true,
                  amount: true,
                  displayAmount: true,
                  exchangeRate: true,
                },
              },
            },
          });

          const bsTransactionsLength = businessWallet?.transactions.length || 0;
          const businessAmount =
            businessWallet?.transactions[bsTransactionsLength - 1 || 0]
              .displayAmount || 0;
          const businessCurrency =
            businessWallet?.transactions[bsTransactionsLength - 1 || 0]
              .currency || "USD";

          const seTransactionsLength =
            shipment.seller.wallet?.transactions.length || 0;
          const sellerAmount =
            shipment.seller.wallet?.transactions[seTransactionsLength - 1 || 0]
              .displayAmount || 0;
          const sellerCurrency =
            shipment.seller.wallet?.transactions[seTransactionsLength - 1 || 0]
              .currency || "USD";

          await financialService.cutEscrow(
            tx,
            businessWallet?.id!,
            businessAmount, // platform fee 10%
            "Platform fee 10%",
            updated.id,
            businessCurrency,
          );

          await financialService.releaseEscrow(
            tx,
            shipment.seller.wallet?.id!,
            sellerAmount,
            "Escrow released",
            updated.id,
            sellerCurrency!,
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
    return prisma.$transaction(
      async (tx) => {
        const updated = await tx.shipment.update({
          where: { id: shipmentId },
          data: { status: "FAILED" },
          select: {
            actualRate_cents: true,
            currency: true,
            payment: { select: { id: true, paymentMethod: true } },
            actualRate: true,
            businessId: true,
            seller: {
              select: {
                wallet: {
                  select: {
                    id: true,
                    currency: true,
                    transactions: {
                      where: {
                        referenceId: shipmentId,
                        type: "ESCROW_LOCK",
                      },
                      select: {
                        id: true,
                        amount: true,
                        amount_cents: true,
                        currency: true,
                        displayAmount: true,
                        exchangeRate: true,
                        referenceId: true,
                      },
                    },
                  },
                },
              },
            },
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

        const sellerTransactionsLength =
          updated.seller.wallet?.transactions.length || 0;

        let amountToBeReleased =
          updated.seller.wallet?.transactions[sellerTransactionsLength - 1 || 0]
            .displayAmount;
        let amountReleasedCurrency =
          updated.seller.wallet?.transactions[sellerTransactionsLength - 1 || 0]
            .currency;

        await financialService.releaseEscrow(
          tx,
          updated.seller.wallet?.id!,
          amountToBeReleased!,
          "Failed delivery release",
          shipmentId,
          amountReleasedCurrency,
        );

        const businessWallet = await tx.wallet.findUnique({
          where: { businessId: updated.businessId || "" },
          select: {
            id: true,
            currency: true,
            transactions: {
              where: {
                referenceId: shipmentId,
                type: "ESCROW_LOCK",
              },
              select: {
                id: true,
                amount: true,
                amount_cents: true,
                currency: true,
                displayAmount: true,
                exchangeRate: true,
                referenceId: true,
              },
            },
          },
        });

        const businessTransactionsLength =
          businessWallet?.transactions.length || 0;

        let amountToBeDeducted =
          businessWallet?.transactions[businessTransactionsLength || 0]
            .displayAmount;

        let amountDeductedCurrency =
          businessWallet?.transactions[businessTransactionsLength || 0]
            .currency;

        await financialService.cutEscrow(
          tx,
          businessWallet?.id!,
          amountToBeDeducted!,
          "Platform cut",
          shipmentId,
          amountDeductedCurrency,
        );

        await tx.shipmentActivity.create({
          data: {
            shipmentId,
            status: "FAILED",
            description: `Delivery failed: ${reason}`,
          },
        });

        return updated;
      },
      { timeout: 100000 },
    );
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
                driver: {
                  select: {
                    wallet: {
                      select: {
                        id: true,
                        currency: true,
                        transactions: {
                          where: {
                            referenceId: shipmentId,
                            type: "ESCROW_LOCK",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            seller: {
              select: {
                wallet: {
                  select: {
                    id: true,
                    currency: true,
                    transactions: {
                      where: {
                        referenceId: shipmentId,
                        type: "ESCROW_LOCK",
                      },
                    },
                  },
                },
              },
            },
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
          select: {
            id: true,
            currency: true,
            transactions: {
              where: {
                referenceId: shipmentId,
                type: "ESCROW_LOCK",
              },
              select: {
                displayAmount: true,
                currency: true,
                id: true,
              },
            },
          },
        });

        const sellerTransactionsLength =
          shipment.seller.wallet?.transactions.length || 0;

        const sellerAmountReleased =
          shipment.seller.wallet?.transactions[
            sellerTransactionsLength - 1 || 0
          ].displayAmount || 0;
        const sellerAmountCurrency =
          shipment.seller.wallet?.transactions[
            sellerTransactionsLength - 1 || 0
          ].currency || "USD";

        let businessAmountReleased =
          businessWallet?.transactions[
            businessWallet?.transactions?.length - 1 || 0
          ].displayAmount;

        let businessAmountCurrency =
          businessWallet?.transactions[
            businessWallet?.transactions?.length - 1 || 0
          ].currency;
        if (
          canceledBy === "seller" &&
          ["PENDING", "ASSIGNED"].includes(shipment.status)
        ) {
          await financialService.releaseEscrow(
            tx,
            shipment.seller.wallet?.id!,
            sellerAmountReleased,
            "Seller cancelled before pickup",
            shipment.id,
            sellerAmountCurrency,
          );

          await financialService.releaseEscrow(
            tx,
            businessWallet?.id!,
            businessAmountReleased!,
            "Platform refund",
            shipment.id,
            businessAmountCurrency,
          );
        } else if (canceledBy === "seller") {
          await financialService.processShipmentTransactions(tx, shipment);
        } else {
          await financialService.releaseEscrow(
            tx,
            shipment.seller.wallet?.id!,
            sellerAmountReleased,
            "Business cancelled",
            shipment.id,
            sellerAmountCurrency,
          );

          await financialService.cutEscrow(
            tx,
            businessWallet?.id!,
            businessAmountReleased!,
            "Platform fee",
            shipment.id,
            businessAmountCurrency!,
          );
        }

        if (shipment.paymentMethod === "COD" && shipment?.payment?.id) {
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
      { timeout: 10000000 },
    );
  },

  // =========================
  // RETURN SHIPMENT
  // =========================
  async returnShipment(shipmentId: string, reason: string) {
    return prisma.$transaction(
      async (tx) => {
        const shipment = await tx.shipment.findUnique({
          where: { id: shipmentId },
          include: {
            payment: true,
            seller: { include: { wallet: true } },
            assignment: {
              include: {
                driver: {
                  include: {
                    wallet: {
                      select: { id: true },
                    },
                  },
                },
              },
            },
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

        if (updated.paymentMethod === "COD") {
          await tx.payment.update({
            where: {
              shipmentId: updated.id,
            },
            data: {
              paymentStatus: "FAILED",
              notes: "Payment failed due to return delivery",
            },
          });
        }

        await financialService.processShipmentTransactions(tx, shipment);

        return updated;
      },
      { timeout: 100000 },
    );
  },
};
