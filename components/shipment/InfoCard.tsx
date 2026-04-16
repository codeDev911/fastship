'use client';

import React from 'react';

interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  variant?: 'default' | 'highlight' | 'success' | 'warning' | 'error';
  onClick?: () => void;
  href?: string;
  action?: React.ReactNode;
}

export function InfoCard({
  icon,
  label,
  value,
  subtext,
  variant = 'default',
  onClick,
  href,
  action,
}: InfoCardProps) {
  const variantClasses = {
    default:
      'bg-white border-border/50 hover:border-accent/50 text-foreground',
    highlight:
      'bg-accent/5 border-accent/20 hover:border-accent text-accent',
    success:
      'bg-green-50 border-green-200 hover:border-green-300 text-green-700',
    warning:
      'bg-yellow-50 border-yellow-200 hover:border-yellow-300 text-yellow-700',
    error:
      'bg-red-50 border-red-200 hover:border-red-300 text-red-700',
  };

  const Component = href ? 'a' : onClick ? 'button' : 'div';

  return (
    <Component
      href={href}
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all ${variantClasses[variant]} ${
        onClick || href ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`p-2 rounded-lg flex-shrink-0 ${
            variant === 'default'
              ? 'bg-accent/10 text-accent'
              : 'bg-current opacity-20'
          }`}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p className="text-lg font-semibold text-foreground mt-1 break-all">
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
          )}
        </div>

        {/* Action */}
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </Component>
  );
}
