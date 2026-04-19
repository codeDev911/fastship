'use client';

import React, { useState } from 'react';
import { Driver } from '../../lib/types';
import { Button } from '../shared/Button';
import { X, Star, Truck, MapPin, Search, Motorbike } from 'lucide-react';

interface DriverAssignmentModalProps {
  isOpen: boolean;
  drivers: Driver[];
  onClose: () => void;
  onAssignDriver: (driverId: string) => void;
  isLoading?: boolean;
}

type FilterStatus = 'all' | 'ACTIVE' | 'ON_DELIVERY';

export function DriverAssignmentModal({
  isOpen,
  drivers,
  onClose,
  onAssignDriver,
  isLoading,
}: DriverAssignmentModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || driver.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleAssign = () => {
    if (selectedDriver) {
      onAssignDriver(selectedDriver);
      setSelectedDriver(null);
      setSearchTerm('');
      setFilterStatus('all');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-2xl max-h-[80vh] rounded-2xl bg-white p-6 shadow-lg overflow-y-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between sticky top-0 bg-white pb-4">
          <h2 className="text-2xl font-bold text-foreground">Assign Driver</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-secondary transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-border bg-white py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {(['all', 'ACTIVE', 'ON_DELIVERY'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                {status === 'all' ? 'All Drivers' : status === 'ACTIVE' ? 'Available' : 'On Delivery'}
              </button>
            ))}
          </div>
        </div>

        {/* Driver List */}
        <div className="mb-6 space-y-3">
          {filteredDrivers.length > 0 ? (
            filteredDrivers.map((driver) => (
              <div
                key={driver.id}
                onClick={() => setSelectedDriver(driver.id)}
                className={`rounded-2xl border-2 p-4 cursor-pointer transition-all ${
                  selectedDriver === driver.id
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold flex-shrink-0">
                    {driver.user.name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">{driver.user.name}</p>
                        <p className="text-sm text-secondary-foreground">{driver.user.phone}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Motorbike className="h-4 w-4" />
                          {driver.vehicleType}
                        </p>
                      </div>
                      {/* Status Badge */}
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${
                        driver.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : driver.status === 'ON_DELIVERY'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {driver.status === 'ACTIVE' ? 'Available' : 'On Delivery'}
                      </span>
                    </div>

                    {/* Details Row */}
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-accent" />
                        <span>
                          <span className="font-semibold text-foreground">{driver.rating}</span>
                          <span className="text-muted-foreground"> ({driver.totalDeliveries} deliveries)</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-accent" />
                        <span className="text-muted-foreground">{driver.vehicleNumber}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-secondary/50 p-8 text-center">
              <Truck className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-foreground font-semibold">No drivers found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white pt-4 border-t border-border flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            fullWidth
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            fullWidth
            disabled={!selectedDriver || isLoading}
            isLoading={isLoading}
          >
            Assign Driver
          </Button>
        </div>
      </div>
    </div>
  );
}
