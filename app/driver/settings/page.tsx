'use client';

import React from 'react';
import { DriverLayout } from '@/components/driver/DriverLayout';
import { DriverSettings } from '@/components/driver/DriverSettings';
import { useNotifications } from '@/lib/hooks';

export default function DriverSettingsPage() {
  const { notifications, getUnreadCount } = useNotifications();

  const unreadCount = getUnreadCount();

  return (
    <DriverLayout currentPage="settings" unreadNotifications={unreadCount}>
      <DriverSettings />
    </DriverLayout>
  );
}
