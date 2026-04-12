'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { StatusBadge } from '@/components/shared/Badge';
import { mockShipments, mockDrivers } from '@/lib/mock-data';
import {
  MapPin,
  Phone,
  User,
  Package,
  Calendar,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
} from 'lucide-react';

export default function TrackPage() {
  const [searchId, setSearchId] = useState('');
  const [foundShipment, setFoundShipment] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    setHasSearched(true);
    const shipment = mockShipments.find((s) => s.id.toLowerCase() === searchId.toLowerCase());
    setFoundShipment(shipment || null);
  };

  const getDriver = (driverId: string | null) => {
    if (!driverId) return null;
    return mockDrivers.find((d) => d.id === driverId);
  };

  const getTimelineSteps = () => {
    const statusTimeline = [
      { status: 'pending', label: 'Order Placed', icon: Clock },
      { status: 'assigned', label: 'Driver Assigned', icon: Truck },
      { status: 'in-transit', label: 'In Transit', icon: MapPin },
      { status: 'delivered', label: 'Delivered', icon: CheckCircle2 },
    ];
    return statusTimeline;
  };

  const isCompleted = (status: string) => {
    const order = ['pending', 'assigned', 'in-transit', 'delivered', 'failed'];
    const currentIndex = order.indexOf(foundShipment?.status || 'pending');
    const statusIndex = order.indexOf(status);
    return statusIndex <= currentIndex;
  };

  const driver = foundShipment ? getDriver(foundShipment.driverId) : null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-3">Track Your Order</h1>
          <p className="text-lg text-muted-foreground">
            Enter your shipment ID to track the real-time status of your delivery
          </p>
        </div>

        {/* Search Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Enter Shipment ID (e.g., shipment-1)"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full rounded-full border border-border bg-white pl-12 pr-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <Button
                onClick={handleSearch}
                className="rounded-full"
              >
                Track
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {hasSearched && (
          <>
            {!foundShipment ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-lg font-semibold text-foreground">Shipment not found</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Please check your shipment ID and try again
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Status Overview */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Current Status</p>
                        <StatusBadge status={foundShipment.status} />
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-2">Order ID</p>
                        <p className="text-lg font-bold text-accent">{foundShipment.id}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="p-4 rounded-2xl bg-secondary/30">
                        <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Order Date</p>
                        <p className="text-sm font-semibold text-foreground">
                          {foundShipment.createdAt.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-secondary/30">
                        <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Total Value</p>
                        <p className="text-2xl font-bold text-accent">
                          ${foundShipment.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Timeline */}
                <Card>
                  <CardHeader title="Delivery Timeline" />
                  <CardContent>
                    <div className="space-y-6">
                      {getTimelineSteps().map((step, index) => {
                        const Icon = step.icon;
                        const completed = isCompleted(step.status);
                        
                        return (
                          <div key={step.status} className="relative">
                            <div className="flex gap-4">
                              {/* Timeline circle and line */}
                              <div className="flex flex-col items-center">
                                <div
                                  className={`h-12 w-12 rounded-full flex items-center justify-center border-2 ${
                                    completed
                                      ? 'bg-accent border-accent'
                                      : 'bg-secondary border-border'
                                  }`}
                                >
                                  <Icon
                                    className={`h-6 w-6 ${
                                      completed
                                        ? 'text-accent-foreground'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                </div>
                                {index < getTimelineSteps().length - 1 && (
                                  <div
                                    className={`w-1 h-12 mt-2 ${
                                      completed ? 'bg-accent' : 'bg-border'
                                    }`}
                                  />
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 py-2">
                                <h4 className={`font-semibold ${
                                  completed
                                    ? 'text-foreground'
                                    : 'text-muted-foreground'
                                }`}>
                                  {step.label}
                                </h4>
                                {completed && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {completed === (step.status === foundShipment.status)
                                      ? 'In progress'
                                      : 'Completed'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                  <div >
                {/* Customer Information */}
                <Card>
                  <CardHeader title="Customer Information" />
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="flex gap-3">
                        <User className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase">Name</p>
                          <p className="text-lg font-semibold text-foreground">
                            {foundShipment.customer.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Phone className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase">Phone</p>
                          <p className="text-lg font-semibold text-foreground">
                            {foundShipment.customer.phone}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Email</p>
                      <p className="text-foreground">{foundShipment.customer.email}</p>
                    </div>
                  </CardContent>
                </Card>
                <br/>
                {/* Delivery Address */}
                <Card>
                  <CardHeader title="Delivery Address" />
                  <CardContent>
                    <div className="flex gap-3">
                      <MapPin className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <p className="text-lg font-semibold text-foreground">
                          {foundShipment.customer.address}
                        </p>
                        <p className="text-foreground">
                          {foundShipment.customer.city}, {foundShipment.customer.state}{' '}
                          {foundShipment.customer.zipCode}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Estimated delivery: 2-3 hours from acceptance
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </div>
              </div>
                {/* Products */}
                <Card>
                  <CardHeader title={`Items (${foundShipment.products.length})`} />
                  <CardContent className="space-y-3">
                    {foundShipment.products.map((product: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-2xl border border-border p-4"
                      >
                        <div className="flex gap-3 items-center flex-1">
                          <Package className="h-5 w-5 text-accent flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{product.name}</p>
                            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">x{product.quantity}</p>
                          <p className="text-sm text-accent">${product.price.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Driver Information (if assigned) */}
                {driver && (
                  <Card>
                    <CardHeader title="Delivery Driver" />
                    <CardContent>
                      <div className="flex gap-4">
                        <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <Truck className="h-8 w-8 text-accent" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground text-lg">{driver.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {driver.vehicle.type} • {driver.vehicle.licensePlate}
                          </p>
                          <div className="mt-3 flex gap-6">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase">Rating</p>
                              <p className="text-sm font-semibold text-foreground">⭐ {driver.rating}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase">Phone</p>
                              <p className="text-sm font-semibold text-foreground">{driver.phone}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase">Deliveries</p>
                              <p className="text-sm font-semibold text-foreground">
                                {driver.totalDeliveries}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Order Summary */}
                <Card>
                  <CardHeader title="Order Summary" />
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium text-foreground">
                        ${foundShipment.totalAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span className="font-medium text-accent">
                        ${foundShipment.deliveryFee.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-3">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="text-xl font-bold text-accent">
                        ${(foundShipment.totalAmount + foundShipment.deliveryFee).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
