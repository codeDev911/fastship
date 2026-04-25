'use client';

import React, { useState } from 'react';
import { Currency } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fastship/ui';
import { Label } from '@fastship/ui';
import { CURRENCY_SYMBOLS, CURRENCY_NAMES } from '../utils/currency.utils';

// Define supported currencies in order of popularity
const SUPPORTED_CURRENCIES = [
  Currency.USD,
  Currency.EUR,
  Currency.GBP,
  Currency.INR,
  Currency.AED,
  Currency.PKR,
  Currency.SGD,
  Currency.MYR,
  Currency.THB,
  Currency.IDR,
];

interface CurrencySelectorProps {
  value: Currency;
  onChange: (currency: Currency) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  showSymbol?: boolean;
  showFullName?: boolean;
}

/**
 * CurrencySelector Component
 * Provides a dropdown to select from supported currencies
 *
 * @example
 * ```tsx
 * <CurrencySelector
 *   value={Currency.USD}
 *   onChange={(curr) => setUserCurrency(curr)}
 *   label="Preferred Currency"
 *   showSymbol={true}
 *   showFullName={true}
 * />
 * ```
 */
export function CurrencySelector({
  value,
  onChange,
  label = 'Currency',
  disabled = false,
  className = '',
  showSymbol = true,
  showFullName = true,
}: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`w-full space-y-2 ${className}`}>
      {label && <Label htmlFor="currency-select">{label}</Label>}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="currency-select" className="w-full">
          <SelectValue placeholder="Select a currency" />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_CURRENCIES.map((currency) => {
            const symbol = CURRENCY_SYMBOLS[currency];
            const name = CURRENCY_NAMES[currency] || currency;

            return (
              <SelectItem key={currency} value={currency}>
                <div className="flex items-center gap-2">
                  {showSymbol && <span className="font-semibold">{symbol}</span>}
                  <span>{currency}</span>
                  {showFullName && <span className="text-gray-500">({name})</span>}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

export default CurrencySelector;
