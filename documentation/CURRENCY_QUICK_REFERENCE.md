# Multi-Currency System - Quick Reference for Routes

## 🎯 TL;DR - Use These Functions

### In Your API Routes

```typescript
// ✅ ALWAYS import from ONE place
import { currencyService } from "@fastship/lib/services/currency.service";
import { addLedgerWithCurrency, createMultiCurrencyTransaction } from "@fastship/lib/services/financial.engine";
import { Currency } from "@fastship/db";
import { toCents, fromCents, formatCurrency } from "@fastship/lib/utils/currency.utils";
```

---

## 📌 Common Scenarios

### Scenario 1: User Wants to Update Their Display Currency

**Route**: `POST /api/user/currency`

```typescript
import { currencyService } from "@fastship/lib/services/currency.service";
import { Currency } from "@fastship/db";

export async function updateUserCurrency(
  req: Request,
  res: Response
) {
  const { userId } = req.user;
  const { currency } = req.body; // "EUR", "INR", etc.

  try {
    // Single line - that's it!
    await currencyService.setUserCurrency(userId, currency as Currency);
    
    return res.json({ 
      success: true, 
      message: `Currency updated to ${currency}` 
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
```

---

### Scenario 2: Get User's Wallet Balance in Their Currency

**Route**: `GET /api/wallet/balance`

```typescript
import { currencyService } from "@fastship/lib/services/currency.service";
import { getWalletBalanceInCurrency } from "@fastship/lib/services/financial.engine";
import { formatCurrency } from "@fastship/lib/utils/currency.utils";

export async function getWalletBalance(
  req: Request,
  res: Response
) {
  const { userId, walletId } = req.user;

  try {
    // Step 1: Get user's preferred currency
    const userCurrency = await currencyService.getUserCurrency(userId);
    
    // Step 2: Get balance converted to their currency
    const balance = await getWalletBalanceInCurrency(walletId, userCurrency);
    
    // Step 3: Format for display
    const formatted = formatCurrency(balance.balanceInTargetCurrency, userCurrency);
    
    return res.json({
      balance: balance.balanceInTargetCurrency,
      currency: userCurrency,
      formatted,
      baseBalance: balance.balanceInBaseCurrency,
      baseCurrency: balance.baseCurrency,
      exchangeRate: balance.exchangeRate,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

---

### Scenario 3: Create a Payment with Automatic Conversion

**Route**: `POST /api/shipments/create-payment`

```typescript
import { currencyService } from "@fastship/lib/services/currency.service";
import { createMultiCurrencyTransaction } from "@fastship/lib/services/financial.engine";
import { Currency } from "@fastship/db";
import { toCents, formatCurrency } from "@fastship/lib/utils/currency.utils";

