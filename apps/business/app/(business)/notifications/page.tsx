'use client';

import React from 'react';
import { BusinessLayout } from '@fastship/ui';
import { NotificationsList } from '@fastship/ui';
import { useNotifications } from '@fastship/lib';

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
