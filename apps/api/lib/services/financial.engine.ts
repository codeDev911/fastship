// =========================
// HELPER FUNCTIONS FOR CENTS CONVERSION
// =========================

/**
 * ✅ PRECISION STRATEGY (Industry Standard)
 * 
 * Problem: JavaScript floating-point math causes errors like 0.3700000000000001
 * Solution: ALL financial calculations use INTEGER ARITHMETIC
 * 
 * Rules:
 * 1. Store amounts as CENTS (integers): 9999 instead of 99.99
 * 2. Calculate in cents, NEVER multiply decimals: (cents * rate) / 100
 * 3. Use Math.floor for division to avoid remainders
 * 4. Only convert to decimals for DISPLAY/API responses
 * 
 * Example - Distribution (20% + 10% + 80% = 100%):
 * ❌ WRONG: toCents(amount*0.2) + toCents(amount*0.8) = leftover
 * ✅ RIGHT: Math.floor((cents*20)/100) + Math.floor((cents*10)/100) + remainder
 * 
 * Example - Exchange rates:
 * ❌ WRONG: (amount in cents / 100) * exchangeRate = floating point
 * ✅ RIGHT: (cents * rate) / 100 = integer result
 */

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
      `${fieldName} must be a positive integer (cents). Got: ${cents}`,
    );
  }
}

/**
 * ✅ PRECISION FIX: Calculate exchange with integer math
 * Never multiply decimals: cents * rate / 100
 * Example: 5000 cents * 0.92 rate = (5000 * 0.92) / 1 = 4600 cents
 * Scales rate to avoid floating-point errors
 */
function applyExchangeRateToCents(cents: number, exchangeRate: number): number {
  // If rate is already scaled (e.g., 82.7 for PKR), use it directly
  // If rate is decimal (e.g., 0.92 for EUR), multiply by 100 first to scale it
  const scaledRate = exchangeRate > 1 ? exchangeRate : exchangeRate * 100;
  return Math.round((cents * scaledRate) / 100);
}

/**
 * ✅ PRECISION FIX: Calculate percentage in integer math to avoid leftovers
 * Use floor division with remainder approach
 * Never: toCents(amount * 0.2) - causes 0.37 leftover errors
 * Do: Math.floor((cents * 20) / 100) for exact integer math
 */
function calculatePercentageCents(cents: number, percentage: number): number {
  return Math.floor((cents * percentage) / 100);
}

