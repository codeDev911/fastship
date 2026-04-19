'use client';

import React, { useState, useEffect } from 'react';
import { BusinessLayout } from '@fastship/ui';
import { ApiKeyManagement } from '@fastship/ui';
import { useNotifications } from '@fastship/lib';

export default function ApiKeysPage() {
  const { notifications, getUnreadCount } = useNotifications();
  const unreadCount = getUnreadCount();

  return (
    <BusinessLayout currentPage="api-keys" unreadNotifications={unreadCount}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">API Management</h1>
          <p className="mt-2 text-muted-foreground">
            Create and manage API keys for third-party integrations
          </p>
        </div>

        {/* API Key Management Component */}
        <ApiKeyManagement />
      </div>
    </BusinessLayout>
  );
}
