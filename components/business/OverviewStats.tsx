'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { TrendingUp, Package, Truck, DollarSign } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  return (
    <Card className="flex-1">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
          <div className="text-accent">{icon}</div>
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <TrendingUp
            className={`h-4 w-4 ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}
          />
          <span
            className={`text-sm font-medium ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.direction === 'up' ? '+' : '-'}
            {Math.abs(trend.value)}%
          </span>
        </div>
      )}
    </Card>
  );
}

interface OverviewStatsProps {
  stats?: {
    totalShipments: number;
    activeShipments: number;
    totalDrivers: number;
    revenue: number;
  };
  isLoading?: boolean;
}

export function OverviewStats({
  stats = {
    totalShipments: 1248,
    activeShipments: 23,
    totalDrivers: 12,
    revenue: 45230.5,
  },
  isLoading = false,
}: OverviewStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Shipments"
        value={stats.totalShipments}
        subtitle="All time"
        icon={<Package className="h-6 w-6" />}
        trend={{ value: 12, direction: 'up' }}
      />
      <StatCard
        title="Active Shipments"
        value={stats.activeShipments}
        subtitle="This week"
        icon={<Truck className="h-6 w-6" />}
        trend={{ value: 8, direction: 'up' }}
      />
      <StatCard
        title="Active Drivers"
        value={stats.totalDrivers}
        subtitle="All drivers"
        icon={<Truck className="h-6 w-6" />}
        trend={{ value: 3, direction: 'down' }}
      />
      <StatCard
        title="Total Revenue"
        value={`$${(stats.revenue / 1000).toFixed(1)}k`}
        subtitle="This month"
        icon={<DollarSign className="h-6 w-6" />}
        trend={{ value: 15, direction: 'up' }}
      />
    </div>
  );
}
