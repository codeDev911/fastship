// =========================
// CURRENCY UTILITIES & TYPES
// =========================

import { Currency } from "@prisma/client";

/**
 * Currency conversion result
 */
export interface CurrencyConversionResult {
  originalAmount: number;
  originalCurrency: Currency;
  convertedAmount: number;
  convertedCurrency: Currency;
  exchangeRate: number;
  timestamp: Date;
}

/**
 * Multi-currency transaction
 */
export interface MultiCurrencyTransaction {
  id: string;
  walletId: string;
  type: string;
  baseAmount: number;
  baseCurrency: Currency;
  displayAmount?: number;
  displayCurrency?: Currency;
  exchangeRate: number;
  description: string;
  status: string;
  createdAt: Date;
}

/**
 * Wallet balance in multiple currencies
 */
export interface WalletBalanceMultiCurrency {
  walletId: string;
  baseCurrency: Currency;
  baseAmount: number;
  conversions: {
    currency: Currency;
    amount: number;
    exchangeRate: number;
  }[];
}

/**
 * Exchange rate info
 */
export interface ExchangeRateInfo {
  from: Currency;
  to: Currency;
  rate: number;
  cached: boolean;
  updatedAt: Date;
  expiresAt: Date;
}

/**
 * Currency metadata
 */
export interface CurrencyMetadata {
  code: Currency;
  symbol: string;
  name: string;
  decimals: number;
  isSupported: boolean;
}

/**
 * Transaction reconciliation record
 */
export interface TransactionReconciliation {
  transactionId: string;
  walletId: string;
  originalAmount: number;
  originalCurrency: Currency;
  baseAmount: number;
  baseCurrency: Currency;
  storedAmount: number;
  difference: number;
  status: "OK" | "MISMATCH" | "ERROR";
  message?: string;
}

// ========================
// CURRENCY CONSTANTS
// ========================

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.USD]: "$",
  [Currency.EUR]: "€",
  [Currency.GBP]: "£",
  [Currency.INR]: "₹",
  [Currency.AED]: "د.إ",
  [Currency.PKR]: "₨",
  [Currency.SGD]: "S$",
  [Currency.MYR]: "RM",
  [Currency.THB]: "฿",
  [Currency.IDR]: "Rp",
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  [Currency.USD]: "US Dollar",
  [Currency.EUR]: "Euro",
  [Currency.GBP]: "British Pound",
  [Currency.INR]: "Indian Rupee",
  [Currency.AED]: "UAE Dirham",
  [Currency.PKR]: "Pakistani Rupee",
  [Currency.SGD]: "Singapore Dollar",
  [Currency.MYR]: "Malaysian Ringgit",
  [Currency.THB]: "Thai Baht",
  [Currency.IDR]: "Indonesian Rupiah",
};

export const BASE_CURRENCY: Currency = Currency.USD;

// Decimal places for each currency (industry standard)
export const CURRENCY_DECIMALS: Record<Currency, number> = {
  [Currency.USD]: 2,
  [Currency.EUR]: 2,
  [Currency.GBP]: 2,
  [Currency.INR]: 2,
  [Currency.AED]: 2,
  [Currency.PKR]: 2,
  [Currency.SGD]: 2,
  [Currency.MYR]: 2,
  [Currency.THB]: 2,
  [Currency.IDR]: 0, // IDR doesn't use decimals
};

// ========================
// UTILITY FUNCTIONS
// ========================

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

/**
 * Get currency name
 */
export function getCurrencyName(currency: Currency): string {
  return CURRENCY_NAMES[currency] || currency;
}

/**
 * Format amount with currency
 */
export function formatCurrency(
  amount: number,
  currency: Currency,
  locale: string = "en-US"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: CURRENCY_DECIMALS[currency] || 2,
      maximumFractionDigits: CURRENCY_DECIMALS[currency] || 2,
    }).format(amount);
  } catch (error) {
    return `${CURRENCY_SYMBOLS[currency] || currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Parse currency string to amount
 * Removes currency symbols and formatting
 */
export function parseCurrencyString(value: string): number {
  // Remove currency symbols
  const cleaned = value
    .replace(/[$€£₹د.إ₨S฿Rp]/g, "")
    .replace(/[^\d.-]/g, "")
    .trim();
  return parseFloat(cleaned) || 0;
}

/**
 * Check if currency is supported
 */
export function isSupportedCurrency(currency: string): boolean {
  return Object.values(Currency).includes(currency as Currency);
}

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies(): Currency[] {
  return Object.values(Currency);
}

/**
 * Get currency metadata
 */
export function getCurrencyMetadata(currency: Currency): CurrencyMetadata {
  return {
    code: currency,
    symbol: getCurrencySymbol(currency),
    name: getCurrencyName(currency),
    decimals: CURRENCY_DECIMALS[currency] || 2,
    isSupported: isSupportedCurrency(currency),
  };
}

// ========================
// AMOUNT PRECISION HELPERS
// ========================

/**
 * Round amount to currency decimals
 */
export function roundToCurrencyDecimals(
  amount: number,
  currency: Currency
): number {
  const decimals = CURRENCY_DECIMALS[currency] || 2;
  const factor = Math.pow(10, decimals);
  return Math.round(amount * factor) / factor;
}

/**
 * Convert to cents (always 2 decimals)
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert from cents
 */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Validate amount is positive
 */
export function validatePositiveAmount(amount: number, fieldName: string = "amount"): boolean {
  if (typeof amount !== "number" || amount <= 0 || !Number.isFinite(amount)) {
    throw new Error(
      `${fieldName} must be a positive number. Got: ${amount}`
    );
  }
  return true;
}

// ========================
// EXCHANGE RATE HELPERS
// ========================

/**
 * Calculate reverse exchange rate
 * If 1 USD = 0.92 EUR, then 1 EUR = 1.087 USD
 */
export function getReverseExchangeRate(rate: number): number {
  if (rate <= 0) throw new Error("Exchange rate must be positive");
  return Math.round((1 / rate) * 10000) / 10000;
}

/**
 * Apply exchange rate to amount
 */
export function applyExchangeRate(
  amount: number,
  rate: number,
  decimals: number = 2
): number {
  return Math.round(amount * rate * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Calculate exchange rate from two amounts
 */
export function calculateExchangeRate(
  fromAmount: number,
  toAmount: number
): number {
  if (fromAmount <= 0) throw new Error("From amount must be positive");
  return Math.round((toAmount / fromAmount) * 10000) / 10000;
}

// ========================
// COMPARISON & VALIDATION
// ========================

/**
 * Check if two amounts in different currencies are equivalent
 * given an exchange rate
 */
export function areAmountsEquivalent(
  amount1: number,
  amount2: number,
  rate: number,
  tolerance: number = 0.01 // 1 cent tolerance
): boolean {
  const converted = applyExchangeRate(amount1, rate, 2);
  return Math.abs(converted - amount2) <= tolerance;
}

/**
 * Format transaction for logging
 */
export function formatTransactionLog(
  baseAmount: number,
  baseCurrency: Currency,
  displayAmount: number | undefined,
  displayCurrency: Currency | undefined,
  rate: number
): string {
  const base = `${baseAmount} ${baseCurrency}`;
  const display =
    displayAmount && displayCurrency
      ? ` → ${displayAmount} ${displayCurrency}`
      : "";
  return `${base}${display} (rate: ${rate})`;
}
