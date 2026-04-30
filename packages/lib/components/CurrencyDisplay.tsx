'use client';
import { Currency } from '@prisma/client';
import { CURRENCY_SYMBOLS } from '../utils/currency.utils';
import { Skeleton, Tooltip, TooltipContent, TooltipTrigger } from '@fastship/ui';
import { InfoIcon } from 'lucide-react';

interface CurrencyDisplayProps {
  amount: number;
  currency?: Currency;
  amountBase?: number;
  inline?: boolean;
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
 *   amountBase={10} // amount in USD
 *   showSymbol={true}
 *   showCode={false}
 * />
 * // Output: €1,000.50
 * ```
 */
export function CurrencyDisplay({
  amount,
  currency = Currency.USD,
  amountBase = 0,
  showCode = false,
  showSymbol = true,
  inline = false,
  decimalPlaces = 2,
  className = '',
}: CurrencyDisplayProps) {
  const symbol = CURRENCY_SYMBOLS[currency];

  // Format amount with thousand separators and specified decimal places
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(amount);

  amount  = Number(amount.toFixed(2))
  amountBase = Number(amountBase.toFixed(4))

  return (
    <>
      {amount || amount === 0 ? (
        <div className={`${inline ?"flex" :""}`}>
          <div>
            <span className={className}>
              {showSymbol && <span>{symbol}</span>}
              <span>{formattedAmount}</span>
              {showCode && <span className="text-sm"> {currency}</span>}
            </span>
          </div>

          {currency !== Currency.USD && amountBase !== 0 && <div className="text-sm text-right justify-end  space-x-1 w-full text-gray-600 flex items-center font-normal">
            <span className=' text-right'>≈ ${amountBase}</span>
            <Tooltip>
              <TooltipTrigger><InfoIcon className='w-3' /></TooltipTrigger>
              <TooltipContent className="text-sm">Stored in USD. {currency} is a live estimate that fluctuates with market rates. <br /> Your actual balance remains stable. <br /> <strong>Stored {amountBase}USD ≈ {amount}{currency} </strong> according to market rate exchange </TooltipContent>
            </Tooltip>
          </div>}
        </div>
      ) : (
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
