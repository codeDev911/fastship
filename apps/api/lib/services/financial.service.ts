import { prisma } from "@fastship/lib";
import { TransactionType } from "@prisma/client";
import { runIdempotent, addLedger, withWalletLock } from "./financial.engine";
type Tx = any;

// =========================
// HELPER FUNCTIONS FOR CENTS CONVERSION
// =========================

/**
 * Convert decimal amount to cents (e.g., 99.99 -> 9999)
 * Rounds to nearest cent to handle floating point errors
 */
function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert cents to decimal (e.g., 9999 -> 99.99)
 */
function toDecimal(cents: number): number {
  return cents / 100;
}

/**
 * Validate that amount in cents is positive integer
 */
function validateCents(cents: number, fieldName: string = "amount"): void {
  if (!Number.isInteger(cents) || cents <= 0) {
    throw new Error(
      `${fieldName} must be a positive integer (cents). Got: ${cents}`
    );
  }
}

export const financialService = {
  // =========================
  // WALLET TOPUP
  // =========================
  async topUpWallet(walletId: string, amount: number) {
    // Convert incoming decimal amount to cents
    const amountCents = toCents(amount);
    validateCents(amountCents, "topup amount");

    return prisma.$transaction(async (tx) => {
      return this.createTransaction(
        tx,
        walletId,
        "CREDIT",
        amount, // Pass original decimal amount
        "Wallet top-up",
        `topup-${walletId}-${amount}-${Date.now()}`,
      );
    },{timeout:10000});
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
    // Convert incoming decimal amount to cents
    const amountCents = toCents(amount);
    validateCents(amountCents, "transaction amount");

    // Create idempotency key with cents and timestamp
    const idempotencyKey = `tx-${walletId}-${type}-${amountCents}-${referenceId || 'no-ref'}-${Date.now()}`;

    return await runIdempotent(
      tx,
      idempotencyKey,
      "transaction",
      async () => {
        const transaction = await tx.transaction.create({
          data: {
            walletId,
            type,
            amount: amount, // Decimal value for display
            amount_cents: amountCents, // Integer cents for calculations
            description,
            referenceId,
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });

        const balanceChangeCents = ["CREDIT", "SETTLEMENT"].includes(type)
          ? amountCents
          : -amountCents;

        await withWalletLock(tx, walletId, async () => {
          await addLedger(tx, {
            walletId,
            amount: balanceChangeCents,  // IMPORTANT: pass amount in cents (integer)
            type,
            category: "TRANSACTION",
            referenceId,
          });

          await tx.wallet.update({
            where: { id: walletId },
            data: {
              balance: { increment: toDecimal(balanceChangeCents) },
              balance_cents: { increment: balanceChangeCents },
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
    // Convert incoming decimal amount to cents
    const amountCents = toCents(amount);
    validateCents(amountCents, "escrow lock amount");

    return await runIdempotent(
      tx,
      `lock-${walletId}-${amountCents}-${referenceId}`,
      "lockEscrow",
      async () => {
        const wallet = await tx.wallet.findUnique({
          where: { id: walletId },
          select: { balance: true, balance_cents: true },
        });

        if (!wallet || wallet.balance_cents < amountCents) {
          throw new Error("Insufficient balance");
        }

        return withWalletLock(tx, walletId, async () => {
          await addLedger(tx, {
            walletId,
            amount: -amountCents,  // IMPORTANT: pass amount in cents (integer)
            type: "ESCROW_LOCK",
            category: "ESCROW_LOCK",
            referenceId: referenceId,
          });
          await tx.wallet.update({
            where: { id: walletId },
            data: {
              escrowBalance: { increment: toDecimal(amountCents) },
              escrowBalance_cents: { increment: amountCents },
            },
          });
          return tx.transaction.create({
            data: {
              walletId,
              referenceId,
              type: "ESCROW_LOCK",
              amount: toDecimal(amountCents),
              amount_cents: amountCents,
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
    // Convert incoming decimal amount to cents
    const amountCents = toCents(amount);
    validateCents(amountCents, "escrow release amount");

    return await runIdempotent(
      tx,
      `release-${walletId}-${amountCents}-${referenceId}`,
      "releaseEscrow",
      async () => {
        const wallet = await tx.wallet.findUnique({
          where: { id: walletId },
          select: { escrowBalance_cents: true },
        });

        if (!wallet || wallet.escrowBalance_cents < amountCents) {
          throw new Error("Insufficient escrow balance");
        }

        return withWalletLock(tx, walletId, async () => {
          await addLedger(tx, {
            walletId,
            amount: amountCents,  // IMPORTANT: pass amount in cents (integer)
            type: "ESCROW_RELEASE",
            category: "ESCROW_RELEASE",
            referenceId: reason,
          });

          await tx.wallet.update({
            where: { id: walletId },
            data: {
              escrowBalance: { decrement: toDecimal(amountCents) },
              escrowBalance_cents: { decrement: amountCents },
            },
          });

          return tx.transaction.create({
            data: {
              walletId,
              type: "ESCROW_RELEASE",
              amount: toDecimal(amountCents),
              amount_cents: amountCents,
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
    // Convert incoming decimal amount to cents
    const amountCents = toCents(amount);
    validateCents(amountCents, "payment amount");

    return await runIdempotent(
      tx,
      `payment-${shipmentId}-${amountCents}-${paymentMethod}`,
      "payment",
      async () => {
        const shipment = await tx.shipment.findUnique({
          where: { id: shipmentId },
          select:{
            id:true,
            actualRate_cents:true,
          }
        });

        if (!shipment) throw new Error("Shipment not found");

        // Calculate fees using integer math with cents
        let taxCents = 0;
        let commissionCents = Math.floor((shipment.actualRate_cents*10)/100); // 10% commission
        let driverPayableCents = 0;

        if (paymentMethod === "COD") {
          driverPayableCents = Math.floor((shipment.actualRate_cents * 80) / 100); // 80% with proper rounding
        }

        return tx.payment.create({
          data: {
            shipmentId,
            amount: toDecimal(amountCents),
            amount_cents: amountCents,
            tax: toDecimal(taxCents),
            tax_cents: taxCents,
            commission: toDecimal(commissionCents),
            commission_cents: commissionCents,
            driverPayable: toDecimal(driverPayableCents),
            driverPayable_cents: driverPayableCents,
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
    // Convert incoming decimal amount to cents
    const amountCents = toCents(amount);
    validateCents(amountCents, "settlement amount");

    return await runIdempotent(
      tx,
      `driver-settle-${driverId}-${amountCents}-${referenceId || 'no-ref'}`,
      "settlement",
      async () => {
        const driver = await tx.driver.findUnique({
          where: { id: driverId },
          include: { wallet: true },
        });

        if (!driver?.wallet) throw new Error("Driver or wallet not found");

        const earning = await tx.earning.create({
          data: {
            driverId,
            amount: toDecimal(amountCents),
            amount_cents: amountCents,
          },
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
    // Convert incoming decimal amount to cents
    const amountCents = toCents(amount);
    validateCents(amountCents, "COD debt amount");

    return await runIdempotent(
      tx,
      `cod-${shipmentId}-${driverId}-${amountCents}`,
      "codDebt",
      async () => {
        const debt = await tx.driverDebt.create({
          data: {
            driverId,
            amount: toDecimal(amountCents),
            amount_cents: amountCents,
            shipmentId,
            debtReason: "COD collection not completed",
          },
        });

        await tx.driver.update({
          where: { id: driverId },
          data: {
            currentDebt: { increment: toDecimal(amountCents) },
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
    // Convert decimal amount to cents and validate
    const amountCents = toCents(
      shipment.actualRate || shipment.expectedRate || 0
    );
    validateCents(amountCents, "shipment rate");

    // Calculate fees with integer math to prevent floating point errors
    const businessFeePercent = 10; // 10%
    const platformFeePercent = 10; // 10%
    const driverFeePercent = 80; // 80%

    // Use integer division to ensure no fractional cents
    const businessFeeCents = Math.floor((amountCents * businessFeePercent) / 100);
    const platformFeeCents = Math.floor((amountCents * platformFeePercent) / 100);
    // Driver gets the remainder to ensure no money is lost due to rounding
    const driverFeeCents = amountCents - businessFeeCents - platformFeeCents;

    // Validation: total must equal amount
    const totalCents = businessFeeCents + platformFeeCents + driverFeeCents;
    if (totalCents !== amountCents) {
      throw new Error(
        `Fee calculation error: ${totalCents} != ${amountCents}`
      );
    }

    // Convert back to decimal for ledger entries and transactions
    const businessFee = toDecimal(businessFeeCents);
    const platformFee = toDecimal(platformFeeCents);
    const driverFee = toDecimal(driverFeeCents);
    const totalAmount = toDecimal(amountCents);

    return await runIdempotent(
      tx,
      `shipment-${shipment.id}-${totalAmount}`,
      "shipmentProcess",
      async () => {
        // Deduct fee from seller
        await withWalletLock(tx, shipment.seller.wallet.id, async () => {
          await addLedger(tx, {
            walletId: shipment.seller.wallet.id,
            amount: -amountCents,  // IMPORTANT: pass amount in cents (integer)
            type: "DEBIT",
            category: "SHIPMENT_CLEAR",
            referenceId: shipment.id,
          });

          await tx.wallet.update({
            where: { id: shipment.seller.wallet.id },
            data: {
              balance: { decrement: totalAmount },
              balance_cents: { decrement: amountCents },
              escrowBalance: { decrement: totalAmount },
              escrowBalance_cents: { decrement: amountCents },
            },
          });

          await tx.transaction.create({
            data: {
              amount: totalAmount,
              amount_cents: amountCents,
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
            amount: businessFeeCents,  // IMPORTANT: pass amount in cents (integer)
            type: "CREDIT",
            category: "DELIVERY_FEE",
            referenceId: shipment.id,
          });

          await tx.wallet.update({
            where: { id: businessWallet.id },
            data: {
              balance: { increment: businessFee },
              balance_cents: { increment: businessFeeCents },
              escrowBalance: { decrement: platformFee },
              escrowBalance_cents: { decrement: platformFeeCents },
            },
          });

          await tx.transaction.create({
            data: {
              amount: businessFee,
              amount_cents: businessFeeCents,
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
              amount: driverFeeCents,  // IMPORTANT: pass amount in cents (integer)
              type: "CREDIT",
              category: "DELIVERY_FEE",
              referenceId: shipment.id,
            });

            await tx.wallet.update({
              where: { id: shipment?.assignment?.driver?.wallet.id },
              data: {
                balance: { increment: driverFee },
                balance_cents: { increment: driverFeeCents },
              },
            });

            await tx.transaction.create({
              data: {
                amount: driverFee,
                amount_cents: driverFeeCents,
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
          driverFee,
        );

        return {
          amountProcessed: totalAmount,
          businessFee: businessFee,
          driverFee: driverFee,
          platformFee: platformFee,
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
    // Convert incoming decimal amount to cents
    const amountCents = toCents(amount);
    validateCents(amountCents, "escrow cut amount");

    return await runIdempotent(
      tx,
      `cut-${walletId}-${amountCents}-${referenceId}`,
      "cutEscrow",
      async () => {
        return withWalletLock(tx, walletId, async () => {
          await addLedger(tx, {
            walletId,
            amount: 0, // we've sent 0 , because escorw has already been deducted from balance during lock, this is just a ledger entry to record the cut with proper category   
            type: "ESCROW_CUT",
            category: "ESCROW_CUT",
            referenceId: reason,
          });

          await tx.wallet.update({
            where: { id: walletId },
            data: {
              balance: { decrement: toDecimal(amountCents) },
              balance_cents: { decrement: amountCents },
              escrowBalance: { decrement: toDecimal(amountCents) },
              escrowBalance_cents: { decrement: amountCents },
            },
          });

          return tx.transaction.create({
            data: {
              walletId,
              type: "ESCROW_CUT",
              amount: toDecimal(amountCents),
              amount_cents: amountCents,
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
    // Convert incoming decimal amount to cents
    const amountCents = toCents(amount);
    validateCents(amountCents, "transfer amount");

    // Better idempotency key with timestamp to avoid collisions
    const uniqueKey = `transfer-${from}-${fromId}-${to}-${toId}-${amountCents}-${referenceId || 'no-ref'}-${Date.now()}`;

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

        if (senderWallet.balance_cents < amountCents) {
          throw new Error("Insufficient balance");
        }

        // 🔒 LOCK SENDER WALLET FIRST
        await withWalletLock(tx, senderWallet.id, async () => {
          // 💰 DEBIT sender (ledger + balance)
          await addLedger(tx, {
            walletId: senderWallet.id,
            amount: -amountCents,  // IMPORTANT: pass amount in cents (integer)
            type: "DEBIT",
            category: "TRANSFER_OUT",
            referenceId,
          });

          await tx.wallet.update({
            where: { id: senderWallet.id },
            data: {
              balance: { decrement: toDecimal(amountCents) },
              balance_cents: { decrement: amountCents },
            },
          });
          await tx.transaction.create({
            data: {
              walletId: senderWallet.id,
              type: "DEBIT",
              amount: toDecimal(amountCents),
              amount_cents: amountCents,
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
              amount: amountCents,  // IMPORTANT: pass amount in cents (integer)
              type: "CREDIT",
              category: "TRANSFER_IN",
              referenceId,
            });

            await tx.wallet.update({
              where: { id: receiverWallet.id },
              data: {
                balance: { increment: toDecimal(amountCents) },
                balance_cents: { increment: amountCents },
              },
            });
            await tx.transaction.create({
              data: {
                walletId: receiverWallet.id,
                type: "CREDIT",
                amount: toDecimal(amountCents),
                amount_cents: amountCents,
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
          amount: toDecimal(amountCents),
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
    // Convert incoming decimal amount to cents
    const amountCents = toCents(amount);
    validateCents(amountCents, "COD debt settlement amount");

    return runIdempotent(
      tx,
      `cod-settle:${driverId}:${amountCents}:${referenceId}:${Date.now()}`,
      "cod_debt_settlement",
      async () => {
        const driver = await tx.driver.findUnique({
          where: { id: driverId },
          include: { wallet: true },
        });

        if (!driver || !driver.wallet) {
          throw new Error("Driver or wallet not found");
        }

        if (!driver.currentDebt || driver.currentDebt < toDecimal(amountCents)) {
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

          let remainingAmountCents = amountCents;

          for (const debt of debts) {
            if (remainingAmountCents <= 0) break;

            const debtCents = toCents(debt.amount);
            const settleAmountCents = Math.min(remainingAmountCents, debtCents);

            // mark debt as settled (or partially settled if you later upgrade)
            await tx.driverDebt.update({
              where: { id: debt.id },
              data: {
                isSettled: true,
                settledAt: new Date(),
              },
            });

            remainingAmountCents -= settleAmountCents;
          }

          // update driver debt safely
          await tx.driver.update({
            where: { id: driverId },
            data: {
              currentDebt: {
                decrement: toDecimal(amountCents),
              },
            },
          });
        });

        return {
          success: true,
          settledAmount: toDecimal(amountCents),
          remainingDebt: driver.currentDebt - toDecimal(amountCents),
        };
      },
    );
  },
};
