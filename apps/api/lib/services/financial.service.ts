import { prisma } from "@fastship/lib";
import { TransactionType } from "@prisma/client";
import { runIdempotent, addLedger, withWalletLock } from "./financial.engine";
type Tx = any;

export const financialService = {
  // =========================
  // WALLET TOPUP
  // =========================
  async topUpWallet(walletId: string, amount: number) {
    // Validate amount is integer (cents/paise)
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error("Amount must be a positive integer (cents/paise)");
    }

    return prisma.$transaction(async (tx) => {
      return this.createTransaction(
        tx,
        walletId,
        "CREDIT",
        amount,
        "Wallet top-up",
        `topup-${walletId}-${amount}-${Date.now()}`,
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
    // Validate amount is integer (cents/paise)
    if (!Number.isInteger(amount) || amount === 0) {
      throw new Error("Amount must be a non-zero integer (cents/paise)");
    }

    // Create idempotency key with wallet, amount, timestamp
    const idempotencyKey = `tx-${walletId}-${type}-${amount}-${referenceId || 'no-ref'}-${Date.now()}`;

    return await runIdempotent(
      tx,
      idempotencyKey,
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
    // Validate amount is integer (cents/paise)
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error("Amount must be a positive integer (cents/paise)");
    }

    return await runIdempotent(
      tx,
      `lock-${walletId}-${amount}-${referenceId}`,
      "lockEscrow",
      async () => {
        const wallet = await tx.wallet.findUnique({
          where: { id: walletId },
          select: { balance: true },
        });

        if (!wallet || wallet.balance < amount) {
          throw new Error("Insufficient balance");
        }

        return withWalletLock(tx, walletId, async () => {
          await addLedger(tx, {
            walletId,
            amount,
            type: "ESCROW_LOCK",
            category: "ESCROW_LOCK",
            referenceId: referenceId,
          });
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
    // Validate amount is integer (cents/paise)
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error("Amount must be a positive integer (cents/paise)");
    }

    return await runIdempotent(
      tx,
      `release-${walletId}-${amount}-${referenceId}`,
      "releaseEscrow",
      async () => {
        const wallet = await tx.wallet.findUnique({ where: { id: walletId } });

        if (!wallet || wallet.escrowBalance < amount) {
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
    // Validate amount is integer (cents/paise)
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error("Amount must be a positive integer (cents/paise)");
    }

    return await runIdempotent(
      tx,
      `payment-${shipmentId}-${amount}-${paymentMethod}`,
      "payment",
      async () => {
        const shipment = await tx.shipment.findUnique({
          where: { id: shipmentId },
        });

        if (!shipment) throw new Error("Shipment not found");

        let tax = 0;
        let commission = amount; // Already in cents
        let driverPayable = 0;

        if (paymentMethod === "COD") {
          driverPayable = Math.floor((commission * 80) / 100); // 80% with proper rounding
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
    // Validate amount is integer (cents/paise)
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error("Amount must be a positive integer (cents/paise)");
    }

    return await runIdempotent(
      tx,
      `driver-settle-${driverId}-${amount}-${referenceId || 'no-ref'}`,
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
    // Validate amount is integer (cents/paise)
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error("Amount must be a positive integer (cents/paise)");
    }

    return await runIdempotent(
      tx,
      `cod-${shipmentId}-${driverId}-${amount}`,
      "codDebt",
      async () => {
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
      },
    );
  },

  // =========================
  // SHIPMENT PROCESSING (CORE FLOW)
  // =========================
  async processShipmentTransactions(tx: Tx, shipment: any) {
    // All amounts MUST be integers (cents/paise)
    const amountInCents = Math.round(Number(
      shipment.actualRate || shipment.expectedRate || 0
    ) * 100); // Convert to cents

    if (!Number.isInteger(amountInCents) || amountInCents <= 0) {
      throw new Error("Invalid shipment amount: must be positive integer");
    }

    // Calculate fees with integer math to prevent floating point errors
    const businessFeePercent = 10; // 10%
    const platformFeePercent = 10; // 10%
    const driverFeePercent = 80; // 80%

    // Use integer division to ensure no fractional cents
    const businessFeeCents = Math.floor((amountInCents * businessFeePercent) / 100);
    const platformFeeCents = Math.floor((amountInCents * platformFeePercent) / 100);
    // Driver gets the remainder to ensure no money is lost due to rounding
    const driverFeeCents = amountInCents - businessFeeCents - platformFeeCents;

    // Validation: total must equal amount
    const totalCents = businessFeeCents + platformFeeCents + driverFeeCents;
    if (totalCents !== amountInCents) {
      throw new Error(
        `Fee calculation error: ${totalCents} != ${amountInCents}`
      );
    }

    return await runIdempotent(
      tx,
      `shipment-${shipment.id}-${amountInCents}`,
      "shipmentProcess",
      async () => {
        // Deduct fee from seller
        await withWalletLock(tx, shipment.seller.wallet.id, async () => {
          await addLedger(tx, {
            walletId: shipment.seller.wallet.id,
            amount: -amountInCents,
            type: "DEBIT",
            category: "SHIPMENT_CLEAR",
            referenceId: shipment.id,
          });

          await tx.wallet.update({
            where: { id: shipment.seller.wallet.id },
            data: {
              balance: { decrement: amountInCents },
              escrowBalance: { decrement: amountInCents },
            },
          });

          await tx.transaction.create({
            data: {
              amount: amountInCents,
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
            amount: businessFeeCents,
            type: "CREDIT",
            category: "DELIVERY_FEE",
            referenceId: shipment.id,
          });

          await tx.wallet.update({
            where: { id: businessWallet.id },
            data: {
              balance: { increment: businessFeeCents },
              escrowBalance: { decrement: platformFeeCents },
            },
          });

          await tx.transaction.create({
            data: {
              amount: businessFeeCents,
              description: "Delivery fee received",
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
              amount: driverFeeCents,
              type: "CREDIT",
              category: "DELIVERY_FEE",
              referenceId: shipment.id,
            });

            await tx.wallet.update({
              where: { id: shipment?.assignment?.driver?.wallet.id },
              data: {
                balance: { increment: driverFeeCents },
              },
            });

            await tx.transaction.create({
              data: {
                amount: driverFeeCents,
                description: "Delivery fee earned",
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
          driverFeeCents,
        );

        return {
          amountProcessed: amountInCents,
          businessFee: businessFeeCents,
          driverFee: driverFeeCents,
          platformFee: platformFeeCents,
        };
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
    // Validate amount is integer (cents/paise)
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error("Amount must be a positive integer (cents/paise)");
    }

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
  // FUND TRANSFER
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
    // Validate amount is integer (cents/paise)
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error("Amount must be a positive integer (cents/paise)");
    }

    // Better idempotency key with timestamp to avoid collisions
    const uniqueKey = `transfer-${from}-${fromId}-${to}-${toId}-${amount}-${referenceId || 'no-ref'}-${Date.now()}`;

    return await runIdempotent(
      tx,
      uniqueKey,
      "transfer",
      async () => {
        // 🔐 resolve wallets safely
        const senderWhere =
          from === "seller"
            ? { sellerId: fromId }
            : from === "business"
              ? { businessId: fromId }
              : { driverId: fromId };

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
              description: description,
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
                description: description,
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
      },
    );
  },

  // =========================
  // Settle COD Debt
  // =========================
  async settleCODDebt(
    tx: Tx,
    driverId: string,
    amount: number,
    referenceId?: string,
  ) {
    // Validate amount is integer (cents/paise)
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error("Amount must be a positive integer (cents/paise)");
    }

    return runIdempotent(
      tx,
      `cod-settle:${driverId}:${amount}:${referenceId}:${Date.now()}`,
      "cod_debt_settlement",
      async () => {
        const driver = await tx.driver.findUnique({
          where: { id: driverId },
          include: { wallet: true },
        });

        if (!driver || !driver.wallet) {
          throw new Error("Driver or wallet not found");
        }

        if (!driver.currentDebt || driver.currentDebt < amount) {
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
