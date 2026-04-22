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

export const runIdempotent = async (tx: any, key: string, scope: string, fn: () => Promise<any>) => {
  // Generate idempotency key with timestamp and random nonce for uniqueness
  const uniqueKey = `${key}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Check if we already processed this request (within 24 hours)
  const existing = await tx.idempotencyKey.findUnique({ 
    where: { key: uniqueKey } 
  });

  if (existing?.response) {
    // Return cached response if within TTL
    const ageMs = Date.now() - new Date(existing.createdAt).getTime();
    const ttlMs = 24 * 60 * 60 * 1000; // 24 hours
    
    if (ageMs < ttlMs) {
      return existing.response;
    }
  }

  // Execute the function
  const result = await fn();

  // Store the idempotency record
  await tx.idempotencyKey.upsert({
    where: { key: uniqueKey },
    update: { response: result, updatedAt: new Date() },
    create: { 
      key: uniqueKey, 
      scope, 
      response: result,
      createdAt: new Date(),
      updatedAt: new Date()
    },
  });

  return result;
};

export const withWalletLock = async (tx: any, walletId: string, fn: () => Promise<any>) => {
  // Use parameterized query to prevent SQL injection
  await tx.$queryRaw`SELECT id FROM "Wallet" WHERE id = ${walletId} FOR UPDATE`;
  return fn();
};

export const addLedger = async (tx: any, data: any) => {
  // CRITICAL: Use database SUM to calculate balance, NOT application logic
  // This prevents race conditions and floating-point errors
  // All amounts are stored and calculated in cents (integers) for accuracy
  
  // Validate amount is integer cents
  if (typeof data.amount !== 'number' || !Number.isInteger(data.amount)) {
    throw new Error(
      `Ledger amount must be an integer (cents/paise). Got: ${data.amount}. ` +
      `If passing decimal, use toCents() first.`
    );
  }

  // Calculate decimal value from cents
  const amountDecimal = toDecimal(data.amount);

  // Use raw SQL to atomically insert and calculate balance in one operation
  // Save both decimal and cents values for dual-field strategy
  const result = await tx.$queryRaw`
    INSERT INTO "LedgerEntry" 
      ("walletId", "amount", "amount_cents", "type", "category", "referenceId", "createdAt", "updatedAt")
    VALUES 
      (${data.walletId}, ${amountDecimal}, ${data.amount}, ${data.type}, ${data.category}, ${data.referenceId}, NOW(), NOW())
    RETURNING 
      *,
      (SELECT COALESCE(SUM("amount_cents"), 0) FROM "LedgerEntry" WHERE "walletId" = ${data.walletId}) as "balanceAfterCents"
  `;
  
  return result[0];
};

import { prisma } from "@fastship/lib";

export const reconciliationService = {

  async reconcileWallet(walletId: string) {
    return prisma.$transaction(async (tx) => {

      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) throw new Error("Wallet not found");

      // Calculate ledger balance in cents (integer arithmetic)
      const ledgerSumResult = await tx.ledgerEntry.aggregate({
        where: { walletId },
        _sum: { amount: true },
      });

      // Ledger balance is in cents (integers)
      const ledgerBalanceCents = ledgerSumResult._sum.amount || 0;
      // Wallet balance_cents is the source of truth for reconciliation
      const walletBalanceCents = wallet.balance_cents || 0;
      const diffCents = ledgerBalanceCents - walletBalanceCents;
      
      // ✅ No issue - balances match perfectly
      if (diffCents === 0) {
        await tx.reconciliationLog.create({
          data: {
            walletId,
            expected: toDecimal(ledgerBalanceCents),
            expected_cents: ledgerBalanceCents,
            actual: toDecimal(walletBalanceCents),
            actual_cents: walletBalanceCents,
            difference: 0,
            difference_cents: 0,
            status: "OK",
          },
        });

        return { status: "OK", ledgerBalanceCents, walletBalanceCents };
      }

      // 🚨 MISMATCH DETECTED - ALERT, DO NOT AUTO-FIX
      // Auto-correcting financial data is dangerous. Require manual investigation.
      await tx.reconciliationLog.create({
        data: {
          walletId,
          expected: toDecimal(ledgerBalanceCents),
          expected_cents: ledgerBalanceCents,
          actual: toDecimal(walletBalanceCents),
          actual_cents: walletBalanceCents,
          difference: toDecimal(diffCents),
          difference_cents: diffCents,
          status: "MISMATCH_ALERT",
          message: `CRITICAL MISMATCH: Ledger=${ledgerBalanceCents} cents (${toDecimal(ledgerBalanceCents)}), Wallet=${walletBalanceCents} cents (${toDecimal(walletBalanceCents)}), Diff=${diffCents} cents (${toDecimal(diffCents)}). Manual investigation required. DO NOT AUTO-FIX.`,
        },
      });

      return {
        status: "MISMATCH_DETECTED",
        ledgerBalanceCents,
        ledgerBalance: toDecimal(ledgerBalanceCents),
        walletBalanceCents,
        walletBalance: toDecimal(walletBalanceCents),
        discrepancyCents: diffCents,
        discrepancy: toDecimal(diffCents),
        action: "ALERT_CREATED - Manual investigation required by finance team",
      };
    },{timeout:10000});
  },

//   // 🔥 Run for ALL wallets
  async reconcileAllWallets() {
    const wallets = await prisma.wallet.findMany({
      select: { id: true },
    });

    const results = [];

    for (const wallet of wallets) {
      try {
        const res = await this.reconcileWallet(wallet.id);
        results.push({ walletId: wallet.id, ...res });
      } catch (err: any) {
        await prisma.reconciliationLog.create({
          data: {
            walletId: wallet.id,
            expected: 0,
            expected_cents: 0,
            actual: 0,
            actual_cents: 0,
            difference: 0,
            difference_cents: 0,
            status: "ERROR",
            message: err.message,
          },
        });

        results.push({
          walletId: wallet.id,
          status: "ERROR",
          error: err.message,
        });
      }
    }

    return results;
  },

  // =========================
  // BANK RECONCILIATION
  // =========================
  async reconcileWithBank(walletId: string, bankBalance: number) {
    // bankBalance can be decimal or cents
    // If decimal (has decimals like 999.99), convert to cents
    // If already in cents (integer), use as-is
    let bankBalanceCents: number;
    
    if (!Number.isInteger(bankBalance)) {
      // Decimal input - convert to cents
      bankBalanceCents = toCents(bankBalance);
    } else {
      // Already in cents
      bankBalanceCents = bankBalance;
    }

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) throw new Error("Wallet not found");

      // Calculate ledger balance from all entries (in cents)
      const ledgerSumResult = await tx.ledgerEntry.aggregate({
        where: { walletId },
        _sum: { amount: true },
      });

      const ledgerBalanceCents = ledgerSumResult._sum.amount || 0;
      const diffCents = ledgerBalanceCents - bankBalanceCents;

      // If balanced, just log it
      if (diffCents === 0) {
        await tx.reconciliationLog.create({
          data: {
            walletId,
            expected: toDecimal(bankBalanceCents),
            expected_cents: bankBalanceCents,
            actual: toDecimal(ledgerBalanceCents),
            actual_cents: ledgerBalanceCents,
            difference: 0,
            difference_cents: 0,
            status: "RECONCILED",
            message: "Bank and ledger are perfectly balanced",
          },
        });

        return {
          status: "RECONCILED",
          bankBalanceCents,
          bankBalance: toDecimal(bankBalanceCents),
          ledgerBalanceCents,
          ledgerBalance: toDecimal(ledgerBalanceCents),
        };
      }

      // MISMATCH: Log it with critical severity
      const severity = Math.abs(diffCents) > 5000000 ? "CRITICAL" : "HIGH"; // 50000 rupees = 5000000 paise
      
      await tx.reconciliationLog.create({
        data: {
          walletId,
          expected: toDecimal(bankBalanceCents),
          expected_cents: bankBalanceCents,
          actual: toDecimal(ledgerBalanceCents),
          actual_cents: ledgerBalanceCents,
          difference: toDecimal(diffCents),
          difference_cents: diffCents,
          status: "BANK_MISMATCH",
          message: `BANK MISMATCH [${severity}]: Bank reports ${bankBalanceCents} cents (${toDecimal(bankBalanceCents)}), ledger shows ${ledgerBalanceCents} cents (${toDecimal(ledgerBalanceCents)}). Discrepancy: ${diffCents} cents (${toDecimal(diffCents)}). Requires immediate investigation.`,
        },
      });

      // Throw error to prevent further operations until resolved
      throw new Error(
        `CRITICAL: Bank reconciliation failed for wallet ${walletId}. Bank: ${bankBalanceCents} cents (${toDecimal(bankBalanceCents)}), Ledger: ${ledgerBalanceCents} cents (${toDecimal(ledgerBalanceCents)}), Diff: ${diffCents} cents (${toDecimal(diffCents)}). Manual investigation required.`
      );
    });
  },
};