'use client';

import { DriverLayout } from '@/components/driver/DriverLayout';
import { DriverOrders } from '@/components/driver/DriverOrders';
import { useShipments, useNotifications } from '@/lib/hooks';

export default function DriverOrdersPage() {
  const { shipments, isLoading, updateShipmentStatus } = useShipments();
  const { notifications, getUnreadCount } = useNotifications();

  const unreadCount = getUnreadCount();

  return (
    <DriverLayout currentPage="orders" unreadNotifications={unreadCount}>
      <DriverOrders
        shipments={shipments}
        onUpdateStatus={updateShipmentStatus}
        isLoading={isLoading}
      />
    </DriverLayout>
  );
}
