'use client';

import React from 'react';
import { BusinessLayout } from '@fastship/ui';
import { SettingsPage } from '@fastship/ui';
import { useNotifications } from '@fastship/lib';

export default function BusinessSettingsPageRoute() {
  const { notifications, getUnreadCount } = useNotifications();

  const unreadCount = getUnreadCount();

  return (
    <BusinessLayout currentPage="settings" unreadNotifications={unreadCount}>
      <SettingsPage />
    </BusinessLayout>
  );
}
