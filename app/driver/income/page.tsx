'use client';

import React, { useState, useEffect } from 'react';
import { DriverLayout } from '@/components/driver/DriverLayout';
import { IncomeTracker } from '@/components/driver/IncomeTracker';
import { useNotifications } from '@/lib/hooks';
import { secureFetch } from '@/lib/secure-fetch';

export default function DriverIncomePage() {
  const { getUnreadCount } = useNotifications();
  const [driverId] = useState<string>('driver-1'); // Get from session/context
  const [earnings, setEarnings] = useState(0);
  const [completedDeliveries, setCompletedDeliveries] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const unreadCount = getUnreadCount();

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setIsLoading(true);
        const response = await secureFetch(`/api/analytics?driverId=${driverId}`);
        if (!response.ok) throw new Error('Failed to fetch earnings');
        const data = await response.json();
        setEarnings(data.stats.earnings);
        setCompletedDeliveries(data.stats.deliveredCount);
      } catch (error) {
        console.error('Error fetching earnings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEarnings();
  }, [driverId]);

  return (
    <DriverLayout currentPage="income" unreadNotifications={unreadCount}>
      <IncomeTracker
        totalEarnings={earnings}
        completedDeliveries={completedDeliveries}
      />
    </DriverLayout>
  );
}
