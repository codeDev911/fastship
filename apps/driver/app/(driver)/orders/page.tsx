'use client';

import { DriverLayout } from '../../../components/DriverLayout';
import { DriverOrders } from '../../../components/DriverOrders';
import { useShipments, useNotifications } from '@fastship/lib';

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
