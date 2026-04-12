'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { Driver } from '@/lib/types';
import { StatusBadge } from '@/components/shared/Badge';
import { Star, Phone, Briefcase } from 'lucide-react';

interface DriversListProps {
  drivers: Driver[];
  isLoading?: boolean;
}

export function DriversList({ drivers, isLoading = false }: DriversListProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Manage Drivers</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage your delivery drivers
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {drivers.map((driver) => (
          <Card key={driver.id} className="flex flex-col">
            <CardContent className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{driver.name}</h3>
                  <p className="text-xs text-muted-foreground">{driver.email}</p>
                </div>
                <StatusBadge status={driver.status} />
              </div>

              {/* Driver Info */}
              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Vehicle</p>
                    <p className="text-sm font-medium text-foreground">
                      {driver.vehicleType} - {driver.vehicleNumber}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium text-foreground">{driver.phone}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Deliveries</span>
                  <span className="font-semibold text-foreground">{driver.totalDeliveries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Earnings</span>
                  <span className="font-semibold text-accent">
                    ${driver.totalEarnings.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-foreground">{driver.rating}</span>
                  </div>
                </div>
              </div>

              {/* License */}
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-xs text-muted-foreground">License Number</p>
                <p className="text-sm font-mono font-semibold text-foreground">
                  {driver.licenseNumber}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {drivers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 text-center">
              <p className="text-lg font-semibold text-foreground">No drivers yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Start by adding your first driver to the system
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
