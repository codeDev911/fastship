'use client';

import React from 'react';
import { Currency } from '@prisma/client';
import { CURRENCY_SYMBOLS } from '../utils/currency.utils';
import { Skeleton } from '@fastship/ui';

interface CurrencyDisplayProps {
  amount: number;
  currency?: Currency;
  showCode?: boolean;
  showSymbol?: boolean;
  decimalPlaces?: number;
  className?: string;
}

/**
 * CurrencyDisplay Component
 * Displays an amount formatted with the appropriate currency symbol
 *
 * @example
 * ```tsx
 * <CurrencyDisplay
 *   amount={1000.50}
 *   currency={Currency.EUR}
 *   showSymbol={true}
 *   showCode={false}
 * />
 * // Output: €1,000.50
 * ```
 */
export function CurrencyDisplay({
  amount,
  currency = Currency.USD,
  showCode = true,
  showSymbol = true,
  decimalPlaces = 2,
  className = '',
}: CurrencyDisplayProps) {
  const symbol = CURRENCY_SYMBOLS[currency];

  // Format amount with thousand separators and specified decimal places
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(amount);

  return (
    <>
    {amount || amount ===0  ? (
        <span className={className}>
      {showSymbol && <span>{symbol}</span>}
      <span>{formattedAmount}</span>
      {showCode && <span className="text-sm"> {currency}</span>}
    </span>
    ):(
        <Skeleton className={`h-6 w-20 bg-gray-700`} />
    )}
    </>
  );
}

interface CurrencyBadgeProps {
  currency: Currency;
  className?: string;
}

/**
 * CurrencyBadge Component
 * Shows a small badge with the currency code and symbol
 *
 * @example
 * ```tsx
 * <CurrencyBadge currency={Currency.PKR} />
 * // Output: ₨ PKR
 * ```
 */
export function CurrencyBadge({ currency, className = '' }: CurrencyBadgeProps) {
  const symbol = CURRENCY_SYMBOLS[currency];

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 text-blue-900 text-xs font-medium ${className}`}
    >
      <span>{symbol}</span>
      <span>{currency}</span>
    </div>
  );
}

export default CurrencyDisplay;
