'use client';

import React, { useState } from 'react';
import { Shipment, Driver } from '../../lib/types';
import { Card, CardHeader, CardContent, CardFooter } from '../shared/Card';
import { Button } from '../shared/Button';
import { StatusBadge } from '../shared/Badge';
import { X } from 'lucide-react';

interface ShipmentModalProps {
  shipment: Shipment | null;
  drivers: Driver[];
  isOpen: boolean;
  onClose: () => void;
  onAssignDriver?: (shipmentId: string, driverId: string) => void;
  isLoading?: boolean;
}

export function ShipmentModal({
  shipment,
  drivers,
  isOpen,
  onClose,
  onAssignDriver,
  isLoading = false,
}: ShipmentModalProps) {
  const [selectedDriver, setSelectedDriver] = useState<string>('');

  if (!isOpen || !shipment) return null;

  const handleAssign = () => {
    if (selectedDriver) {
      onAssignDriver?.(shipment.id, selectedDriver);
      setSelectedDriver('');
      onClose();
    }
  };

  const availableDrivers = drivers.filter(
    (d) => d.status === 'active' || d.status === 'on-delivery'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader
          title="Shipment Details"
          action={
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-secondary transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          }
        />

        <CardContent className="space-y-6">
          {/* Order Info */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">Order Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Order Number</p>
                <p className="font-medium text-foreground">{shipment.orderNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <div className="mt-1">
                  <StatusBadge status={shipment.status} />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Source</p>
                <p className="font-medium capitalize text-foreground">{shipment.source}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created Date</p>
                <p className="font-medium text-foreground">
                  {shipment.createdAt.toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-3 border-t border-border pt-4">
            <h4 className="font-semibold text-foreground">Customer Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium text-foreground">{shipment.customer.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground">{shipment.customer.phone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{shipment.customer.email}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Delivery Address</p>
                <p className="font-medium text-foreground">
                  {shipment.customer.address}, {shipment.customer.city}, {shipment.customer.state}{' '}
                  {shipment.customer.zipCode}
                </p>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="space-y-3 border-t border-border pt-4">
            <h4 className="font-semibold text-foreground">Products</h4>
            <div className="space-y-2">
              {shipment.products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-start justify-between rounded-lg bg-secondary/50 p-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">Qty: {product.quantity}</p>
                    <p className="text-xs text-muted-foreground">${product.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Info */}
          <div className="space-y-3 border-t border-border pt-4">
            <h4 className="font-semibold text-foreground">Financial Information</h4>
            <div className="space-y-2 rounded-lg bg-secondary/50 p-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">
                  ${shipment.totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Delivery Fee</span>
                <span className="font-medium text-foreground">
                  ${shipment.deliveryFee.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-semibold text-accent">
                  ${(shipment.totalAmount + shipment.deliveryFee).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Assign Driver */}
          {shipment.status === 'pending' && (
            <div className="space-y-3 border-t border-border pt-4">
              <h4 className="font-semibold text-foreground">Assign Driver</h4>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="w-full rounded-full border border-border bg-white px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select a driver...</option>
                {availableDrivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} - {driver.vehicle.type} ({driver.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Driver Info if Assigned */}
          {shipment.driverId && (
            <div className="space-y-3 border-t border-border pt-4">
              <h4 className="font-semibold text-foreground">Assigned Driver</h4>
              <div className="rounded-lg bg-accent/10 p-3">
                {drivers
                  .filter((d) => d.id === shipment.driverId)
                  .map((driver) => (
                    <div key={driver.id} className="space-y-2">
                      <p className="font-medium text-foreground">{driver.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {driver.vehicle.type} - {driver.vehicle.licensePlate}
                      </p>
                      <p className="text-xs text-muted-foreground">{driver.phone}</p>
                      <div className="mt-2 flex gap-2">
                        <div className="text-xs">
                          <span className="text-muted-foreground">Rating:</span>
                          <span className="ml-1 font-medium text-foreground">⭐ {driver.rating}</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground">Deliveries:</span>
                          <span className="ml-1 font-medium text-foreground">
                            {driver.totalDeliveries}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button variant="outline" onClick={onClose} fullWidth>
            Close
          </Button>
          {shipment.status === 'pending' && !shipment.driverId && (
            <Button
              variant="primary"
              onClick={handleAssign}
              disabled={!selectedDriver || isLoading}
              isLoading={isLoading}
              fullWidth
            >
              Assign Driver
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
