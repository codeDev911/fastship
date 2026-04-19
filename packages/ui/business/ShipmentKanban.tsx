'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shipment, ShipmentStatus } from '../../lib/types';
import { StatusBadge } from '../shared/Badge';
import { Eye, Truck } from 'lucide-react';

interface KanbanColumn {
  status: ShipmentStatus;
  title: string;
  description: string;
}

interface ShipmentKanbanProps {
  shipments: Shipment[];
  onUpdateStatus?: (shipmentId: string, newStatus: ShipmentStatus) => void;
  isLoading?: boolean;
}

const columns: KanbanColumn[] = [
  { status: 'PENDING', title: 'Pending', description: 'Awaiting assignment' },
  { status: 'ASSIGNED', title: 'Assigned', description: 'Driver assigned' },
  { status: 'PICKED_UP', title: 'Picked up', description: 'In driver hands' },
  { status: 'IN_TRANSIT', title: 'In Transit', description: 'On the way' },
  { status: 'DELIVERED', title: 'Delivered', description: 'Successfully delivered' },
  { status: 'FAILED', title: 'Failed', description: 'Delivery failed' },
  { status: 'CANCELED', title: 'Canceled', description: 'Delivery canceled' },
  { status: 'RETURNED', title: 'Returned', description: 'Delivery returned' },
];

interface ShipmentCardProps {
  shipment: Shipment;
}

function ShipmentCard({ shipment }: ShipmentCardProps) {
  return (
    <div className="rounded-2xl bg-white p-4 cursor-grab active:cursor-grabbing border border-border/50 hover:shadow-sm transition-shadow">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-semibold text-foreground">{shipment.orderNumber}</p>
            <p className="mt-1 text-xs text-muted-foreground">{shipment?.deliveryName}</p>
          </div>
          <StatusBadge status={shipment.status} />
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          <p>📍 {shipment.deliveryCity}, {shipment.deliveryState}</p>
          <p>📦 {shipment?.products?.length} item(s)</p>
          <p>💰 ${shipment?.totalAmount?.toFixed(2)}</p>
        </div>

        {shipment.driverId && (
          <div className="rounded-lg bg-accent/10 px-2 py-1">
            <p className="text-xs font-medium text-accent">✓ Driver Assigned</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Link
            href={`/business/shipments/${shipment.id}`}
            className="flex-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors flex items-center justify-center gap-1"
          >
            <Eye className="h-3 w-3" /> Details
          </Link>
          {!shipment.driverId && (
            <Link
              href={`/business/shipments/${shipment.id}?tab=assign`}
              className="flex-1 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
            >
              <Truck className="h-3 w-3" /> Assign
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function ShipmentKanban({
  shipments,
  onUpdateStatus,
  isLoading = false,
}: ShipmentKanbanProps) {
  const [draggedShipment, setDraggedShipment] = useState<Shipment | null>(null);
  const [draggedFromStatus, setDraggedFromStatus] = useState<ShipmentStatus | null>(null);

  const handleDragStart = (shipment: Shipment, status: ShipmentStatus) => {
    setDraggedShipment(shipment);
    setDraggedFromStatus(status);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetStatus: ShipmentStatus) => {
    if (draggedShipment && draggedFromStatus !== targetStatus) {
      onUpdateStatus?.(draggedShipment.id, targetStatus);
    }
    setDraggedShipment(null);
    setDraggedFromStatus(null);
  };

  const getShipmentsByStatus = (status: ShipmentStatus) => {
    return shipments.filter((s) => s.status === status);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Shipment Kanban Board</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage shipments across different stages
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Total Shipments: <span className="font-semibold text-foreground">{shipments.length}</span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="inline-flex gap-6 w-full lg:w-auto">
          {columns.map((column) => {
            const columnShipments = getShipmentsByStatus(column.status);

            return (
              <div
                key={column.status}
                className="flex flex-col flex-shrink-0 w-full lg:w-80 rounded-2xl bg-white p-6 min-h-[500px]"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.status)}
              >
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground">{column.title}</h3>
                  <p className="text-sm text-muted-foreground">{columnShipments.length} items</p>
                </div>

                <div className="flex-1 space-y-4">
                  {columnShipments.map((shipment) => (
                    <div
                      key={shipment.id}
                      draggable
                      onDragStart={() => handleDragStart(shipment, column.status)}
                      className="cursor-move"
                    >
                      <ShipmentCard shipment={shipment} />
                    </div>
                  ))}

                  {columnShipments.length === 0 && (
                    <div className="flex h-40 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-secondary/20">
                      <p className="text-center text-sm text-muted-foreground">
                        No shipments <br /> Drag items here
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
