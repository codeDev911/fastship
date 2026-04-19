'use client';

import React from 'react';
import { DriverLayout } from '../../../components/DriverLayout';
import { DriverSettings } from '../../../components/DriverSettings';
import { useNotifications } from '@fastship/lib';

export default function DriverSettingsPage() {
  const { notifications, getUnreadCount } = useNotifications();

  const unreadCount = getUnreadCount();

  return (
    <DriverLayout currentPage="settings" unreadNotifications={unreadCount}>
      <DriverSettings />
    </DriverLayout>
  );
}
