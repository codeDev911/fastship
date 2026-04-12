'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { Driver, Shipment } from '@/lib/types';
import { TrendingUp, Star, Clock, MapPin } from 'lucide-react';

interface DriverOverviewProps {
  driver: Driver;
  activeDeliveries: number;
  completedToday: number;
  isLoading?: boolean;
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = 'accent',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'accent' | 'green' | 'blue' | 'yellow';
}) {
  const colorClasses = {
    accent: 'bg-accent/10 text-accent',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function DriverOverview({
  driver,
  activeDeliveries,
  completedToday,
  isLoading = false,
}: DriverOverviewProps) {
  console.log(driver);
  
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-2xl bg-gradient-to-r from-accent to-orange-500 px-8 py-6 text-white">
        <h1 className="text-3xl font-bold">Welcome back, {driver.name}! 👋</h1>
        <p className="mt-2 text-orange-100">
          You&apos;re doing great! Keep up the excellent work today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Deliveries"
          value={driver.totalDeliveries}
          subtitle="All time"
          icon={<Package className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Active Deliveries"
          value={activeDeliveries}
          subtitle="In progress"
          icon={<MapPin className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Completed Today"
          value={completedToday}
          subtitle="This week"
          icon={<Clock className="h-6 w-6" />}
          color="yellow"
        />
        <StatCard
          title="Rating"
          value={driver.rating}
          subtitle="⭐ stars"
          icon={<Star className="h-6 w-6" />}
          color="accent"
        />
      </div>

      {/* Driver Performance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's Performance */}
        <Card>
          <CardHeader
            title="Today&apos;s Performance"
            description={`${completedToday} completed deliveries`}
          />
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Deliveries Completed</span>
                <span className="font-semibold text-foreground">{completedToday}/10</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-gradient-to-r from-accent to-orange-500 transition-all"
                  style={{ width: `${(completedToday / 10) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Distance Covered</span>
                <span className="font-semibold text-foreground">24.5 km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Time on Road</span>
                <span className="font-semibold text-foreground">3h 45m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg. Time per Delivery</span>
                <span className="font-semibold text-foreground">22.5 min</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader title="Vehicle & License" description="Your current information" />
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground">Vehicle Type</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {driver?.vehicleType}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground">License Plate</p>
              <p className="mt-1 font-mono text-lg font-semibold text-foreground">
                {driver?.vehicleNumber}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground">License Number</p>
              <p className="mt-1 font-mono text-sm font-semibold text-foreground">
                {driver?.licenseNumber}
              </p>
            </div>
            <div className="rounded-lg bg-accent/10 p-4 border-l-4 border-accent">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <span>Status:</span>
                <span className="capitalize rounded-full px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold">
                  {driver.status}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader title="Quick Actions" />
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <button className="flex flex-col items-center gap-2 rounded-lg bg-secondary/50 p-4 hover:bg-secondary transition-colors">
              <MapPin className="h-6 w-6 text-accent" />
              <span className="text-sm font-medium text-foreground">Start Route</span>
            </button>
            <button className="flex flex-col items-center gap-2 rounded-lg bg-secondary/50 p-4 hover:bg-secondary transition-colors">
              <Package className="h-6 w-6 text-accent" />
              <span className="text-sm font-medium text-foreground">View Orders</span>
            </button>
            <button className="flex flex-col items-center gap-2 rounded-lg bg-secondary/50 p-4 hover:bg-secondary transition-colors">
              <Clock className="h-6 w-6 text-accent" />
              <span className="text-sm font-medium text-foreground">Track Time</span>
            </button>
            <button className="flex flex-col items-center gap-2 rounded-lg bg-secondary/50 p-4 hover:bg-secondary transition-colors">
              <TrendingUp className="h-6 w-6 text-accent" />
              <span className="text-sm font-medium text-foreground">View Stats</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Import Package icon
import { Package } from 'lucide-react';
