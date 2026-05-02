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
export function toDecimal(cents: number): number {
  return cents / 100;
}

/**
 * Validate that amount in cents is positive integer
 */
function validateCents(cents: number, fieldName: string = "amount"): void {
  if (!Number.isInteger(cents) || cents <= 0) {
    throw new Error(
      `${fieldName} must be a positive integer (cents). Got: ${cents}`,
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

    return prisma.$transaction(
      async (tx) => {
        // If currency differs from wallet currency, convert and track rate
        if (currency !== Currency.USD) {
          return this.createTransactionWithCurrency(
            tx,
            walletId,
            "CREDIT",
            amount,
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
      },
      { timeout: 10000 },
    );
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
    const idempotencyKey = `tx-${walletId}-${type}-${amountCents}-${referenceId || "no-ref"}-${Date.now()}`;

    return await runIdempotent(tx, idempotencyKey, "transaction", async () => {
      const transaction = await tx.transaction.create({
        data: {
          walletId,
          type,
          amount: amount,
          amount_cents: amountCents,
          currency: currency,
          displayAmount: amount,
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
          localAmount: amount,
          exchangeRate: 1,
          currency,
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
    });
  },

  // =========================
  // MULTI-CURRENCY TRANSACTION
  // =========================
  async createTransactionWithCurrency(
    tx: Tx,
    walletId: string,
    type: TransactionType,
    amount: number,
    description: string,
    referenceId?: string,
    currency?: Currency,
  ) {
    validatePositiveAmount(amount, "transaction amount");

    const amountCents = toCents(amount);
    validateCents(amountCents, "transaction amount");

    // Convert to base currency for storage
    const { baseCents, rate } = await currencyService.toBaseCurrency(
      amount,
      currency!,
    );

    const idempotencyKey = `tx-multi-${walletId}-${type}-${baseCents}-${referenceId || "no-ref"}-${Date.now()}`;

    return await runIdempotent(
      tx,
      idempotencyKey,
      "multi_currency_transaction",
      async () => {
        const balanceChangeCents = ["CREDIT", "SETTLEMENT"].includes(type)
          ? baseCents
          : -baseCents;

        let transaction = await withWalletLock(tx, walletId, async () => {
          await addLedger(tx, {
            walletId,
            amount: balanceChangeCents,
            type,
            localAmount: amount,
            exchangeRate: rate,
            currency,
            category: `WALLET TOPUP`,
            referenceId,
          });

          await tx.wallet.update({
            where: { id: walletId },
            data: {
              balance: { increment: fromCents(balanceChangeCents) },
              balance_cents: { increment: balanceChangeCents },
            },
          });

          return await tx.transaction.create({
            data: {
              walletId,
              type,
              amount_cents: baseCents, // Stored in base currency
              amount: fromCents(baseCents),
              currency: currency,
              displayAmount: amount || undefined,
              exchangeRate: rate, // Save rate for audit trail
              description,
              referenceId,
              status: "COMPLETED",
              completedAt: new Date(),
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
          select: { balance: true, balance_cents: true, currency: true },
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
            localAmount: amount,
            exchangeRate,
            currency,
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
              displayAmount: amount,
              currency: currency,
              exchangeRate: exchangeRate,
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
            localAmount: amount,
            exchangeRate,
            currency,
            referenceId: reason,
          });

          await tx.wallet.update({
            where: { id: walletId },
            data: {
              escrowBalance: { decrement: fromCents(baseCents) },
              escrowBalance_cents: { decrement: baseCents },
            },
            select: {
              currency: true,
            },
          });

          return tx.transaction.create({
            data: {
              walletId,
              type: "ESCROW_RELEASE",
              amount: fromCents(baseCents),
              amount_cents: baseCents,
              currency: currency,
              exchangeRate: exchangeRate,
              displayAmount: amount,
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
        let commissionCents = Math.floor(
          (shipment.actualRate_cents * 10) / 100,
        ); // 10% commission
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
            tax_cents: taxCents,
            commission: fromCents(commissionCents),
            commission_cents: commissionCents,
            driverPayable: fromCents(driverPayableCents),
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
      `driver-settle-${driverId}-${baseCents}-${referenceId || "no-ref"}`,
      "settlement",
      async () => {
        const driver = await tx.driver.findUnique({
          where: { id: driverId },
          include: { wallet: true },
        });

        if (!driver?.wallet) throw new Error("Driver or wallet not found");

        const earning = await prisma.earning.create({
          data: {
            driverId,
            amount: toDecimal(baseCents),
            amount_cents: baseCents,
            amountDisplay: amount,
            currency,
            exchangeRate: exchangeRate,
            createdAt: new Date(), //  Track original currency
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
            currency: Currency.USD, //  Always store in base
            exchangeRate: exchangeRate, //  Track exchange rate
            shipmentId,
            debtReason: "COD collection not completed",
            originalAmount: amount, //  Track original
            originalCurrency: currency, //  Track original currency
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
  async processShipmentTransactions(tx: Tx, shipment: any) {
    // Fetch shipment details with all required relations
    const fullShipment = await tx.shipment.findUnique({
      where: { id: shipment.id },

      include: {
        seller: {
          include: {
            wallet: {
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
                    displayAmount: true,
                    amount: true,
                    amount_cents: true,
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
                        referenceId: shipment.id,
                        type: "ESCROW_LOCK",
                      },
                      select: {
                        currency: true,
                        id: true,
                        displayAmount: true,
                        amount: true,
                        amount_cents: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!fullShipment) {
      throw new Error("Shipment not found");
    }

    //  NEW SECTION - Get currency from shipment or use provided currency

    // Convert decimal amount to cents and validate
    const amountCents =
      fullShipment.actualRate_cents || fullShipment.expectedRate_cents || 0;

    //  ADD THIS SECTION - Convert shipment amount to base currency
    let baseCents = amountCents;

    const results: any[] = [];

    return await runIdempotent(
      tx,
      `shipment-${fullShipment.id}-${baseCents}`,
      "shipmentProcess",
      async () => {
        try {
          // ========== STEP 1: DEDUCT FROM SELLER ==========
          // Seller loses the total amount (100% in USD cents)
          const sellerTransactionsLength =
            fullShipment.seller.wallet.transactions.length || 0;
          const sellerAmount =
            fullShipment.seller.wallet.transactions[
              sellerTransactionsLength - 1 || 0
            ]?.displayAmount || 0;
          const sellerAmountBase_cents =
            fullShipment.seller.wallet.transactions[
              sellerTransactionsLength - 1 || 0
            ]?.amount_cents || 0;
          const sellerAmountCurrency =
            fullShipment.seller.wallet.transactions[
              sellerTransactionsLength - 1 || 0
            ]?.currency || 0;

          await this.cutEscrow(
            tx,
            fullShipment.seller.wallet.id,
            sellerAmount,
            "Shipment fee deducted",
            fullShipment.id,
            sellerAmountCurrency,
          );

          const businessWallet = await tx.wallet.findUnique({
            where: { businessId: fullShipment.businessId },
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
                  amount_cents: true,
                },
              },
            },
          });

          if (!businessWallet) throw new Error("Business wallet not found");

          // ========== STEP 2: CREDIT BUSINESS WALLET ==========
          const walletTransactionsLength =
            businessWallet.transactions.length || 0;
          const businessAmount =
            businessWallet.transactions[walletTransactionsLength - 1 || 0]
              ?.displayAmount || 0;
          const businessAmountBase =
            businessWallet.transactions[walletTransactionsLength - 1 || 0]
              ?.amount || 0;
          const businessAmountBase_cents =
            businessWallet.transactions[walletTransactionsLength - 1 || 0]
              ?.amount_cents || 0;
          const businessAmountCurrency =
            businessWallet.transactions[walletTransactionsLength - 1 || 0]
              ?.currency || 0;
          const exchangeRate =
            businessWallet.transactions[walletTransactionsLength - 1 || 0]
              ?.exchangeRate || 1;

          const platformFeeCents = toCents(businessAmountBase)
          
          await withWalletLock(tx, businessWallet.id, async () => {
            await addLedger(tx, {
              walletId: businessWallet.id,
              amount: businessAmountBase_cents, // Store in USD cents
              localAmount: businessAmount, //  Converted to local currency
              exchangeRate: exchangeRate,
              currency: businessAmountCurrency,
              type: "CREDIT",
              category: "DELIVERY_FEE + ESCROW_RELEASE",
              referenceId: fullShipment.id,
            });

            await tx.wallet.update({
              where: { id: businessWallet.id },
              data: {
                balance: { increment: businessAmountBase }, //  Local currency decimal
                balance_cents: { increment: businessAmountBase_cents }, //  USD cents for calculations
                escrowBalance: { decrement: toDecimal(platformFeeCents) }, //  release platform form fee
                escrowBalance_cents: { decrement: platformFeeCents }, //  release platform form fee
              },
              select: {
                currency: true,
              },
            });

            // displayAmount shows what business sees in their currency (for UI only)

            await tx.transaction.create({
              data: {
                amount: businessAmountBase,
                amount_cents: businessAmountBase_cents, //  USD cents
                currency: businessWallet.currency,
                description: "Delivery fee received & Escrow released",
                displayAmount: businessAmount, // For display in their currency
                exchangeRate: exchangeRate,
                type: "CREDIT",
                completedAt: new Date(),
                referenceId: fullShipment.id,
                status: "COMPLETED",
                walletId: businessWallet.id,
              },
            });
          });
          results.push({ type: "business_fee", success: true });
          // ------------ business transaction ends ----------------------

          if (!fullShipment?.assignment?.driver?.wallet?.id)
            throw new Error("Driver wallet not found");

          // ------------ driver transaction starts ----------------------
          await withWalletLock(
            tx,
            fullShipment?.assignment?.driver?.wallet.id,
            async () => {
              let driverWallet = await tx.wallet.findUnique({
                where: { id: fullShipment?.assignment?.driver?.wallet.id },
                select: {
                  currency: true,
                  id: true,
                },
              });

              if (!driverWallet) throw new Error("Driver wallet not found");

              let driverAmount =
                Number((shipment.actualRateDisplay * 0.8).toFixed(2)) || 0; // in local-currency 

              let driverAmount_cents =
                Math.floor(
                  ((shipment.actualRate_cents || shipment.expectedRate_cents) *
                    80) /
                    100,
                ) || 0; // 80%

              let driverAmountCurrency = driverWallet.currency || Currency.USD;
              let exchangeRate = 0;

              if (shipment.currency !== driverWallet.currency) {
                const converted = await currencyService.convert(
                  driverAmount, // 80% of total as driver earning
                  shipment.currency,
                  driverWallet.currency,
                );
                exchangeRate = await currencyService.getExchangeRate(
                  shipment.currency,
                  driverWallet.currency,
                );
                driverAmount = converted;
                driverAmountCurrency = driverWallet.currency;
                driverAmount_cents = toCents(converted/exchangeRate); // Store in base currency cents for consistency
              }

              console.log({
                driverAmount,
                driverAmount_cents:toDecimal(driverAmount_cents),
                driverAmountCurrency,
                exchangeRate,
              });

              await addLedger(tx, {
                walletId: fullShipment?.assignment?.driver?.wallet.id,
                amount: driverAmount_cents, // Store in USD cents
                localAmount: driverAmount, //  Converted to local currency
                exchangeRate: exchangeRate,
                currency: driverAmountCurrency,
                type: "CREDIT",
                category: "DELIVERY_FEE",
                referenceId: fullShipment.id,
              });

              await tx.wallet.update({
                where: { id: fullShipment?.assignment?.driver?.wallet.id },
                data: {
                  balance: { increment: toDecimal(driverAmount_cents) }, //  Local currency decimal
                  balance_cents: { increment: driverAmount_cents }, //  USD cents for calculations
                },
                select: {
                  currency: true,
                },
              });

              await tx.transaction.create({
                data: {
                  amount: toDecimal(driverAmount_cents),
                  amount_cents: driverAmount_cents, //  USD cents
                  currency: driverAmountCurrency,
                  description: "Delivery fee earned",
                  displayAmount: driverAmount, // For display in their currency
                  exchangeRate: exchangeRate,
                  type: "CREDIT",
                  completedAt: new Date(),
                  referenceId: fullShipment.id,
                  status: "COMPLETED",
                  walletId: fullShipment?.assignment?.driver?.wallet.id,
                },
              });

              await this.settleDriverPayment(
                tx,
                fullShipment.assignment?.driverId,
                driverAmount,
                fullShipment.id,
                driverAmountCurrency, //  Settlement in base currency
              );
              results.push({ type: "driver_settlement", success: true });
            },
          );
          results.push({ type: "driver_fee", success: true });

          // ------------ driver transaction ends ----------------------

          return {
            success: true,
            shipmentId: fullShipment.id,
            amountProcessedUsd: toDecimal(baseCents),
            distribution: {
              sellerDeductedUsd: toDecimal(baseCents),
              businessCreditedUsd: businessAmountBase,
            },
            transactions: results,
            summary: {
              totalTransactions: results.length,
              successfulTransactions: results.filter((r) => r.success).length,
              failedTransactions: results.filter((r) => !r.success).length,
            },
          };
        } catch (error) {
          //  Enhanced error handling with currency context
          console.error(
            `Error processing shipment ${fullShipment.id} transactions in :`,
            error,
          );

          throw new Error(
            `Failed to process shipment transactions: ${error.message}`,
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
            localAmount: 0,
            exchangeRate,
            currency,
            referenceId: reason,
          });

          await tx.wallet.update({
            where: { id: walletId },
            data: {
              balance: { decrement: toDecimal(baseCents) },
              balance_cents: { decrement: baseCents },
              escrowBalance: { decrement: toDecimal(baseCents) },
              escrowBalance_cents: { decrement: baseCents },
            },
            select: {
              currency: true,
            },
          });

          return tx.transaction.create({
            data: {
              walletId,
              type: "ESCROW_CUT",
              amount: toDecimal(baseCents),
              amount_cents: baseCents, //  Always store in base
              exchangeRate,
              referenceId,
              displayAmount: fromCents(amountCents), // Display in preferred currency
              currency: currency, // Display in preferred currency
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

    // Better idempotency key with timestamp to avoid collisions
    const uniqueKey = `transfer-${from}-${fromId}-${to}-${toId}-${amountCents}-${referenceId || "no-ref"}-${Date.now()}`;

    return await runIdempotent(tx, uniqueKey, "transfer", async () => {
      let baseCents = amountCents;
      let exchangeRate = 1;

      let sender = await tx[from].findUnique({
        where: { id: fromId },
        select: {
          wallet: {
            select: {
              id: true,
              currency: true,
            },
          },
        },
      });

      // Convert to base currency if needed
      if (sender.wallet.currency !== Currency.USD) {
        const { baseCents: converted, rate } =
          await currencyService.toBaseCurrency(amount, sender.wallet.currency);
        baseCents = converted;
        exchangeRate = rate;
      }

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
      if (senderWallet.currency !== Currency.USD) {
        convertedAmount = await currencyService.convert(
          fromCents(baseCents),
          Currency.USD,
          sender?.wallet?.currency,
        );
      }

      // 🔒 LOCK SENDER WALLET FIRST
      await withWalletLock(tx, senderWallet.id, async () => {
        // 💰 DEBIT sender (ledger + balance)
        await addLedger(tx, {
          walletId: senderWallet.id,
          amount: -baseCents,
          type: "DEBIT",
          localAmount: -convertedAmount, // store the original amount in sender's currency for clarity
          exchangeRate,
          currency,
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
            currency: senderWallet.currency, // save to backend calculation
            exchangeRate: exchangeRate, // this could be displayed to the user
            displayAmount: convertedAmount, // this could be displayed to the user
            referenceId,
            description: description,
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });

        let convertedAmountForReceiver = fromCents(baseCents);
        if (receiverWallet.currency !== Currency.USD) {
          convertedAmountForReceiver = await currencyService.convert(
            fromCents(baseCents),
            Currency.USD,
            receiverWallet.currency,
          );
        }

        const exchangeRateForRecieverConverts =
          await currencyService.getExchangeRate("USD", receiverWallet.currency);

        // 🔒 LOCK RECEIVER WALLET
        await withWalletLock(tx, receiverWallet.id, async () => {
          // 💰 CREDIT receiver (ledger + balance)
          await addLedger(tx, {
            walletId: receiverWallet.id,
            amount: baseCents,
            type: "CREDIT",
            localAmount: convertedAmountForReceiver,
            currency: receiverWallet.currency,
            exchangeRate: exchangeRateForRecieverConverts,
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
              currency: receiverWallet.currency, // save for backed calculation
              exchangeRate: exchangeRateForRecieverConverts, // be stored in local currency of  user
              displayAmount: convertedAmountForReceiver, // be stored in local currency of  user
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
    });
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

        if (
          !driver.currentDebt ||
          driver.currentDebt < toDecimal(paymentCents)
        ) {
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