export async function createPayment(
  req: Request,
  res: Response
) {
  const { shipmentId, walletId, amount, userCurrency } = req.body;

  try {
    // Step 1: Validate
    if (amount <= 0) throw new Error("Amount must be positive");

    // Step 2: Create transaction with automatic conversion
    const transaction = await createMultiCurrencyTransaction({
      walletId,
      type: "DEBIT",
      amountDecimal: amount,
      amountCents: toCents(amount),
      currency: userCurrency as Currency,
      displayCurrency: userCurrency as Currency,
      category: "shipment_payment",
      description: `Payment for shipment ${shipmentId}`,
      referenceId: shipmentId,
    });

    // Step 3: Return details
    return res.json({
      success: true,
      transaction: {
        id: transaction.id,
        chargedAmount: amount,
        currency: userCurrency,
        formatted: formatCurrency(amount, userCurrency),
        baseAmount: transaction.amount,
        baseCurrency: transaction.currency,
        exchangeRate: transaction.exchangeRate,
        timestamp: transaction.createdAt,
      },
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
```

---

### Scenario 4: Add Commission with Currency Conversion

**Route**: `POST /api/earnings/add-commission`

```typescript
import { addLedgerWithCurrency } from "@fastship/lib/services/financial.engine";
import { Currency } from "@fastship/db";
import { toCents } from "@fastship/lib/utils/currency.utils";

export async function addCommission(
  req: Request,
  res: Response
) {
  const { walletId, amount, userCurrency, shipmentId } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Add ledger entry with automatic base currency conversion
      const entry = await addLedgerWithCurrency(tx, {
        walletId,
        amountDecimal: amount,
        amountCents: toCents(amount),
        currency: userCurrency as Currency,
        type: "CREDIT",
        category: "commission",
        referenceId: shipmentId,
      });

      // Update wallet balance
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: { increment: entry.balanceAfter },
          balance_cents: { increment: entry.balanceAfter_cents },
        },
      });

      return entry;
    });

    return res.json({
      success: true,
      message: `Commission of ${amount} ${userCurrency} added`,
      entry: result,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
```

---

### Scenario 5: Show Transaction History in User's Currency

**Route**: `GET /api/transactions?currency=EUR`

```typescript
import { currencyService } from "@fastship/lib/services/currency.service";
import { formatCurrency } from "@fastship/lib/utils/currency.utils";

export async function getTransactionHistory(
  req: Request,
  res: Response
) {
  const { walletId, userId } = req.user;
  const { currency } = req.query;

  try {
    // Get all transactions
    const transactions = await prisma.transaction.findMany({
      where: { walletId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Target currency (user's or query param)
    const targetCurrency = (currency as any) || 
      await currencyService.getUserCurrency(userId);

    // Convert each transaction
    const converted = await Promise.all(
      transactions.map(async (tx) => {
        const displayAmount = await currencyService.convert(
          tx.amount,
          tx.currency as any,
          targetCurrency
        );

        return {
          id: tx.id,
          type: tx.type,
          amount: displayAmount,
          currency: targetCurrency,
          formatted: formatCurrency(displayAmount, targetCurrency),
          baseAmount: tx.amount,
          baseCurrency: tx.currency,
          exchangeRate: tx.exchangeRate,
          description: tx.description,
          date: tx.createdAt,
        };
      })
    );

    return res.json({
      count: converted.length,
      displayCurrency: targetCurrency,
      transactions: converted,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

---

### Scenario 6: Reconcile Wallet (Admin/Cron)

**Route**: `POST /api/admin/reconcile-wallet` or **Cron Job**

```typescript
import { reconcileWalletWithCurrency } from "@fastship/lib/services/financial.engine";
import { currencyService } from "@fastship/lib/services/currency.service";

// For single wallet
export async function reconcileWallet(req: Request, res: Response) {
  const { walletId } = req.body;

  try {
    const result = await reconcileWalletWithCurrency(walletId);
    
    return res.json({
      status: result.status,
      details: result,
      requiresAction: result.status !== "OK",
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

// For cron job (runs every 6 hours)
export async function cronReconcileAllWallets() {
  const wallets = await prisma.wallet.findMany({
    select: { id: true },
  });

  const results = [];
  for (const wallet of wallets) {
    try {
      const result = await reconcileWalletWithCurrency(wallet.id);
      results.push({ walletId: wallet.id, ...result });
    } catch (error) {
      results.push({ walletId: wallet.id, error: error.message });
    }
  }

  // Refresh exchange rates too
  await currencyService.refreshAllExchangeRates();

  console.log(`Reconciliation complete: ${results.length} wallets checked`);
  return results;
}
```

---

### Scenario 7: Convert Rate Card to User's Currency

**Route**: `GET /api/rates?currency=EUR`

```typescript
import { currencyService } from "@fastship/lib/services/currency.service";
import { formatCurrency } from "@fastship/lib/utils/currency.utils";

export async function getRateCards(
  req: Request,
  res: Response
) {
  const { userId } = req.user;
  const { businessId, currency } = req.query;

  try {
    // Get rate cards
    const rates = await prisma.rateCard.findMany({
      where: {
        businessId: businessId as string,
        isActive: true,
      },
    });

    // User's target currency
    const targetCurrency = (currency as any) || 
      await currencyService.getUserCurrency(userId);

    // Convert all rates
    const converted = await Promise.all(
      rates.map(async (rate) => {
        // Convert pricing object
        const convertedPricing = await currencyService.convertPricing(
          {
            baseRate: rate.baseRate,
            perKmRate: rate.perKmRate,
            weightSurcharge: rate.weightSurcharge,
          },
          "USD", // Assuming rates stored in USD
          targetCurrency
        );

        return {
          id: rate.id,
          name: rate.name,
          baseRate: convertedPricing.baseRate,
          perKmRate: convertedPricing.perKmRate,
          weightSurcharge: convertedPricing.weightSurcharge,
          currency: targetCurrency,
          formatted: {
            baseRate: formatCurrency(convertedPricing.baseRate, targetCurrency),
            perKmRate: formatCurrency(convertedPricing.perKmRate, targetCurrency),
          },
        };
      })
    );

    return res.json({
      count: converted.length,
      displayCurrency: targetCurrency,
      rates: converted,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

---

## 🎯 Pattern Summary

### Always Follow This Pattern:

```
1. Get user's currency
   → currencyService.getUserCurrency(userId)

2. If storing amount:
   → Convert to base currency
   → Store base amount + exchange rate

3. If displaying amount:
   → Convert base currency to display currency
   → Use formatCurrency() for UI

4. For calculations:
   → Use toCents() for precision
   → Use integer arithmetic
   → Convert back with fromCents()

5. For errors:
   → Reconciliation alerts created automatically
   → Admin notified for HIGH/CRITICAL
```

---

## ❌ What NOT to Do

```typescript
// ❌ DON'T: Manual conversions scattered everywhere
const eurAmount = usdAmount * 0.92;  // Wrong rate, precision error!

// ❌ DON'T: Store amounts without rate
wallet.balance = 100;  // Which currency? At what rate?

// ❌ DON'T: Direct wallet updates
await prisma.wallet.update({ data: { balance: newAmount } });
// Use the service instead!

// ❌ DON'T: Floating point arithmetic
const total = 0.1 + 0.2;  // 0.30000000000000004 (oops!)

// ❌ DON'T: Forget to use transaction
// Always use: prisma.$transaction() when multiple updates
```

---

## ✅ Quick Checklist for New Features

- [ ] Using `currencyService` for conversions?
- [ ] Storing base amount in cents (not decimal)?
- [ ] Saving exchange rate on transactions?
- [ ] Converting to user's currency for display?
- [ ] Using `formatCurrency()` for UI?
- [ ] Using `toCents()` for precision?
- [ ] No floating point arithmetic?
- [ ] Using `prisma.$transaction()` for multiple updates?
- [ ] Tested with different currencies?

---

## 📞 Need Help?

- **Schema questions**: See `packages/db/prisma/schema.prisma`
- **Service questions**: See `apps/api/lib/services/currency.service.ts`
- **Financial logic**: See `apps/api/lib/services/financial.engine.ts`
- **Utilities**: See `packages/lib/utils/currency.utils.ts`
- **Full docs**: See `documentation/MULTI_CURRENCY_SYSTEM.md`

---

**Remember**: If it's related to currency, use the service. Don't reinvent the wheel!
