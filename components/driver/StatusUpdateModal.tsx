'use client';

import React from 'react';
import { ShipmentStatus } from '@/lib/types';
import { Button } from '@/components/shared/Button';
import { X, CheckCircle2, Navigation, Truck, AlertCircle, BoxIcon } from 'lucide-react';

interface StatusUpdateModalProps {
  isOpen: boolean;
  currentStatus: ShipmentStatus;
  onClose: () => void;
  onStatusChange: (status: ShipmentStatus) => void;
  isLoading?: boolean;
}

const statusOptions = [
 
  {
    status: 'ASSIGNED' as ShipmentStatus,
    label: 'Assigned',
    description: 'Order assigned to driver',
    icon: Truck,
    color: 'text-blue-600',
  },
   {
    status: 'PICKED_UP' as ShipmentStatus,
    label: 'Picked Up',
    description: 'Package picked up by driver',
    icon: BoxIcon,
    color: 'text-teal-600',
  },
  {
    status: 'IN_TRANSIT' as ShipmentStatus,
    label: 'In Transit',
    description: 'Started delivery',
    icon: Navigation,
    color: 'text-purple-600',
  },
  {
    status: 'DELIVERED' as ShipmentStatus,
    label: 'Delivered',
    description: 'Order delivered successfully',
    icon: CheckCircle2,
    color: 'text-green-600',
  },
  {
    status: 'FAILED' as ShipmentStatus,
    label: 'Failed',
    description: 'Delivery could not be completed',
    icon: AlertCircle,
    color: 'text-red-600',
  },
];

export function StatusUpdateModal({
  isOpen,
  currentStatus,
  onClose,
  onStatusChange,
  isLoading,
}: StatusUpdateModalProps) {
  if (!isOpen) return null;

  const nextStatusOptions = statusOptions.filter((option) => {
    if (currentStatus === 'ASSIGNED') return option.status === 'PICKED_UP';
    if (currentStatus === 'PENDING') return option.status === 'ASSIGNED';
    if (currentStatus === 'PICKED_UP') return option.status === 'IN_TRANSIT';
    if (currentStatus === 'IN_TRANSIT') return option.status === 'DELIVERED' || option.status === 'FAILED';
    return false;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Update Order Status</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-secondary transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* Current Status */}
        <div className="mb-6 rounded-2xl bg-secondary p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
            Current Status
          </p>
          <p className="text-lg font-semibold text-foreground capitalize">{currentStatus}</p>
        </div>

        {/* Status Options */}
        <div className="mb-6 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Select New Status</p>
          {nextStatusOptions.length > 0 ? (
            nextStatusOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.status}
                  onClick={() => {
                    onStatusChange(option.status);
                    onClose();
                  }}
                  disabled={isLoading}
                  className="w-full rounded-2xl border border-border bg-white p-4 text-left hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 ${option.color} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-2xl bg-secondary/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">No status transitions available</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            fullWidth
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
