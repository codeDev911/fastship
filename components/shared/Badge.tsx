'use client';

import React from 'react';
import { ShipmentStatus, DriverStatus, NotificationType } from '@/lib/types';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'accent';
}

export function Badge({ children, variant = 'default', className = '', ...props }: BadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium';

  const variantClasses = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    outline: 'border border-border bg-background text-foreground',
    accent: 'bg-accent text-accent-foreground',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: ShipmentStatus | DriverStatus | NotificationType | string;
}

export function StatusBadge({ status, className = '', ...props }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800';
      case 'PICKED_UP':
        return 'bg-teal-100 text-teal-800';
      case 'IN_TRANSIT':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'ON_DELIVERY':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const capitalize = (str: string) => str?.charAt(0)?.toUpperCase() + str?.slice(1)?.replace('-', ' ');

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(status)} ${className}`}
      {...props}
    >
      {capitalize(status)}
    </span>
  );
}
