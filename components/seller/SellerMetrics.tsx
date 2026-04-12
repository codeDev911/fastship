'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/shared/Card';
import { Package, Truck, CheckCircle2, Wallet } from 'lucide-react';

interface Metric {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'green' | 'orange';
}

interface SellerMetricsProps {
  pendingDispatch?: number;
  inTransit?: number;
  deliveredToday?: number;
  walletBalance?: number;
  currency?: string;
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
  green: 'bg-green-50 text-green-600 border-green-200',
  orange: 'bg-orange-50 text-orange-600 border-orange-200',
};

export function SellerMetrics({
  pendingDispatch = 8,
  inTransit = 12,
  deliveredToday = 24,
  walletBalance = 15000,
  currency = 'PKR',
}: SellerMetricsProps) {
  const metrics: Metric[] = [
    {
      label: 'Pending Dispatch',
      value: pendingDispatch,
      icon: <Package className="h-6 w-6" />,
      color: 'blue',
    },
    {
      label: 'In Transit',
      value: inTransit,
      icon: <Truck className="h-6 w-6" />,
      color: 'purple',
    },
    {
      label: 'Delivered Today',
      value: deliveredToday,
      icon: <CheckCircle2 className="h-6 w-6" />,
      color: 'green',
    },
    {
      label: 'Wallet Balance',
      value: walletBalance.toLocaleString(),
      unit: currency,
      icon: <Wallet className="h-6 w-6" />,
      color: 'orange',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="flex flex-col">
          <CardContent className="flex items-start justify-between p-6">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-3xl font-bold text-foreground">{metric.value}</p>
                {metric.unit && <p className="text-sm text-muted-foreground">{metric.unit}</p>}
              </div>
            </div>
            <div className={`rounded-full p-3 ${colorClasses[metric.color]}`}>
              {metric.icon}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