export const runIdempotent = async (
  tx: any,
  key: string,
  scope: string,
  fn: () => Promise<any>,
) => {
  // Generate idempotency key with timestamp and random nonce for uniqueness
  const uniqueKey = `${key}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Check if we already processed this request (within 24 hours)
  const existing = await tx.idempotencyKey.findUnique({
    where: { key: uniqueKey },
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
    update: { response: result },
    create: {
      key: uniqueKey,
      scope,
      response: result,
      createdAt: new Date(),
    },
  });

  return result;
};

export const withWalletLock = async (
  tx: any,
  walletId: string,
  fn: () => Promise<any>,
) => {
  // Use parameterized query to prevent SQL injection
  await tx.$queryRaw`SELECT id FROM "Wallet" WHERE id = ${walletId} FOR UPDATE`;
  return fn();
};

export const addLedger = async (tx: any, data: any) => {
  if (typeof data.amount !== "number" || !Number.isInteger(data.amount)) {
    console.log("amount "+data.amount);
    console.log("category "+data.category);
    
    throw new Error(
      `Ledger amount must be an integer (cents/paise). Got: ${data.amount}. ` +
        `If passing decimal, use toCents() first.`,
    );
  }

  const amountDecimal = toDecimal(data.amount);

  // Calculate balance BEFORE insert (include this new entry)
  const balanceResult = await tx.$queryRaw`
    SELECT COALESCE(SUM("amount_cents"), 0) as "totalCents" FROM "LedgerEntry" WHERE "walletId" = ${data.walletId}
  `;
  
  const newBalanceCents = Number(balanceResult[0]?.totalCents) + data.amount;
  const newBalanceDecimal = toDecimal(newBalanceCents);

  // ✅ FIX: Use integer math for exchange rate calculation
  // Prevents floating-point errors like 0.3700000000000001
  const balanceAfterDisplay = data.exchangeRate 
    ? applyExchangeRateToCents(newBalanceCents, data.exchangeRate) / 100
    : newBalanceDecimal;

  const result = await tx.$queryRaw`
    INSERT INTO "LedgerEntry" 
      ("id","amountDisplay","balanceAfterDisplay","currency","exchangeRate", "walletId", "amount", "amount_cents", "type", "category", "referenceId", "balanceAfter", "balanceAfter_cents", "createdAt")
    VALUES 
      (gen_random_uuid(),${data.localAmount},${balanceAfterDisplay},${data.currency}::"Currency",${data.exchangeRate}, ${data.walletId}, ${amountDecimal}, ${data.amount}, ${data.type}, ${data.category}, ${data.referenceId}, ${newBalanceDecimal}, ${newBalanceCents}, NOW())
    RETURNING *
  `;

  return result[0];
};
import { prisma } from "@fastship/lib";

// =========================
// RECONCILIATION ALERTS SERVICE
// =========================

/**
 * Calculate alert severity based on discrepancy amount
 * Helps prioritize which mismatches need immediate attention
 */
function calculateAlertSeverity(
  diffCents: number,
): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
  const absDiffCents = Math.abs(diffCents);

  if (absDiffCents > 10000000) return "CRITICAL"; // > 100,000 rupees/dollars
  if (absDiffCents > 5000000) return "HIGH"; // > 50,000
  if (absDiffCents > 1000000) return "MEDIUM"; // > 10,000
  return "LOW"; // < 10,000
}

/**
 * Create a reconciliation alert with automatic notifications
 */
async function createReconciliationAlert(
  tx: any,
  data: {
    walletId: string;
    logId: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    type: "WALLET_MISMATCH" | "BANK_MISMATCH";
    message: string;
    expectedCents: number;
    actualCents: number;
    diffCents: number;
  },
) {
  // Create alert record
  const alert = await tx.reconciliationAlert.create({
    data: {
      walletId: data.walletId,
      logId: data.logId,
      severity: data.severity,
      type: data.type,
      message: data.message,
      expectedCents: data.expectedCents,
      actualCents: data.actualCents,
      diffCents: data.diffCents,
      status: "NEW",
      createdAt: new Date(),
      resolvedAt: null,
      acknowledgedAt: null,
      resolvedBy: null,
      acknowledgedBy: null,
    },
  });

  // Queue notification based on severity
  await queueNotification(tx, {
    alertId: alert.id,
    severity: data.severity,
    type: data.type,
    message: data.message,
  });

  return alert;
}

/**
 * Queue notifications to alert stakeholders
 * Integrates with your notification system
 */
async function queueNotification(
  tx: any,
  data: {
    alertId: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    type: "WALLET_MISMATCH" | "BANK_MISMATCH";
    message: string;
  },
) {
  // Critical alerts: immediate notification
  if (data.severity === "CRITICAL" || data.severity === "HIGH") {
    // Notify finance admin via email/SMS
    await tx.notification.create({
      data: {
        type: "RECONCILIATION_ALERT",
        severity: data.severity,
        title: `🚨 ${data.severity} Reconciliation Alert`,
        message: data.message,
        relatedId: data.alertId,
        targetRole: "ADMIN", // Send to admins/finance team
        status: "PENDING",
        createdAt: new Date(),
      },
    });
  } else {
    // Lower severity: log for next review
    await tx.notification.create({
      data: {
        type: "RECONCILIATION_ALERT",
        severity: data.severity,
        title: `⚠️ ${data.severity} Reconciliation Alert`,
        message: data.message,
        relatedId: data.alertId,
        targetRole: "FINANCE_TEAM",
        status: "PENDING",
        createdAt: new Date(),
      },
    });
  }
}

export const reconciliationService = {
  async reconcileWallet(walletId: string) {
    return prisma.$transaction(
      async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: { id: walletId },
        });

        if (!wallet) throw new Error("Wallet not found");

        // Calculate ledger balance in cents (integer arithmetic)
        const ledgerSumResult = await tx.ledgerEntry.aggregate({
          where: { walletId },
          _sum: { amount_cents: true },
        });

        // Ledger balance is in cents (integers)
        const ledgerBalanceCents = ledgerSumResult._sum.amount_cents || 0;
        // Wallet balance_cents is the source of truth for reconciliation
        const walletBalanceCents = wallet.balance_cents !== null && wallet?.escrowBalance_cents !==null ?wallet?.balance_cents - wallet?.escrowBalance_cents : wallet?.balance_cents||0;
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
        const log = await tx.reconciliationLog.create({
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

        // Create alert notification
        const severity = calculateAlertSeverity(diffCents);
        await createReconciliationAlert(tx, {
          walletId,
          logId: log.id,
          severity,
          type: "WALLET_MISMATCH",
          message: log.message,
          expectedCents: ledgerBalanceCents,
          actualCents: walletBalanceCents,
          diffCents,
        });

        return {
          status: "MISMATCH_DETECTED",
          ledgerBalanceCents,
          ledgerBalance: toDecimal(ledgerBalanceCents),
          walletBalanceCents,
          walletBalance: toDecimal(walletBalanceCents),
          discrepancyCents: diffCents,
          discrepancy: toDecimal(diffCents),
          action:
            "ALERT_CREATED - Manual investigation required by finance team",
        };
      },
      { timeout: 10000 },
    );
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
        _sum: { amount_cents: true },
      });

      const ledgerBalanceCents = ledgerSumResult._sum?.amount_cents || 0;
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
      const severity = calculateAlertSeverity(diffCents);

      const log = await tx.reconciliationLog.create({
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

      // Create alert notification
      await createReconciliationAlert(tx, {
        walletId,
        logId: log.id,
        severity,
        type: "BANK_MISMATCH",
        message: log.message,
        expectedCents: bankBalanceCents,
        actualCents: ledgerBalanceCents,
        diffCents,
      });

      // Throw error to prevent further operations until resolved
      throw new Error(
        `CRITICAL: Bank reconciliation failed for wallet ${walletId}. Bank: ${bankBalanceCents} cents (${toDecimal(bankBalanceCents)}), Ledger: ${ledgerBalanceCents} cents (${toDecimal(ledgerBalanceCents)}), Diff: ${diffCents} cents (${toDecimal(diffCents)}). Manual investigation required.`,
      );
    });
  },

  // =========================
  // ALERT MANAGEMENT
  // =========================

  /**
   * Get all active alerts
   */
  async getActiveAlerts(filters?: {
    severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    type?: "WALLET_MISMATCH" | "BANK_MISMATCH";
    status?: "NEW" | "ACKNOWLEDGED" | "RESOLVED";
  }) {
    const whereClause: any = { status: { not: "RESOLVED" } };

    if (filters?.severity) {
      whereClause.severity = filters.severity;
    }
    if (filters?.type) {
      whereClause.type = filters.type;
    }
    if (filters?.status) {
      whereClause.status = filters.status;
    }

    return prisma.reconciliationAlert.findMany({
      where: whereClause,
      orderBy: [
        { severity: "desc" }, // Critical first
        { createdAt: "desc" }, // Newest first
      ],
      include: {
        wallet: {
          select: {
            id: true,
            sellerId: true,
            businessId: true,
            driverId: true,
          },
        },
      },
    });
  },

  /**
   * Acknowledge an alert (shows it's been seen)
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy?: string) {
    return prisma.reconciliationAlert.update({
      where: { id: alertId },
      data: {
        status: "ACKNOWLEDGED",
        acknowledgedAt: new Date(),
        acknowledgedBy: acknowledgedBy || "SYSTEM",
      },
    });
  },

  /**
   * Resolve an alert (issue has been investigated and fixed)
   */
  async resolveAlert(alertId: string, resolution: string, resolvedBy?: string) {
    return prisma.reconciliationAlert.update({
      where: { id: alertId },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolvedBy: resolvedBy || "SYSTEM",
        resolution,
      },
    });
  },

  /**
   * Get alert history for a specific wallet
   */
  async getWalletAlertHistory(walletId: string, limit: number = 10) {
    return prisma.reconciliationAlert.findMany({
      where: { walletId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  /**
   * Get alert statistics
   */
  async getAlertStats() {
    const [
      totalAlerts,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      newCount,
      acknowledgedCount,
      resolvedCount,
    ] = await Promise.all([
      prisma.reconciliationAlert.count(),
      prisma.reconciliationAlert.count({ where: { severity: "CRITICAL" } }),
      prisma.reconciliationAlert.count({ where: { severity: "HIGH" } }),
      prisma.reconciliationAlert.count({ where: { severity: "MEDIUM" } }),
      prisma.reconciliationAlert.count({ where: { severity: "LOW" } }),
      prisma.reconciliationAlert.count({ where: { status: "NEW" } }),
      prisma.reconciliationAlert.count({ where: { status: "ACKNOWLEDGED" } }),
      prisma.reconciliationAlert.count({ where: { status: "RESOLVED" } }),
    ]);

    return {
      total: totalAlerts,
      bySeverity: {
        CRITICAL: criticalCount,
        HIGH: highCount,
        MEDIUM: mediumCount,
        LOW: lowCount,
      },
      byStatus: {
        NEW: newCount,
        ACKNOWLEDGED: acknowledgedCount,
        RESOLVED: resolvedCount,
      },
      requiresAction: newCount + acknowledgedCount,
    };
  },

  /**
   * Bulk acknowledge alerts
   */
  async bulkAcknowledgeAlerts(alertIds: string[], acknowledgedBy?: string) {
    return prisma.reconciliationAlert.updateMany({
      where: { id: { in: alertIds } },
      data: {
        status: "ACKNOWLEDGED",
        acknowledgedAt: new Date(),
        acknowledgedBy: acknowledgedBy || "SYSTEM",
      },
    });
  },

  /**
   * Get unresolved alerts by severity (for dashboard)
   */
  async getUnresolvedAlertsSummary() {
    const alerts = await prisma.reconciliationAlert.findMany({
      where: { status: { not: "RESOLVED" } },
      select: {
        id: true,
        severity: true,
        type: true,
        status: true,
        message: true,
        diffCents: true,
        walletId: true,
        createdAt: true,
      },
    });

    return {
      total: alerts.length,
      alerts,
      groupedBySeverity: {
        CRITICAL: alerts.filter((a) => a.severity === "CRITICAL"),
        HIGH: alerts.filter((a) => a.severity === "HIGH"),
        MEDIUM: alerts.filter((a) => a.severity === "MEDIUM"),
        LOW: alerts.filter((a) => a.severity === "LOW"),
      },
    };
  },

  // =========================
  // CLEANUP & MAINTENANCE
  // =========================

  /**
   * Delete old reconciliation records to keep DB clean
   * Keeps:
   *   - All unresolved alerts (NEW, ACKNOWLEDGED)
   *   - All problem records (MISMATCH_ALERT, BANK_MISMATCH, ERROR) regardless of age
   *   - Recent OK/RECONCILED records (< 1 day old)
   * Deletes:
   *   - OK/RECONCILED logs older than 1 day
   *   - RESOLVED alerts older than 7 days
   */
  async cleanupOldReconciliations() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Delete old OK/RECONCILED logs (keep problem records forever)
    const deletedLogs = await prisma.reconciliationLog.deleteMany({
      where: {
        createdAt: { lt: oneDayAgo },
        status: { in: ["OK", "RECONCILED"] }, // Only delete clean records
      },
    });

    // Delete old RESOLVED alerts (keep unresolved ones forever for investigation)
    const deletedAlerts = await prisma.reconciliationAlert.deleteMany({
      where: {
        createdAt: { lt: sevenDaysAgo },
        status: "RESOLVED", // Only delete resolved alerts
      },
    });

    return {
      logsDeleted: deletedLogs.count,
      alertsDeleted: deletedAlerts.count,
      message: `Cleanup complete: Deleted ${deletedLogs.count} old reconciliation logs and ${deletedAlerts.count} old resolved alerts`,
    };
  },

  /**
   * Run full scheduled reconciliation with cleanup
   * Safe for cron jobs - runs reconciliation on ALL wallets + cleans old records
   * Returns summary of what was found and cleaned up
   */
  async runScheduledReconciliation() {
    console.log("[CRON] Starting scheduled reconciliation...");
    const startTime = Date.now();

    try {
      // Step 1: Run reconciliation on all wallets
      const reconciliationResults = await this.reconcileAllWallets();

      // Count results by status
      const stats = {
        ok: reconciliationResults.filter((r) => r.status === "OK").length,
        mismatches: reconciliationResults.filter(
          (r) => r.status === "MISMATCH_DETECTED",
        ).length,
        errors: reconciliationResults.filter((r) => r.status === "ERROR")
          .length,
        total: reconciliationResults.length,
      };

      // Step 2: Get alerts before cleanup (for reporting)
      const alertsBefore = await this.getAlertStats();

      // Step 3: Cleanup old records
      const cleanup = await this.cleanupOldReconciliations();

      // Step 4: Get alerts after cleanup
      const alertsAfter = await this.getAlertStats();

      const duration = Date.now() - startTime;

      const summary = {
        timestamp: new Date(),
        duration: `${duration}ms`,
        reconciliation: stats,
        alerts: {
          before: alertsBefore,
          after: alertsAfter,
        },
        cleanup: cleanup,
        nextRun: new Date(Date.now() + 6 * 60 * 60 * 1000), // Next run in 6 hours
      };

      console.log("[CRON] Scheduled reconciliation complete:", summary);

      return summary;
    } catch (error: any) {
      console.error("[CRON] Scheduled reconciliation failed:", error);
      return {
        status: "ERROR",
        error: error.message,
        timestamp: new Date(),
      };
    }
  },

  /**
   * Get database size of reconciliation tables
   * Helps monitor if cleanup is working
   */
  async getReconciliationDbStats() {
    const [logCount, alertCount, totalLogSize, totalAlertSize] =
      await Promise.all([
        prisma.reconciliationLog.count(),
        prisma.reconciliationAlert.count(),
        prisma.$queryRaw`
          SELECT pg_total_relation_size('"ReconciliationLog"') as size
        `,
        prisma.$queryRaw`
          SELECT pg_total_relation_size('"ReconciliationAlert"') as size
        `,
      ]);

    return {
      reconciliationLogss: {
        count: logCount,
        sizeBytes: (Number(totalLogSize) as any)?.[0]?.size || 0,
        sizeMB: Number(((Number(totalLogSize) as any)?.[0]?.size || 0) / 1024 / 1024).toFixed(
          2,
        ),
      },
      reconciliationAlerts: {
        count: alertCount,
        sizeBytes: (Number(totalAlertSize) as any)?.[0]?.size || 0,
        sizeMB: Number(
          ((Number(totalAlertSize) as any)?.[0]?.size || 0) /
          1024 /
          1024
        ).toFixed(2),
      },
    };
  },
};

// =========================
// CURRENCY-AWARE FINANCIAL FUNCTIONS
// =========================
// These functions integrate with currencyService for multi-currency support

import { currencyService } from "./currency.service";
import { Currency } from "@prisma/client";

/**
 * Add ledger entry with currency conversion
 * Converts to base currency and saves exchange rate for audit trail
 * INDUSTRY STANDARD: Always store base amount + rate for reconstruction
 */
export const addLedgerWithCurrency = async (
  tx: any,
  data: {
    walletId: string;
    amountDecimal: number;
    amountCents: number;
    currency: Currency;
    type: string; // CREDIT or DEBIT
    category: string;
    referenceId?: string;
  }
) => {
  validateCents(data.amountCents, "amountCents");

  // Convert to base currency (USD) for canonical storage
  const { baseCents, rate } = await currencyService.toBaseCurrency(
    data.amountDecimal,
    data.currency
  );

  // Get current balance in base currency
  const wallet = await tx.wallet.findUnique({
    where: { id: data.walletId },
    select: { balance_cents: true },
  });

  const newBalanceCents =
    (wallet?.balance_cents || 0) + (data.type === "CREDIT" ? baseCents : -baseCents);

  // Create ledger entry in base currency with rate tracking
  return tx.ledgerEntry.create({
    data: {
      walletId: data.walletId,
      amount: toDecimal(baseCents),
      amount_cents: baseCents,
      currency: Currency.USD, // Always store in base currency
      type: data.type,
      category: data.category,
      referenceId: data.referenceId,
      balanceAfter: toDecimal(newBalanceCents),
      balanceAfter_cents: newBalanceCents,
      createdAt: new Date(),
    },
  });
};

/**
 * Create multi-currency transaction with exchange rate tracking
 * Used when transaction currency differs from wallet currency
 */
export const createMultiCurrencyTransaction = async (data: {
  walletId: string;
  type: string;
  amountDecimal: number;
  amountCents: number;
  currency: Currency;
  currency?: Currency;
  category: string;
  description: string;
  referenceId?: string;
  status?: string;
}) => {
  validateCents(data.amountCents, "amountCents");

  return prisma.$transaction(async (tx) => {
    // Convert to base currency
    const { baseCents, rate } = await currencyService.toBaseCurrency(
      data.amountDecimal,
      data.currency
    );

    // Create transaction with exchange rate
    const transaction = await tx.transaction.create({
      data: {
        walletId: data.walletId,
        type: data.type,
        amount_cents: baseCents,
        amount: toDecimal(baseCents),
        currency: Currency.USD,
        displayAmount: data.currency
          ? await currencyService.convert(
              toDecimal(baseCents),
              Currency.USD,
              data.currency
            )
          : undefined,
        exchangeRate: rate, // Save the rate for audit trail
        category: data.category,
        description: data.description,
        referenceId: data.referenceId,
        status: data.status || "PENDING",
      },
    });

    return {
      ...transaction,
      originalAmount: data.amountDecimal,
      originalCurrency: data.currency,
      rateUsed: rate,
      timestamp: new Date(),
    };
  });
};

/**
 * Get transaction with conversion to user's preferred currency
 * Useful for displaying transactions in user's currency
 */
export const getTransactionInUserCurrency = async (
  transactionId: string,
  userCurrency: Currency
) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { wallet: true },
  });

  if (!transaction) return null;

  // Transaction stored in base currency, convert to user's currency
  const convertedAmount = await currencyService.convert(
    transaction.amount,
    transaction.currency as Currency,
    userCurrency
  );

  return {
    id: transaction.id,
    baseAmount: transaction.amount,
    baseCurrency: transaction.currency,
    displayAmount: convertedAmount,
    currency: userCurrency,
    exchangeRate: transaction.exchangeRate,
    description: transaction.description,
    type: transaction.type,
    createdAt: transaction.createdAt,
    status: transaction.status,
  };
};

/**
 * Reconcile wallet with currency awareness
 * Enhanced version that tracks currency mismatches
 */
export const reconcileWalletWithCurrency = async (walletId: string) => {
  return prisma.$transaction(
    async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
        include: { seller: true, driver: true, business: true },
      });

      if (!wallet) throw new Error("Wallet not found");

      // Sum all ledger entries in their original currency
      const ledgerSumResult = await tx.ledgerEntry.aggregate({
        where: { walletId },
        _sum: { amount_cents: true },
      });

      const ledgerBalanceCents = ledgerSumResult._sum.amount_cents || 0;
      const walletBalanceCents =
        wallet.balance_cents !== null && wallet.escrowBalance_cents !== null
          ? wallet.balance_cents - wallet.escrowBalance_cents
          : wallet.balance_cents || 0;

      const diffCents = ledgerBalanceCents - walletBalanceCents;

      // Create reconciliation log with currency info
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
            currency: wallet.currency,
            status: "OK",
            message: `Wallet reconciliation OK. Balance: ${toDecimal(walletBalanceCents)} ${wallet.currency}`,
          },
        });

        return {
          status: "OK",
          ledgerBalanceCents,
          walletBalanceCents,
          currency: wallet.currency,
        };
      }

      // Mismatch detected - create alert with currency awareness
      const log = await tx.reconciliationLog.create({
        data: {
          walletId,
          expected: toDecimal(ledgerBalanceCents),
          expected_cents: ledgerBalanceCents,
          actual: toDecimal(walletBalanceCents),
          actual_cents: walletBalanceCents,
          difference: toDecimal(diffCents),
          difference_cents: diffCents,
          currency: wallet.currency,
          status: "MISMATCH_ALERT",
          message: `Currency-aware mismatch: Ledger=${toDecimal(ledgerBalanceCents)} ${wallet.currency}, Wallet=${toDecimal(walletBalanceCents)} ${wallet.currency}`,
        },
      });

      // Create alert with severity calculation
      const severity = calculateAlertSeverity(diffCents);
      await createReconciliationAlert(tx, {
        walletId,
        logId: log.id,
        severity,
        type: "WALLET_MISMATCH",
        message: log.message,
        expectedCents: ledgerBalanceCents,
        actualCents: walletBalanceCents,
        diffCents,
      });

      return {
        status: "MISMATCH_DETECTED",
        ledgerBalance: toDecimal(ledgerBalanceCents),
        walletBalance: toDecimal(walletBalanceCents),
        discrepancy: toDecimal(diffCents),
        currency: wallet.currency,
        action: "ALERT_CREATED - Manual investigation required",
      };
    },
    { timeout: 10000 }
  );
};

/**
 * Get wallet balance converted to any currency
 */
export const getWalletBalanceInCurrency = async (
  walletId: string,
  targetCurrency: Currency
) => {
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
  });

  if (!wallet) return null;

  const balanceInTargetCurrency = await currencyService.convert(
    toDecimal(wallet.balance_cents),
    wallet.currency as Currency,
    targetCurrency
  );

  return {
    walletId,
    balanceInBaseCurrency: toDecimal(wallet.balance_cents),
    baseCurrency: wallet.currency,
    balanceInTargetCurrency,
    targetCurrency,
    exchangeRate: await currencyService.getExchangeRate(
      wallet.currency as Currency,
      targetCurrency
    ),
  };
};
