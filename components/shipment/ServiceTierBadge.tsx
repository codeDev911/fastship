'use client';

import React from 'react';

interface ServiceTierBadgeProps {
  rateCardName?: string;
  baseRate?: number;
  size?: 'sm' | 'md' | 'lg';
  showPrice?: boolean;
}

export function ServiceTierBadge({
  rateCardName,
  baseRate,
  size = 'md',
  showPrice = true,
}: ServiceTierBadgeProps) {
  const getTierStyle = (name?: string) => {
    const tier = name?.toLowerCase().trim() || 'standard';

    const styles: Record<string, any> = {
      express: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: '⚡',
        label: 'Express',
      },
      economy: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        icon: '💰',
        label: 'Economy',
      },
      standard: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-700',
        icon: '📦',
        label: 'Standard',
      },
      premium: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        icon: '👑',
        label: 'Premium',
      },
    };

    // Try exact match first
    if (styles[tier]) return styles[tier];

    // Try partial match (e.g., "exp" for "express")
    const partialMatch = Object.entries(styles).find(([key]) =>
      key.includes(tier.substring(0, 3))
    );
    if (partialMatch) return partialMatch[1];

    // Fallback to standard
    return styles.standard;
  };

  const style = getTierStyle(rateCardName);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full font-semibold border ${style.bg} ${style.border} ${style.text} ${sizeClasses[size]} transition-all hover:shadow-sm`}
    >
      <span>{style.icon}</span>
      <span>{rateCardName || style.label}</span>
      {showPrice && baseRate !== undefined && (
        <>
          <span className="opacity-50">•</span>
          <span className="text-xs opacity-75">
            PKR {baseRate.toFixed(0)}
          </span>
        </>
      )}
    </div>
  );
}
