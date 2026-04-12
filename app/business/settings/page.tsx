'use client';

import React from 'react';
import { BusinessLayout } from '@/components/business/BusinessLayout';
import { SettingsPage } from '@/components/business/SettingsPage';
import { useNotifications } from '@/lib/hooks';

export default function BusinessSettingsPageRoute() {
  const { notifications, getUnreadCount } = useNotifications();

  const unreadCount = getUnreadCount();

  return (
    <BusinessLayout currentPage="settings" unreadNotifications={unreadCount}>
      <SettingsPage />
    </BusinessLayout>
  );
}
