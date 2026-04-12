'use client';

import React from 'react';
import { DriverLayout } from '@/components/driver/DriverLayout';
import { NotificationsList } from '@/components/business/NotificationsList';
import { useNotifications } from '@/lib/hooks';

export default function DriverNotificationsPage() {
  const { notifications, isLoading, markAsRead, deleteNotification, getUnreadCount } =
    useNotifications();

  const unreadCount = getUnreadCount();

  return (
    <DriverLayout currentPage="notifications" unreadNotifications={unreadCount}>
      <NotificationsList
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onDelete={deleteNotification}
        isLoading={isLoading}
      />
    </DriverLayout>
  );
}
