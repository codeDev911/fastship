export const runIdempotent = async (tx: any, key: string, scope: string, fn: () => Promise<any>) => {
  const existing = await tx.idempotencyKey.findUnique({ where: { key } });

  if (existing?.response) return existing.response;

  const result = await fn();

  await tx.idempotencyKey.upsert({
    where: { key },
    update: { response: result },
    create: { key, scope, response: result },
  });

  return result;
};

export const withWalletLock = async (tx: any, walletId: string, fn: () => Promise<any>) => {
  await tx.$executeRaw`SELECT id FROM "Wallet" WHERE id = ${walletId} FOR UPDATE`;
  return fn();
};

export const addLedger = async (tx: any, data: any) => {
  
  const last = await tx.ledgerEntry.findFirst({
    where: { walletId: data.walletId },
    orderBy: { createdAt: "desc" },
  });

  const balanceAfter = (last?.balanceAfter || 0) + (data.amount);

  await tx.ledgerEntry.create({
    data: { ...data, balanceAfter },
  });
};

import { prisma } from "@/lib/prisma";

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

      // ⚠️ FIX mismatch
      withWalletLock(tx, walletId, async () => {
         await addLedger(tx, {
              walletId: walletId,
              amount: diff,
              type: "RECONCILIATION_ADJUSTMENT",
              category: "RECONCILIATION",
              referenceId: "RECONCILIATION-"+Date.now(),
            });
        await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: ledgerBalance,
        },
      });

      await tx.transaction.create({
        data:{
          walletId,
          amount:diff,
          type:"SETTLEMENT",
          description:"Auto-correction from reconciliation process",
          referenceId:"RECONCILIATION-"+Date.now(),
        }
      })
      })

      await tx.reconciliationLog.create({
        data: {
          walletId,
          expected: ledgerBalance,
          actual: actualBalance,
          difference: diff,
          status: "FIXED",
          message: "Balance auto-corrected from ledger",
        },
      });

      return {
        status: "FIXED",
        old: actualBalance,
        new: ledgerBalance,
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
};

// Note: Apply this laterly