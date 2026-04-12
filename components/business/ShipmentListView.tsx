'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/shared/Card';
import { Shipment, ShipmentStatus } from '@/lib/types';
import { StatusBadge } from '@/components/shared/Badge';
import { Eye, Truck, MapPin, Package } from 'lucide-react';

interface ShipmentListViewProps {
  shipments: Shipment[];
  isLoading?: boolean;
}

export function ShipmentListView({ shipments, isLoading = false }: ShipmentListViewProps) {
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'customer'>('date');
  const [filterStatus, setFilterStatus] = useState<ShipmentStatus | 'all'>('all');

  const statuses: ShipmentStatus[] = ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'FAILED'];

  const filteredShipments = shipments.filter((s) => {
    if (filterStatus === 'all') return true;
    return s.status === filterStatus;
  });

  const sortedShipments = [...filteredShipments].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'customer':
        return a.deliveryName.localeCompare(b.deliveryName);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Filters and Sort */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary text-foreground hover:bg-secondary/80'
            }`}
          >
            All
          </button>
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors capitalize ${
                filterStatus === status
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {status === 'IN_TRANSIT' ? 'In Transit' : status}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="date">Sort by Date</option>
          <option value="customer">Sort by Customer</option>
          <option value="status">Sort by Status</option>
        </select>
      </div>

      {/* Shipments Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Order Number
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Customer
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Location
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Items
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Date
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedShipments.map((shipment) => (
              <tr
                key={shipment.id}
                className="border-b border-border hover:bg-secondary/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <p className="font-semibold text-foreground truncate w-30">{shipment.id}</p>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-foreground">{shipment.deliveryName}</p>
                    <p className="text-xs text-muted-foreground">{shipment.deliveryEmail}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {shipment.deliveryCity}, {shipment.deliveryZipCode}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{shipment?.products?.length||0}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-semibold text-accent">
                    Rs.{shipment.actualRate.toFixed(2)}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={shipment.status} />
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-muted-foreground">
                    {new Date(shipment.createdAt).toLocaleDateString()}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/business/shipments/${shipment.id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <Eye className="h-4 w-4" /> View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedShipments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Package className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-semibold text-foreground">No shipments found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your filters or create a new shipment
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="text-sm text-muted-foreground">Total Shipments</p>
            <p className="text-2xl font-bold text-foreground">{filteredShipments.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold text-accent">
              ${filteredShipments.reduce((sum, s) => sum + s.totalAmount, 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pending Delivery</p>
            <p className="text-2xl font-bold text-blue-500">
              {filteredShipments.filter((s) => s.status !== 'DELIVERED' && s.status !== 'FAILED').length}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
