'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@fastship/ui';
import { Shipment } from '@fastship/lib';
import { StatusBadge } from '@fastship/ui';
import { MapPin, Phone, User, Package, Clock, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import { Button } from '@fastship/ui';

interface DriverOrdersProps {
  shipments: Shipment[];
  onUpdateStatus?: (shipmentId: string, newStatus: string) => void;
  isLoading?: boolean;
}

interface OrderCardProps {
  shipment: Shipment;
  onUpdateStatus?: (shipmentId: string, newStatus: string) => void;
}

function OrderCard({ shipment, onUpdateStatus }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getNextAction = () => {
    switch (shipment.status) {
      case 'ASSIGNED':
        return { label: 'Start Delivery', action: 'IN_TRANSIT' };
      case 'IN_TRANSIT':
        return { label: 'Complete Delivery', action: 'DELIVERED' };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">{shipment.orderNumber}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Order placed {new Date(shipment?.createdAt)?.toLocaleDateString()}
            </p>
          </div>
          <StatusBadge status={shipment?.status} />
        </div>

        {/* Quick Info */}
        <div className="space-y-2 rounded-lg bg-secondary/50 p-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{shipment.deliveryName}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {shipment.deliveryCity}, {shipment.deliveryState}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{shipment.deliveryPhone}</span>
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-3 border-t border-border pt-4">
            {/* Full Address */}
            <div>
              <p className="text-xs font-medium text-muted-foreground">Delivery Address</p>
              <p className="mt-1 text-sm text-foreground">
                {shipment.deliveryAddress}
                <br />
                {shipment.deliveryCity}, {shipment.deliveryState} {shipment.deliveryZipCode}
              </p>
            </div>

            {/* Products */}
            {/* <div>
              <p className="text-xs font-medium text-muted-foreground">Items ({shipment.products.length})</p>
              <div className="mt-2 space-y-2">
                {shipment.products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-start justify-between rounded-lg bg-white p-2 text-xs"
                  >
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-muted-foreground">Qty: {product.quantity}</p>
                    </div>
                    <p className="font-medium text-accent">${product.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div> */}

            {/* Financial */}
            <div className="rounded-lg bg-accent/10 p-3">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${shipment.codAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2 border-b border-border pb-2">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span className="font-medium text-accent">${shipment.actualRate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-foreground">Total Earning</span>
                <span className="font-bold text-accent">
                  ${shipment.actualRate.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 border-t border-border pt-4">
          <Link
            href={`/orders/${shipment.id}`}
            className="flex-1 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="h-4 w-4" /> View Details
          </Link>
          {nextAction && (
            <button
              onClick={() => onUpdateStatus?.(shipment.id, nextAction.action)}
              className="flex-1 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
            >
              {nextAction.label}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DriverOrders({ shipments, onUpdateStatus, isLoading = false }: DriverOrdersProps) {
  const [filter, setFilter] = useState<'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'all'>('ASSIGNED');

  const filteredShipments = shipments 
  
  const stats = {
    total: filteredShipments.length,
    pending: filteredShipments.filter((s) => s.status === 'ASSIGNED').length,
    inTransit: filteredShipments.filter((s) => s.status === 'IN_TRANSIT').length,
    completed: filteredShipments.filter((s) => s.status === 'DELIVERED').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">My Orders</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage and track your deliveries</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total Orders', value: stats.total, icon: Package },
          { label: 'Assigned', value: stats.pending, icon: Clock },
          { label: 'In Transit', value: stats.inTransit, icon: MapPin },
          { label: 'Delivered', value: stats.completed, icon: CheckCircle2 },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <Icon className="h-6 w-6 text-accent" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors capitalize ${
              filter === f
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary text-foreground hover:bg-secondary/80'
            }`}
          >
            {f === 'IN_TRANSIT' ? 'In Transit' : f.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredShipments.map((shipment) => (
          <OrderCard
            key={shipment.id}
            shipment={shipment}
            onUpdateStatus={onUpdateStatus}
          />
        ))}

        {filteredShipments.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-semibold text-foreground">No orders found</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {filter === 'all'
                  ? 'You don&apos;t have any orders assigned yet'
                  : `No orders in "${filter}" status`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
