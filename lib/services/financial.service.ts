import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import {
  runIdempotent,
  addLedger,
  withWalletLock,
} from "@/lib/services/financial.engine";
type Tx = any;

export const financialService = {
  // =========================
  // WALLET TOPUP
  // =========================
  async topUpWallet(walletId: string, amount: number) {
    return prisma.$transaction(async (tx) => {
      return this.createTransaction(
        tx,
        walletId,
        "CREDIT",
        amount,
        "Wallet top-up",
      );
    });
  },

  // =========================
  // CORE TRANSACTION
  // =========================
  async createTransaction(
    tx: Tx,
    walletId: string,
    type: TransactionType,
    amount: number,
    description: string,
    referenceId?: string,
  ) {
    return await runIdempotent(
      tx,
      `tx-${walletId}-${amount}-${referenceId}`,
      "transaction",
      async () => {
        const transaction = await tx.transaction.create({
          data: {
            walletId,
            type,
            amount,
            description,
            referenceId,
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });

        const balanceChange = ["CREDIT", "SETTLEMENT"].includes(type)
          ? amount
          : -amount;

        await withWalletLock(tx, walletId, async () => {
          await addLedger(tx, {
            walletId,
            amount: balanceChange,
            type,
            category: "TRANSACTION",
            referenceId,
          });

          await tx.wallet.update({
            where: { id: walletId },
            data: {
              balance: { increment: balanceChange },
            },
          });
        });

        return transaction;
      },
    );
  },

  // =========================
  // ESCROW LOCK
  // =========================
  async lockEscrow(
    tx: Tx,
    walletId: string,
    amount: number,
    reason: string,
    referenceId?: string,
  ) {
    return await runIdempotent(
      tx,
      `lock-${walletId}-${amount}-${referenceId}`,
      "lockEscrow",
      async () => {
        const wallet = await tx.wallet.findUnique({
          where: { id: walletId },
          select: { balance: true },
        });

        if (Number(amount) > Number(wallet?.balance)) {
          throw new Error("Insufficient balance");
        }

        return withWalletLock(tx, walletId, async () => {
          await tx.wallet.update({
            where: { id: walletId },
            data: {
              escrowBalance: { increment: amount },
            },
          });
          return tx.transaction.create({
            data: {
              walletId,
              referenceId,
              type: "ESCROW_LOCK",
              amount,
              description: `Escrow locked: ${reason}`,
              status: "PENDING",
            },
          });
        });
      },
    );
  },

  // =========================
  // ESCROW RELEASE
  // =========================
  async releaseEscrow(
    tx: Tx,
    walletId: string,
    amount: number,
    reason: string,
    referenceId?: string,
  ) {
    return await runIdempotent(
      tx,
      `release-${walletId}-${amount}-${referenceId}`,
      "releaseEscrow",
      async () => {
        const wallet = await tx.wallet.findUnique({ where: { id: walletId } });
        
        if (!wallet || Number(wallet.escrowBalance?.toFixed(2)) < Number(amount.toFixed(2))) {
          throw new Error("Insufficient escrow balance");
        }

        return withWalletLock(tx, walletId, async () => {
          await addLedger(tx, {
            walletId,
            amount,
            type: "CREDIT",
            category: "ESCROW_RELEASE",
            referenceId: reason,
          });

          await tx.wallet.update({
            where: { id: walletId },
            data: {
              escrowBalance: { decrement: amount },
            },
          });
          console.log("done.");
          

          return tx.transaction.create({
            data: {
              walletId,
              type: "ESCROW_RELEASE",
              amount,
              referenceId,
              description: `Escrow released: ${reason}`,
              status: "COMPLETED",
              completedAt: new Date(),
            },
          });
        });
      },
    );
  },

  // =========================
  // COD PAYMENT
  // =========================
  async processPayment(
    tx: Tx,
    shipmentId: string,
    amount: number,
    paymentMethod: "PREPAID" | "COD",
  ) {
    return await runIdempotent(
      tx,
      `payment-${shipmentId}`,
      "payment",
      async () => {
        const shipment = await tx.shipment.findUnique({
          where: { id: shipmentId },
        });

        if (!shipment) throw new Error("Shipment not found");

        let tax = 0;
        let commission = Number(shipment.actualRate);
        let driverPayable = 0;

        if (paymentMethod === "COD") {
          driverPayable = commission * 0.8;
        }

        return tx.payment.create({
          data: {
            shipmentId,
            amount,
            tax,
            commission,
            driverPayable,
            paymentMethod,
            paymentStatus:
              paymentMethod === "PREPAID" ? "COMPLETED" : "PENDING",
            paidAt: paymentMethod === "PREPAID" ? new Date() : undefined,
          },
        });
      },
    );
  },

  // =========================
  // DRIVER SETTLEMENT
  // =========================
  async settleDriverPayment(
    tx: Tx,
    driverId: string,
    amount: number,
    referenceId?: string,
  ) {
    return await runIdempotent(
      tx,
      `driver-settle-${driverId}-${referenceId}`,
      "settlement",
      async () => {
        const driver = await tx.driver.findUnique({
          where: { id: driverId },
          include: { wallet: true },
        });

        if (!driver?.wallet) throw new Error("Driver or wallet not found");

        const earning = await tx.earning.create({
          data: { driverId, amount },
        });

        return earning;
      },
    );
  },

  // =========================
  // COD DEBT
  // =========================
  async addCODDebt(
    tx: Tx,
    driverId: string,
    amount: number,
    shipmentId?: string,
  ) {
    return await runIdempotent(tx, `cod-${shipmentId}`, "codDebt", async () => {
      const debt = await tx.driverDebt.create({
        data: {
          driverId,
          amount,
          shipmentId,
          debtReason: "COD collection not completed",
        },
      });

      await tx.driver.update({
        where: { id: driverId },
        data: {
          currentDebt: { increment: amount },
        },
      });

      return debt;
    });
  },

  // =========================
  // SHIPMENT PROCESSING (CORE FLOW)
  // =========================
  async processShipmentTransactions(tx: Tx, shipment: any) {
    return await runIdempotent(
      tx,
      `shipment-${shipment.id}`,
      "shipmentProcess",
      async () => {
        const amount = Number(
          shipment.actualRate || shipment.expectedRate || 0,
        );
        const businessFee = amount * 0.1;
        const platformFee = amount * 0.1;
        const driverFee = amount * 0.8;

        // Deduct fee from seller
        await withWalletLock(tx, shipment.seller.wallet.id, async () => {
          await addLedger(tx, {
            walletId: shipment.seller.wallet.id,
            amount: -amount,
            type: "DEBIT",
            category: "SHIPMENT_CLEAR",
            referenceId: shipment.id,
          });

          await tx.wallet.update({
            where: { id: shipment.seller.wallet.id },
            data: {
              balance: { decrement: amount },
              escrowBalance: { decrement: amount },
            },
          });

          await tx.transaction.create({
            data: {
              amount: amount,
              description: "Shipping fee deducted",
              type: "DEBIT",
              completedAt: new Date(),
              referenceId: shipment.id,
              status: "COMPLETED",
              walletId: shipment?.seller?.wallet.id,
            },
          });
        });

        const businessWallet = await tx.wallet.findUnique({
          where: { businessId: shipment.businessId },
        });

        if (!businessWallet) throw new Error("Business wallet not found");

        await withWalletLock(tx, businessWallet.id, async () => {
          await addLedger(tx, {
            walletId: businessWallet.id,
            amount: businessFee,
            type: "CREDIT",
            category: "DELIVERY_FEE",
            referenceId: shipment.id,
          });

          await tx.wallet.update({
            where: { id: businessWallet.id },
            data: {
              balance: { increment: businessFee },
              escrowBalance: { decrement: platformFee },
            },
          });

          await tx.transaction.create({
            data: {
              amount: businessFee,
              description: "Delivery fee and Released Escrow",
              type: "CREDIT",
              completedAt: new Date(),
              referenceId: shipment.id,
              status: "COMPLETED",
              walletId: businessWallet.id,
            },
          });
        });

        if (!shipment?.assignment?.driver?.wallet.id)
          throw new Error("Driver wallet not found");

        await withWalletLock(
          tx,
          shipment?.assignment?.driver?.wallet.id,
          async () => {
            await addLedger(tx, {
              walletId: shipment?.assignment?.driver?.wallet.id,
              amount: driverFee,
              type: "CREDIT",
              category: "DELIVERY_FEE",
              referenceId: shipment.id,
            });

            await tx.wallet.update({
              where: { id: shipment?.assignment?.driver?.wallet.id },
              data: {
                balance: { increment: driverFee },
              },
            });

            await tx.transaction.create({
              data: {
                amount: driverFee,
                description: "Delivery fee",
                type: "CREDIT",
                completedAt: new Date(),
                referenceId: shipment.id,
                status: "COMPLETED",
                walletId: shipment?.assignment?.driver?.wallet.id,
              },
            });
          },
        );

        await this.settleDriverPayment(
          tx,
          shipment.assignment?.driverId,
          amount * 0.8,
        );
      },
    );
  },

  // =========================
  // ESCROW CUT
  // =========================
  async cutEscrow(
    tx: Tx,
    walletId: string,
    amount: number,
    reason: string,
    referenceId: string,
  ) {
    return await runIdempotent(
      tx,
      `cut-${walletId}-${amount}-${referenceId}`,
      "cutEscrow",
      async () => {
        return withWalletLock(tx, walletId, async () => {
          await addLedger(tx, {
            walletId,
            amount: -amount,
            type: "DEBIT",
            category: "ESCROW_CUT",
            referenceId: reason,
          });

          await tx.wallet.update({
            where: { id: walletId },
            data: {
              balance: { decrement: amount },
              escrowBalance: { decrement: amount },
            },
          });

          return tx.transaction.create({
            data: {
              walletId,
              type: "COMMISSION",
              amount,
              referenceId,
              description: `Escrow cut: ${reason}`,
              status: "COMPLETED",
              completedAt: new Date(),
            },
          });
        });
      },
    );
  },

  // =========================
  // ESCROW CUT
  // =========================
  async transferFunds(
    tx: Tx,
    from: "driver" | "business" | "seller",
    to: "driver" | "business" | "seller",
    fromId: string,
    toId: string,
    amount: number,
    description: string = "Funds Transfer",
    referenceId?: string,
  ) {
    if (amount <= 0) throw new Error("Invalid transfer amount");

    return await runIdempotent(
      tx,
      `transfer-${from}-${fromId}-${to}-${toId}-${referenceId}`,
      "transfer",
      async () => {
        // 🔐 resolve wallets safely
        const senderWhere =
          from === "seller"
            ? { sellerId: fromId }
            : from === "business"
              ? { businessId: fromId }
              : { driverId: fromId };

              console.log(to);
              console.log(toId);
              
        const receiverWhere =
          to === "seller"
            ? { sellerId: toId }
            : to === "business"
              ? { businessId: toId }
              : { driverId: toId };

        const senderWallet = await tx.wallet.findFirst({
          where: senderWhere,
        });

        const receiverWallet = await tx.wallet.findFirst({
          where: receiverWhere,
        });



        if (!senderWallet || !receiverWallet) {
          throw new Error("Wallet not found");
        }

        if (senderWallet.balance < amount) {
          throw new Error("Insufficient balance");
        }

        // 🔒 LOCK SENDER WALLET FIRST
        await withWalletLock(tx, senderWallet.id, async () => {
          // 💰 DEBIT sender (ledger + balance)
          await addLedger(tx, {
            walletId: senderWallet.id,
            amount: -amount,
            type: "DEBIT",
            category: "TRANSFER_OUT",
            referenceId,
          });

          await tx.wallet.update({
            where: { id: senderWallet.id },
            data: {
              balance: { decrement: amount },
            },
          });
          await tx.transaction.create({
            data: {
              walletId: senderWallet.id,
              type: "DEBIT",
              amount,
              referenceId,
              description:"Funds transfered",
              status: "COMPLETED",
              completedAt: new Date(),
            },
          });

          // 🔒 LOCK RECEIVER WALLET
          await withWalletLock(tx, receiverWallet.id, async () => {
            // 💰 CREDIT receiver (ledger + balance)
            await addLedger(tx, {
              walletId: receiverWallet.id,
              amount: amount,
              type: "CREDIT",
              category: "TRANSFER_IN",
              referenceId,
            });

            await tx.wallet.update({
              where: { id: receiverWallet.id },
              data: {
                balance: { increment: amount },
              },
            });
            await tx.transaction.create({
              data: {
                walletId: receiverWallet.id,
                type: "CREDIT",
                amount,
                referenceId,
                description: "Funds recieved",
                status: "COMPLETED",
                completedAt: new Date(),
              },
            });
          });
        });

        return {
          success: true,
          from: senderWallet.id,
          to: receiverWallet.id,
          amount,
        };
      }
    );
  },

  // =========================
  // Settle COD Debt
  // =========================
  async   settleCODDebt(
    tx: Tx,
    driverId: string,
    amount: number,
    referenceId?: string,
  ) {
    if (amount <= 0) throw new Error("Invalid amount");

    return runIdempotent(
      tx,
      `cod-settle:${driverId}:${amount}:${referenceId}`,
      "cod_debt_settlement",
      async () => {
        
        const driver = await tx.driver.findUnique({
          where: { id: driverId },
          include: { wallet: true },
        });

        if (!driver || !driver.wallet) {
          throw new Error("Driver or wallet not found");
        }

        if (driver?.currentDebt?.toFixed() < amount) {
          throw new Error("Amount exceeds current debt");
        }

        // 🔒 lock driver wallet to prevent concurrent debt modifications
        await withWalletLock(tx, driver.wallet.id, async () => {
          // Get oldest debts first (FIFO settlement)
          const debts = await tx.driverDebt.findMany({
            where: {
              driverId,
            },
            orderBy: {
              createdAt: "asc",
            },
          });

          let remainingAmount = amount;

          for (const debt of debts) {
            if (remainingAmount <= 0) break;

            const settleAmount = Math.min(remainingAmount, debt.amount);

            // mark debt as settled (or partially settled if you later upgrade)
            await tx.driverDebt.update({
              where: { id: debt.id },
              data: {
                isSettled: true,
                settledAt: new Date(),
              },
            });

            remainingAmount -= settleAmount;
          }

          // update driver debt safely
          await tx.driver.update({
            where: { id: driverId },
            data: {
              currentDebt: {
                decrement: amount,
              },
            },
          });
        });

        return {
          success: true,
          settledAmount: amount,
          remainingDebt: driver.currentDebt - amount,
        };
      },
    );
  },
};
