'use client';

import React from 'react';
import { CreditCard, Trash2 } from 'lucide-react';
import { Button } from '@/components/shared/Button';

interface CreditCardDisplayProps {
  cardLast4: string;
  cardBrand: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName: string;
  isDefault?: boolean;
}

export function CreditCardDisplay({
  cardLast4,
  cardBrand,
  expiryMonth,
  expiryYear,
  cardholderName,
  isDefault = true,
}: CreditCardDisplayProps) {
  return (
    <div className="rounded-2xl border border-border p-6 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="flex items-start justify-between mb-8">
        <CreditCard className="h-8 w-8 text-white/80" />
        {isDefault && (
          <span className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            Default
          </span>
        )}
      </div>

      <div className="space-y-6 text-white">
        {/* Card Number */}
        <div>
          <p className="text-sm font-medium text-white/70 mb-2">Card Number</p>
          <p className="text-2xl font-mono tracking-wider">
            •••• •••• •••• {cardLast4}
          </p>
        </div>

        {/* Card Details */}
        <div className="grid grid-cols-2 gap-4">
          {/* Cardholder Name */}
          <div>
            <p className="text-xs font-medium text-white/70 mb-1">Cardholder Name</p>
            <p className="text-sm font-medium uppercase tracking-wider">{cardholderName}</p>
          </div>

          {/* Expiry Date */}
          <div>
            <p className="text-xs font-medium text-white/70 mb-1">Expires</p>
            <p className="text-sm font-medium">
              {String(expiryMonth).padStart(2, '0')}/{String(expiryYear).slice(-2)}
            </p>
          </div>
        </div>
      </div>

      {/* Card Brand Badge */}
      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
        <span className="text-xs font-medium text-white/70 uppercase">{cardBrand}</span>
        <button className="rounded-full p-2 hover:bg-white/10 transition-colors" title="Delete card">
          <Trash2 className="h-4 w-4 text-red-400 hover:text-red-300" />
        </button>
      </div>
    </div>
  );
}
