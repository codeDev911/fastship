'use client';

import React from 'react';
import { BusinessLayout } from '@/components/business/BusinessLayout';
import { NotificationsList } from '@/components/business/NotificationsList';
import { useNotifications } from '@/lib/hooks';

export default function BusinessNotificationsPage() {
  const { notifications, isLoading, markAsRead, deleteNotification, getUnreadCount } =
    useNotifications();

  const unreadCount = getUnreadCount();

  return (
    <BusinessLayout currentPage="notifications" unreadNotifications={unreadCount}>
      <NotificationsList
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onDelete={deleteNotification}
        isLoading={isLoading}
      />
    </BusinessLayout>
  );
}
