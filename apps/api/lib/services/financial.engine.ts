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
  
  if (typeof data.amount !== 'number' || !Number.isInteger(data.amount)) {
    throw new Error('Amount must be an integer (cents/paise)');
  }

  // Use raw SQL to atomically insert and calculate balance in one operation
  const result = await tx.$queryRaw`
    INSERT INTO "LedgerEntry" 
      ("walletId", "amount", "type", "category", "referenceId", "createdAt", "updatedAt")
    VALUES 
      (${data.walletId}, ${data.amount}, ${data.type}, ${data.category}, ${data.referenceId}, NOW(), NOW())
    RETURNING 
      *,
      (SELECT COALESCE(SUM("amount"), 0) FROM "LedgerEntry" WHERE "walletId" = ${data.walletId}) as "balanceAfter"
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

      const ledgerSumResult = await tx.ledgerEntry.aggregate({
        where: { walletId },
        _sum: { amount: true },
      });

      const ledgerBalance = ledgerSumResult._sum.amount || 0;
      const actualBalance = wallet.balance;
      const diff = ledgerBalance - actualBalance;

      // ✅ No issue
      if (diff === 0) {
        await tx.reconciliationLog.create({
          data: {
            walletId,
            expected: ledgerBalance,
            actual: actualBalance,
            difference: 0,
            status: "OK",
          },
        });

        return { status: "OK" };
      }

      // 🚨 MISMATCH DETECTED - ALERT, DO NOT AUTO-FIX
      // Auto-correcting financial data is dangerous. Require manual investigation.
      await tx.reconciliationLog.create({
        data: {
          walletId,
          expected: ledgerBalance,
          actual: actualBalance,
          difference: diff,
          status: "MISMATCH_ALERT",
          message: `CRITICAL MISMATCH: Ledger=${ledgerBalance}, Wallet=${actualBalance}, Diff=${diff}. Manual investigation required. DO NOT AUTO-FIX.`,
        },
      });

      return {
        status: "MISMATCH_DETECTED",
        ledgerBalance,
        walletBalance: actualBalance,
        discrepancy: diff,
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
            actual: 0,
            difference: 0,
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
    // bankBalance must be in cents/paise (integer)
    if (!Number.isInteger(bankBalance)) {
      throw new Error("Bank balance must be an integer (cents/paise)");
    }

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) throw new Error("Wallet not found");

      // Calculate ledger balance from all entries
      const ledgerSumResult = await tx.ledgerEntry.aggregate({
        where: { walletId },
        _sum: { amount: true },
      });

      const ledgerBalance = ledgerSumResult._sum.amount || 0;
      const diff = ledgerBalance - bankBalance;

      // If balanced, just log it
      if (diff === 0) {
        await tx.reconciliationLog.create({
          data: {
            walletId,
            expected: bankBalance,
            actual: ledgerBalance,
            difference: 0,
            status: "RECONCILED",
            message: "Bank and ledger are perfectly balanced",
          },
        });

        return { status: "RECONCILED", bankBalance, ledgerBalance };
      }

      // MISMATCH: Log it with critical severity
      const severity = Math.abs(diff) > 50000 ? "CRITICAL" : "HIGH";
      
      await tx.reconciliationLog.create({
        data: {
          walletId,
          expected: bankBalance,
          actual: ledgerBalance,
          difference: diff,
          status: "BANK_MISMATCH",
          message: `BANK MISMATCH [${severity}]: Bank reports ${bankBalance}, ledger shows ${ledgerBalance}. Discrepancy: ${diff}. Requires immediate investigation.`,
        },
      });

      // Throw error to prevent further operations until resolved
      throw new Error(
        `CRITICAL: Bank reconciliation failed for wallet ${walletId}. Bank: ${bankBalance}, Ledger: ${ledgerBalance}, Diff: ${diff}. Manual investigation required.`
      );
    });
  },
};