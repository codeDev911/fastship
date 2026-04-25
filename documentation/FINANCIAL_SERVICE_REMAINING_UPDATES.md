# Financial Service - Remaining Function Updates

## 📋 Status Report

**Updated Functions: 7/12 ✅**
**Remaining Functions: 5**

---

## ⏳ Remaining Functions to Update

These 5 functions still need currency parameter support:

### 1. **settleDriverPayment()**
**Current Signature:**
```typescript
async settleDriverPayment(
  tx: Tx,
  driverId: string,
  transactionId: string,
  amount: number,
  description?: string,
)
```

**What to Update:**
- Add `currency: Currency = Currency.USD` parameter
- Convert to base currency using `currencyService.toBaseCurrency()`
- Track exchange rate on transaction
- Store in base currency + exchange rate

**Pattern to Follow:**
```typescript
// Convert to cents
const amountCents = toCents(amount);
validateCents(amountCents, "settlement amount");

// Convert to base if needed
let baseCents = amountCents;
let exchangeRate = 1;
if (currency !== Currency.USD) {
  const { baseCents: converted, rate } = 
    await currencyService.toBaseCurrency(amount, currency);
  baseCents = converted;
  exchangeRate = rate;
}

// Store with rate
await tx.transaction.create({
  data: {
    amount_cents: baseCents,
    currency: Currency.USD,
    exchangeRate: exchangeRate,
    // ... rest of fields
  }
});
```

---

### 2. **addCODDebt()**
**Current Signature:**
```typescript
async addCODDebt(
  tx: Ty,
  shipmentId: string,
  customerId: string,
  amount: number,
  paymentMethod: "PREPAID" | "COD" | "WALLET",
)
```

**What to Update:**
- Add `currency: Currency = Currency.USD` parameter
- Track COD debt in base currency
- Save exchange rate for when it's settled

**Pattern to Follow:** Same as above - convert to base, track rate

---

### 3. **processShipmentTransactions()**
**Current Signature:**
```typescript
async processShipmentTransactions(
  tx: Ty,
  shipmentId: string,
)
```

**What to Update:**
- Add `currency: Currency = Currency.USD` parameter
- Process all shipment transactions in specified currency
- Handle multi-leg shipments with potential rate changes

**Consideration:** This might process multiple transactions - consider if each needs its own currency parameter or if there's a single currency for the shipment.

---

### 4. **cutEscrow()**
**Current Signature:**
```typescript
async cutEscrow(
  tx: Tx,
  walletId: string,
  amount: number,
  reason: string,
  referenceId?: string,
)
```

**What to Update:**
- Add `currency: Currency = Currency.USD` parameter
- Convert to base when cutting escrow
- Track exchange rate

**Pattern to Follow:** Same pattern as lockEscrow/releaseEscrow

---

### 5. **settleCODDebt()**
**Current Signature:**
```typescript
async settleCODDebt(
  tx: Ty,
  debtId: string,
  amount: number,
  paymentMethod: string,
)
```

**What to Update:**
- Add `currency: Currency = Currency.USD` parameter
- Settle debt in base currency
- Match against original COD debt amount (might be in different currency)

