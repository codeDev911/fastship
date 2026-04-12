'use client';

import React, { useState } from 'react';
import { BusinessLayout } from '@/components/business/BusinessLayout';
import { ShipmentKanban } from '@/components/business/ShipmentKanban';
import { ShipmentListView } from '@/components/business/ShipmentListView';
import { useShipments, useNotifications } from '@/lib/hooks';

export default function BusinessShipmentsPage() {
  const { shipments, isLoading, updateShipmentStatus } = useShipments();
  const { getUnreadCount } = useNotifications();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const unreadCount = getUnreadCount();

  return (
    <BusinessLayout currentPage="shipments" unreadNotifications={unreadCount}>
      <div className="space-y-6">
        {/* View Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('kanban')}
            className={`rounded-full px-6 py-2 font-medium transition-colors ${
              viewMode === 'kanban'
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary text-foreground hover:bg-secondary/80'
            }`}
          >
            Kanban View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-full px-6 py-2 font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary text-foreground hover:bg-secondary/80'
            }`}
          >
            List View
          </button>
        </div>

        {/* Content */}
        {viewMode === 'kanban' ? (
          <ShipmentKanban
            shipments={shipments}
            onUpdateStatus={updateShipmentStatus}
            isLoading={isLoading}
          />
        ) : (
          <ShipmentListView
            shipments={shipments}
            isLoading={isLoading}
          />
        )}
      </div>
    </BusinessLayout>
  );
}
