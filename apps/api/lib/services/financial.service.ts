import { prisma } from "@fastship/lib";
import { TransactionType, Currency } from "@prisma/client";
import {
  runIdempotent,
  addLedger,
  withWalletLock,
  addLedgerWithCurrency,
  createMultiCurrencyTransaction,
} from "./financial.engine";
import { currencyService } from "./currency.service";
import {
  toCents as toCentsHelper,
  fromCents,
  formatCurrency,
  validatePositiveAmount,
} from "@fastship/lib/server";

// =========================

// TYPE Tx = any;
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
  // WALLET TOPUP WITH CURRENCY SUPPORT
  // =========================
  async topUpWallet(
    walletId: string,
    amount: number,
    currency: Currency = Currency.USD,
    userCurrency?: Currency,
  ) {
    // Convert incoming decimal amount to cents
    const amountCents = toCents(amount);
    validateCents(amountCents, "topup amount");

    return prisma.$transaction(async (tx) => {
      // If currency differs from wallet currency, convert and track rate
      if (currency !== Currency.USD) {
        return this.createTransactionWithCurrency(
          tx,
          walletId,
          "CREDIT",
          amount,
          currency,
          "Wallet top-up with currency conversion",
          `topup-${walletId}-${amount}-${Date.now()}`,
          userCurrency,
        );
      }

      return this.createTransaction(
        tx,
        walletId,
        "CREDIT",
        amount,
        "Wallet top-up",
        `topup-${walletId}-${amount}-${Date.now()}`,
        currency,
      );
    }, { timeout: 10000 });
  },

  // =========================
  // CORE TRANSACTION (Base Currency)
  // =========================
  async createTransaction(
    tx: Tx,
    walletId: string,
    type: TransactionType,
    amount: number,
    description: string,
    referenceId?: string,
    currency: Currency = Currency.USD,
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
            amount: amount,
            amount_cents: amountCents,
            currency: currency,
            exchangeRate: 1, // Base currency = no conversion
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
            amount: balanceChangeCents,
            type,
            category: "TRANSACTION",
            referenceId,
          });

          await tx.wallet.update({
            where: { id: walletId },
            data: {
              balance: { increment: fromCents(balanceChangeCents) },
              balance_cents: { increment: balanceChangeCents },
            },
          });
        });

        return transaction;
      },
    );
  },

  // =========================
  // MULTI-CURRENCY TRANSACTION
  // =========================
  async createTransactionWithCurrency(
    tx: Tx,
    walletId: string,
    type: TransactionType,
    amount: number,
    currency: Currency,
    description: string,
    referenceId?: string,
    displayCurrency?: Currency,
  ) {
    validatePositiveAmount(amount, "transaction amount");

    const amountCents = toCents(amount);
    validateCents(amountCents, "transaction amount");

    // Convert to base currency for storage
    const { baseCents, rate } = await currencyService.toBaseCurrency(
      amount,
      currency,
    );

  
    const idempotencyKey = `tx-multi-${walletId}-${type}-${baseCents}-${referenceId || 'no-ref'}-${Date.now()}`;

    return await runIdempotent(
      tx,
      idempotencyKey,
      "multi_currency_transaction",
      async () => {
        const transaction = await tx.transaction.create({
          data: {
            walletId,
            type,
            amount_cents: baseCents, // Stored in base currency
            amount: fromCents(baseCents),
            currency: Currency.USD,
            displayAmount: amountCents || undefined,
            displayCurrency: displayCurrency || undefined,
            exchangeRate: rate, // Save rate for audit trail
            description,
            referenceId,
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });

        const balanceChangeCents = ["CREDIT", "SETTLEMENT"].includes(type)
          ? baseCents
          : -baseCents;

        await withWalletLock(tx, walletId, async () => {
          await addLedger(tx, {
            walletId,
            amount: balanceChangeCents,
            type,
            category: `MULTI_CURRENCY_${type}`,
            referenceId,
          });

          await tx.wallet.update({
            where: { id: walletId },
            data: {
              balance: { increment: fromCents(balanceChangeCents) },
              balance_cents: { increment: balanceChangeCents },
            },
          });
        });

        return {
          ...transaction,
          originalAmount: amount,
          originalCurrency: currency,
          rateUsed: rate,
        };
      },
    );
  },

  // =========================
  // ESCROW LOCK WITH CURRENCY SUPPORT
  // =========================
  async lockEscrow(
    tx: Tx,
    walletId: string,
    amount: number,
    reason: string,
    referenceId?: string,
    currency: Currency = Currency.USD,
  ) {
    // Convert incoming decimal amount to cents
    const amountCents = toCents(amount);
    validateCents(amountCents, "escrow lock amount");

    // Convert to base currency if needed
    let baseCents = amountCents;
    let exchangeRate = 1;

    if (currency !== Currency.USD) {
      const { baseCents: converted, rate } =
        await currencyService.toBaseCurrency(amount, currency);
      baseCents = converted;
      exchangeRate = rate;
    }

    return await runIdempotent(
      tx,
      `lock-${walletId}-${baseCents}-${referenceId}`,
      "lockEscrow",
      async () => {
        const wallet = await tx.wallet.findUnique({
          where: { id: walletId },
          select: { balance: true, balance_cents: true },
        });

        if (!wallet || wallet.balance_cents < baseCents) {
          throw new Error("Insufficient balance");
        }

        return withWalletLock(tx, walletId, async () => {
          await addLedger(tx, {
            walletId,
            amount: -baseCents,
            type: "ESCROW_LOCK",
            category: "ESCROW_LOCK",
            referenceId: referenceId,
          });
          await tx.wallet.update({
            where: { id: walletId },
            data: {
              escrowBalance: { increment: fromCents(baseCents) },
              escrowBalance_cents: { increment: baseCents },
            },
          });
          return tx.transaction.create({
            data: {
              walletId,
              referenceId,
              type: "ESCROW_LOCK",
              amount: fromCents(baseCents),
              amount_cents: baseCents,
              displayAmount:fromCents(amountCents),
              displayCurrency: wallet.peferredCurrency,
              currency: Currency.USD,
              exchangeRate: fromCents(amountCents)/fromCents(baseCents),
              description: `Escrow locked: ${reason}`,
              status: "PENDING",
            },
          });
        });
      },
    );
  },

  // =========================
  // ESCROW RELEASE WITH CURRENCY SUPPORT
  // =========================
  async releaseEscrow(
    tx: Tx,
    walletId: string,
    amount: number,
    reason: string,
    referenceId?: string,
    currency: Currency = Currency.USD,
  ) {
    // Convert incoming decimal amount to cents
    const amountCents = toCents(amount);
    validateCents(amountCents, "escrow release amount");

    // Convert to base currency if needed
    let baseCents = amountCents;
    let exchangeRate = 1;

    if (currency !== Currency.USD) {
      const { baseCents: converted, rate } =
        await currencyService.toBaseCurrency(amount, currency);
      baseCents = converted;
      exchangeRate = rate;
    }

    return await runIdempotent(
      tx,
      `release-${walletId}-${baseCents}-${referenceId}`,
      "releaseEscrow",
      async () => {
        const wallet = await tx.wallet.findUnique({
          where: { id: walletId },
          select: { escrowBalance_cents: true },
        });

        if (!wallet || wallet.escrowBalance_cents < baseCents) {
          throw new Error("Insufficient escrow balance");
        }

        return withWalletLock(tx, walletId, async () => {
          await addLedger(tx, {
            walletId,
            amount: baseCents,
            type: "ESCROW_RELEASE",
            category: "ESCROW_RELEASE",
            referenceId: reason,
          });

          let wallet = await tx.wallet.update({
            where: { id: walletId },
            data: {
              escrowBalance: { decrement: fromCents(baseCents) },
              escrowBalance_cents: { decrement: baseCents },
            },
            select:{
              peferredCurrency:true
            }
          });

          return tx.transaction.create({
            data: {
              walletId,
              type: "ESCROW_RELEASE",
              amount: fromCents(baseCents),
              amount_cents: baseCents,
              currency: Currency.USD,
              exchangeRate: Number(amountCents/fromCents(baseCents)),
              displayAmount: amountCents,
              displayCurrency: wallet.peferredCurrency,
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
  // COD PAYMENT WITH CURRENCY SUPPORT
  // =========================
  async processPayment(
    tx: Tx,
    shipmentId: string,
    amount: number,
    paymentMethod: "PREPAID" | "COD",
    currency: Currency = Currency.USD,
  ) {
    // Convert incoming decimal amount to cents
    const amountCents = toCents(amount);
    validateCents(amountCents, "payment amount");

    // Convert to base currency if needed
    let baseCents = amountCents;
    let exchangeRate = 1;

    if (currency !== Currency.USD) {
      const { baseCents: converted, rate } =
        await currencyService.toBaseCurrency(amount, currency);
      baseCents = converted;
      exchangeRate = rate;
    }

    return await runIdempotent(
      tx,
      `payment-${shipmentId}-${baseCents}-${paymentMethod}`,
      "payment",
      async () => {
        const shipment = await tx.shipment.findUnique({
          where: { id: shipmentId },
          select: {
            id: true,
            actualRate_cents: true,
          },
        });

        if (!shipment) throw new Error("Shipment not found");

        // Calculate fees using integer math with cents (in base currency)
        let taxCents = 0;
        let commissionCents = Math.floor((shipment.actualRate_cents * 10) / 100); // 10% commission
        let driverPayableCents = 0;

        if (paymentMethod === "COD") {
          driverPayableCents = Math.floor(
            (shipment.actualRate_cents * 80) / 100,
          ); // 80%
        }

        return tx.payment.create({
          data: {
            shipmentId,
            amount: fromCents(baseCents),
            amount_cents: baseCents,
            currency: Currency.USD, // Always store in base currency
            exchangeRate: exchangeRate, // Track rate for audit
            tax: fromCents(taxCents),
            tax_cents:taxCents,
            commission: fromCents(commissionCents),
            commission_cents:commissionCents,
            driverPayable: fromCents(driverPayableCents),
            driverPayable_cents:driverPayableCents,
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
    currency: Currency = Currency.USD,
  ) {
    // Convert incoming decimal amount to cents
    const amountCents = toCents(amount);
    validateCents(amountCents, "settlement amount");

    //  ADD THIS SECTION - Multi-currency support
    let baseCents = amountCents;
    let exchangeRate = 1;

    if (currency !== Currency.USD) {
      const { baseCents: converted, rate } =
        await currencyService.toBaseCurrency(amount, currency);
      baseCents = converted;
      exchangeRate = rate;
    }
    //  END ADD

    return await runIdempotent(
      tx,
      `driver-settle-${driverId}-${baseCents}-${referenceId || 'no-ref'}`,
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
            amount: toDecimal(baseCents),
            amount_cents: baseCents,
            currency: Currency.USD,             //  Always store in base
            exchangeRate: exchangeRate,         //  Track exchange rate
            originalAmount: amount,              //  Track original
            originalCurrency: currency,          //  Track original currency
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
    currency: Currency = Currency.USD,
  ) {
    // Convert incoming decimal amount to cents
    const amountCents = toCents(amount);
    validateCents(amountCents, "COD debt amount");

    //  ADD THIS SECTION - Multi-currency support
    let baseCents = amountCents;
    let exchangeRate = 1;

    if (currency !== Currency.USD) {
      const { baseCents: converted, rate } =
        await currencyService.toBaseCurrency(amount, currency);
      baseCents = converted;
      exchangeRate = rate;
    }
    //  END ADD

    return await runIdempotent(
      tx,
      `cod-${shipmentId}-${driverId}-${baseCents}`,
      "codDebt",
      async () => {
        const debt = await tx.driverDebt.create({
          data: {
            driverId,
            amount: toDecimal(baseCents),
            amount_cents: baseCents,
            currency: Currency.USD,              //  Always store in base
            exchangeRate: exchangeRate,          //  Track exchange rate
            shipmentId,
            debtReason: "COD collection not completed",
            originalAmount: amount,              //  Track original
            originalCurrency: currency,          //  Track original currency
          },
        });

        await tx.driver.update({
          where: { id: driverId },
          data: {
            currentDebt: { increment: toDecimal(baseCents) },
          },
        });

        return debt;
      },
    );
  },

  // =========================
  // SHIPMENT PROCESSING (CORE FLOW)
  // =========================
  async processShipmentTransactions(
    tx: Tx,
    shipment: any,
    currency: Currency = Currency.USD,
  ) {
    // Fetch shipment details with all required relations
    const fullShipment = await tx.shipment.findUnique({
      where: { id: shipment.id },
      include: {
        customer: true,
        driver: true,
        seller: true,
        assignment: { include: { driver: { include: { wallet: true } } } },
      },
    });

    if (!fullShipment) {
      throw new Error("Shipment not found");
    }

    //  NEW SECTION - Get currency from shipment or use provided currency
    const transactionCurrency = currency || Currency.USD;

    // Convert decimal amount to cents and validate
    const amountCents = toCents(
      fullShipment.actualRate || fullShipment.expectedRate || 0
    );
    validateCents(amountCents, "shipment rate");

    //  ADD THIS SECTION - Convert shipment amount to base currency
    let baseCents = amountCents;
    let shipmentExchangeRate = 1;

    if (transactionCurrency !== Currency.USD) {
      const rateResult = await currencyService.toBaseCurrency(
        toDecimal(amountCents),
        transactionCurrency
      );
      baseCents = rateResult.baseCents;
      shipmentExchangeRate = rateResult.rate;
    }
    //  END ADD

    // Calculate fees with integer math to prevent floating point errors
    const businessFeePercent = 10; // 10%
    const platformFeePercent = 10; // 10%
    const driverFeePercent = 80; // 80%

    // Use integer division to ensure no fractional cents
    const businessFeeCents = Math.floor(
      (baseCents * businessFeePercent) / 100
    );
    const platformFeeCents = Math.floor(
      (baseCents * platformFeePercent) / 100
    );
    // Driver gets the remainder to ensure no money is lost due to rounding
    const driverFeeCents = baseCents - businessFeeCents - platformFeeCents;

    // Validation: total must equal amount
    const totalCents = businessFeeCents + platformFeeCents + driverFeeCents;
    if (totalCents !== baseCents) {
      throw new Error(
        `Fee calculation error: ${totalCents} != ${baseCents}`
      );
    }

    // Convert back to decimal for ledger entries and transactions
    const businessFee = toDecimal(businessFeeCents);
    const platformFee = toDecimal(platformFeeCents);
    const driverFee = toDecimal(driverFeeCents);
    const totalAmount = toDecimal(baseCents);

    const results: any[] = [];

    return await runIdempotent(
      tx,
      `shipment-${fullShipment.id}-${totalAmount}`,
      "shipmentProcess",
      async () => {
        try {
          // Deduct fee from seller
          await this.cutEscrow(
            tx,
            fullShipment.seller.wallet.id,
            totalAmount,
            "Shipment fee deducted",
            fullShipment.id,
          );

          const businessWallet = await tx.wallet.findUnique({
            where: { businessId: fullShipment.businessId },
          });

          if (!businessWallet) throw new Error("Business wallet not found");

          await withWalletLock(tx, businessWallet.id, async () => {
            await addLedger(tx, {
              walletId: businessWallet.id,
              amount: businessFeeCents + platformFeeCents,
              type: "CREDIT",
              category: "DELIVERY_FEE + ESCROW_RELEASE",
              referenceId: fullShipment.id,
            });

            let wallet = await tx.wallet.update({
              where: { id: businessWallet.id },
              data: {
                balance: { increment: businessFee },
                balance_cents: { increment: businessFeeCents },
                escrowBalance: { decrement: platformFee },
                escrowBalance_cents: { decrement: platformFeeCents },
              },
              select:{
                peferredCurrency:true
              }
            });

            let displayAmount = await currencyService.convert(businessFee,transactionCurrency,wallet.peferredCurrency)

            await tx.transaction.create({
              data: {
                amount: businessFee,
                amount_cents: businessFeeCents,
                currency: Currency.USD,              //  Always store in base
                description: "Delivery fee received & Escrow released",
                displayAmount,
                displayCurrency:wallet.peferredCurrency,
                exchangeRate:Number(displayAmount/businessFee),
                type: "CREDIT",
                completedAt: new Date(),
                referenceId: fullShipment.id,
                status: "COMPLETED",
                walletId: businessWallet.id,
              },
            });
          });
          results.push({ type: "business_fee", success: true });

          if (!fullShipment?.assignment?.driver?.wallet?.id)
            throw new Error("Driver wallet not found");

          await withWalletLock(
            tx,
            fullShipment?.assignment?.driver?.wallet.id,
            async () => {
              await addLedger(tx, {
                walletId: fullShipment?.assignment?.driver?.wallet.id,
                amount: driverFeeCents,
                type: "CREDIT",
                category: "DELIVERY_FEE",
                referenceId: fullShipment.id,
              });

             let wallet =  await tx.wallet.update({
                where: { id: fullShipment?.assignment?.driver?.wallet.id },
                data: {
                  balance: { increment: driverFee },
                  balance_cents: { increment: driverFeeCents },
                },
                select:{
                  peferredCurrency:true
                }
              });
              const dispAmnt =  await currencyService.convert(driverFee,transactionCurrency,wallet.peferredCurrency)
              await tx.transaction.create({
                data: {
                  amount: driverFee,
                  amount_cents: driverFeeCents,
                  currency: Currency.USD,              //  Always store in base
                 
                  description: "Delivery fee earned",
                  displayCurrency: wallet.peferredCurrency,
                  displayAmount:dispAmnt,
                  exchangeRate:Number(dispAmnt/driverFee),
                  type: "CREDIT",
                  completedAt: new Date(),
                  referenceId: fullShipment.id,
                  status: "COMPLETED",
                  walletId: fullShipment?.assignment?.driver?.wallet.id,
                },
              });
            }
          );
          results.push({ type: "driver_fee", success: true });

          await this.settleDriverPayment(
            tx,
            fullShipment.assignment?.driverId,
            driverFee,
            undefined,
            transactionCurrency  //  PASS CURRENCY
          );
          results.push({ type: "driver_settlement", success: true });

          //  UPDATE 6: Mark shipment transactions as processed
          await tx.shipment.update({
            where: { id: fullShipment.id },
            data: {
              transactionsProcessed: true,
              transactionsProcessedAt: new Date(),
              processedCurrency: transactionCurrency,  //  TRACK CURRENCY USED
            },
          });

          return {
            success: true,
            shipmentId: fullShipment.id,
            processedCurrency: transactionCurrency,   //  NEW
            amountProcessed: totalAmount,
            businessFee: businessFee,
            driverFee: driverFee,
            platformFee: platformFee,
            exchangeRate: shipmentExchangeRate,       //  NEW
            transactions: results,
            summary: {
              totalTransactions: results.length,
              successfulTransactions: results.filter(
                (r) => r.success
              ).length,
              failedTransactions: results.filter(
                (r) => !r.success
              ).length,
            },
          };
        } catch (error) {
          //  Enhanced error handling with currency context
          console.error(
            `Error processing shipment ${fullShipment.id} transactions in ${transactionCurrency}:`,
            error
          );

          // Create alert for processing failure
          await currencyService.createReconciliationAlert({
            walletId: fullShipment.customer.walletId,
            severity: "HIGH",
            type: "PROCESSING_FAILURE",
            description: `Failed to process transactions for shipment ${fullShipment.id}: ${error.message}`,
          });

          throw new Error(
            `Failed to process shipment transactions: ${error.message}`
          );
        }
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
    currency: Currency = Currency.USD,
  ) {
    // Convert incoming decimal amount to cents
    const amountCents = toCents(amount);
    validateCents(amountCents, "escrow cut amount");

    let baseCents = amountCents;
    let exchangeRate = 1;

    if (currency !== Currency.USD) {
      const { baseCents: converted, rate } =
        await currencyService.toBaseCurrency(amount, currency);
      baseCents = converted;
      exchangeRate = rate;
    }

    return await runIdempotent(
      tx,
      `cut-${walletId}-${baseCents}-${referenceId}`,
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

          let wallet = await tx.wallet.update({
            where: { id: walletId },
            data: {
              balance: { decrement: toDecimal(baseCents) },
              balance_cents: { decrement: baseCents },
              escrowBalance: { decrement: toDecimal(baseCents) },
              escrowBalance_cents: { decrement: baseCents },
            },
            select:{
              peferredCurrency:true
            }
          });

          return tx.transaction.create({
            data: {
              walletId,
              type: "ESCROW_CUT",
              amount: toDecimal(baseCents),
              amount_cents: baseCents,
              currency: Currency.USD,             //  Always store in base
              exchangeRate: fromCents(amountCents)/fromCents(baseCents),         //  Track exchange rate
              referenceId,
              displayAmount:fromCents(amountCents),  // Display in preferred currency 
              displayCurrency: wallet.peferredCurrency, // Display in preferred currency
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
  // =========================
  // FUND TRANSFER WITH CURRENCY SUPPORT
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
    currency: Currency = Currency.USD,
  ) {
    // Convert incoming decimal amount to cents
    const amountCents = toCents(amount);
    validateCents(amountCents, "transfer amount");


    // Convert to base currency if needed
    let baseCents = amountCents;
    let exchangeRate = 1;

    if (currency !== Currency.USD) {
      const { baseCents: converted, rate } =
        await currencyService.toBaseCurrency(amount, currency);
      baseCents = converted;
      exchangeRate = rate;
    }

    // Better idempotency key with timestamp to avoid collisions
    const uniqueKey = `transfer-${from}-${fromId}-${to}-${toId}-${baseCents}-${referenceId || 'no-ref'}-${Date.now()}`;

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

        if (senderWallet.balance_cents < baseCents) {
          throw new Error("Insufficient balance");
        }

        let convertedAmount = fromCents(baseCents); // to be send to receiver in their currency after conversion
        if(senderWallet.currency !== receiverWallet.currency) {
          convertedAmount = await currencyService.convert(
            fromCents(baseCents),
            Currency.USD,
            receiverWallet.currency
          );
        }

        // 🔒 LOCK SENDER WALLET FIRST
        await withWalletLock(tx, senderWallet.id, async () => {
          // 💰 DEBIT sender (ledger + balance)
          await addLedger(tx, {
            walletId: senderWallet.id,
            amount: -baseCents,
            type: "DEBIT",
            category: "TRANSFER_OUT",
            referenceId,
          });

          await tx.wallet.update({
            where: { id: senderWallet.id },
            data: {
              balance: { decrement: fromCents(baseCents) },
              balance_cents: { decrement: baseCents },
            },
          });
          await tx.transaction.create({
            data: {
              walletId: senderWallet.id,
              type: "DEBIT",
              amount: fromCents(baseCents), // save to backend calculation
              amount_cents: baseCents, // save to backend calculation
              currency: Currency.USD, // save to backend calculation
              exchangeRate: fromCents(amountCents)/fromCents(baseCents), // this could be displayed to the user
              displayAmount:fromCents(amountCents), // this could be displayed to the user
              displayCurrency: senderWallet?.currency, // this could be displayed to the user
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
              amount: baseCents,
              type: "CREDIT",
              category: "TRANSFER_IN",
              referenceId,
            });

            await tx.wallet.update({
              where: { id: receiverWallet.id },
              data: {
                balance: { increment: fromCents(baseCents) },
                balance_cents: { increment: baseCents },
              },
            });
            await tx.transaction.create({
              data: {
                walletId: receiverWallet.id,
                type: "CREDIT",
                amount: fromCents(baseCents), // save for backed calculation
                amount_cents: baseCents, // save for backed calculation
                currency: Currency.USD, // save for backed calculation
                exchangeRate: convertedAmount/fromCents(baseCents), // be displayed to user
                displayAmount: convertedAmount, // be displayed to user
                displayCurrency: receiverWallet?.currency, // be displayed to user
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
          amount: fromCents(baseCents),
          baseAmount: fromCents(baseCents),
          currency: Currency.USD,
          exchangeRate: exchangeRate,
          originalAmount: amount,
          originalCurrency: currency,
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
    currency: Currency = Currency.USD,
  ) {
    // Convert incoming decimal amount to cents
    const amountCents = toCents(amount);
    validateCents(amountCents, "COD debt settlement amount");

    //  ADD THIS SECTION - Multi-currency support
    let paymentCents = amountCents;
    let paymentRate = 1;

    if (currency !== Currency.USD) {
      const { baseCents: converted, rate } =
        await currencyService.toBaseCurrency(amount, currency);
      paymentCents = converted;
      paymentRate = rate;
    }
    //  END ADD

    return runIdempotent(
      tx,
      `cod-settle:${driverId}:${paymentCents}:${referenceId}:${Date.now()}`,
      "cod_debt_settlement",
      async () => {
        const driver = await tx.driver.findUnique({
          where: { id: driverId },
          include: { wallet: true },
        });

        if (!driver || !driver.wallet) {
          throw new Error("Driver or wallet not found");
        }

        if (!driver.currentDebt || driver.currentDebt < toDecimal(paymentCents)) {
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

          let remainingAmountCents = paymentCents;

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