**Note:** This might need to reconcile original COD (possibly in customer's currency) with settlement (in different currency).

---

## 🔄 Implementation Steps

For each function:

1. **Add Parameter**
   ```typescript
   currency: Currency = Currency.USD
   ```

2. **Convert to Cents**
   ```typescript
   const amountCents = toCents(amount);
   validateCents(amountCents, "field name");
   ```

3. **Convert to Base if Needed**
   ```typescript
   let baseCents = amountCents;
   let exchangeRate = 1;
   if (currency !== Currency.USD) {
     const { baseCents: converted, rate } = 
       await currencyService.toBaseCurrency(amount, currency);
     baseCents = converted;
     exchangeRate = rate;
   }
   ```

4. **Use baseCents in Queries**
   - Replace `amount` with `baseCents` in database operations
   - Use `Currency.USD` for currency field
   - Save `exchangeRate` for audit trail

5. **Update Idempotency Key** (if applicable)
   ```typescript
   const uniqueKey = `operation-${id}-${baseCents}-${refId}-${Date.now()}`;
   ```

6. **Return Response** (if applicable)
   ```typescript
   return {
     success: true,
     // ... existing fields
     exchangeRate: exchangeRate,
     originalAmount: amount,
     originalCurrency: currency,
   };
   ```

---

## 💼 Complex Cases

### settleCODDebt - Multi-Currency Reconciliation

**Scenario:** Customer owes ₹5000 (from original COD), but pays in USD

```typescript
async settleCODDebt(
  tx: Tx,
  debtId: string,
  amount: number,      // 60 (USD)
  paymentMethod: string,
  currency: Currency = Currency.USD  // ✨ NEW
) {
  // 1. Fetch original COD debt (might be in different currency)
  const debt = await tx.codDebt.findUnique({ where: { id: debtId } });
  // debt.amount = 5000, debt.currency = PKR

  // 2. Convert payment to same currency for comparison
  const { baseCents: originalInBase } = 
    await currencyService.toBaseCurrency(debt.amount, debt.currency);
  
  const { baseCents: paymentInBase } = 
    await currencyService.toBaseCurrency(amount, currency);

  // 3. Check if payment covers debt (in base currency)
  if (paymentInBase < originalInBase) {
    throw new Error("Payment is less than debt amount");
  }

  // 4. Record settlement with both currencies tracked
  await tx.transaction.create({
    data: {
      amount_cents: paymentInBase,
      currency: Currency.USD,
      exchangeRate: 1, // Payment in USD
      description: `Settlement of COD debt`,
      referenceId: debtId,
    }
  });

  // 5. Update debt status
  await tx.codDebt.update({
    where: { id: debtId },
    data: { status: "SETTLED" }
  });
}
```

---

## 📊 Function Dependency Chain

```
processShipmentTransactions
    ↓
Creates multiple transactions
    ↓
Each uses: createTransaction() or createTransactionWithCurrency()
    ↓
Might trigger: lockEscrow() → cutEscrow()
            → addCODDebt() → settleCODDebt()
            → settleDriverPayment()
```

**Tip:** Update in this order:
1. `settleDriverPayment` (simplest - similar to lockEscrow)
2. `addCODDebt` (medium - just adds debt with rate)
3. `cutEscrow` (medium - similar to lockEscrow)
4. `settleCODDebt` (complex - needs reconciliation)
5. `processShipmentTransactions` (complex - orchestrates multiple)

---

## ✅ Verification Checklist

After updating each function:

- [ ] Function signature includes `currency: Currency = Currency.USD`
- [ ] Amounts converted to cents using `toCents()`
- [ ] Amounts validated using `validateCents()`
- [ ] Convert to base using `currencyService.toBaseCurrency()`
- [ ] All database writes use `baseCents` and `Currency.USD`
- [ ] Exchange rate is tracked in transaction/record
- [ ] Response includes `exchangeRate`, `originalAmount`, `originalCurrency`
- [ ] Backward compatible: existing calls still work (USD default)
- [ ] Updated JSDoc comments
- [ ] No floating-point arithmetic

---

## 🧪 Test Cases to Consider

After each update:

```typescript
// Test 1: USD (should be no-op conversion)
await financialService.functionName(..., amount, desc, refId, Currency.USD);

// Test 2: EUR conversion
await financialService.functionName(..., amount, desc, refId, Currency.EUR);

// Test 3: Emerging market currency (PKR)
await financialService.functionName(..., amount, desc, refId, Currency.PKR);

// Test 4: Default parameter (should be USD)
await financialService.functionName(..., amount, desc, refId);

// Verify: Check transaction record has:
// - amount_cents: integer
// - currency: "USD"
// - exchangeRate: number
// - originalAmount: number (if tracked)
// - originalCurrency: string (if tracked)
```

---

## 📝 Quick Template

Copy this template for each function update:

```typescript
async functionName(
  tx: Tx,
  param1: string,
  param2: string,
  amount: number,
  description?: string,
  referenceId?: string,
  currency: Currency = Currency.USD,  // ✨ ADD THIS
) {
  // ✨ ADD THIS SECTION
  const amountCents = toCents(amount);
  validateCents(amountCents, "function-specific amount");

  let baseCents = amountCents;
  let exchangeRate = 1;

  if (currency !== Currency.USD) {
    const { baseCents: converted, rate } =
      await currencyService.toBaseCurrency(amount, currency);
    baseCents = converted;
    exchangeRate = rate;
  }
  // ✨ END ADD

  // REST OF EXISTING LOGIC
  // Replace: amount → baseCents
  // Replace: decimal fields → _cents fields
  // Add: exchangeRate: exchangeRate to records
  
  return {
    success: true,
    // ... existing fields
    exchangeRate: exchangeRate,        // ✨ ADD
    originalAmount: amount,            // ✨ ADD
    originalCurrency: currency,        // ✨ ADD
  };
}
```

---

## 🎯 Next Steps

1. **Pick one function** (recommend: `settleDriverPayment` - simplest)
2. **Apply the pattern** using template above
3. **Verify** against checklist
4. **Test** with different currencies
5. **Repeat** for remaining 4 functions

**Expected time per function:** 10-15 minutes

---

**Priority**: HIGH - Unblocks database migration  
**Impact**: Enables complete multi-currency support in financial operations
