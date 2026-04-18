'use client';

import React, { useState, useEffect } from 'react';
import { BusinessLayout } from '@/components/business/BusinessLayout';
import { AnalyticsCharts } from '@/components/business/AnalyticsCharts';
import { useNotifications } from '@/lib/hooks';
import { Card, CardContent } from '@/components/shared/Card';
import { Package, TrendingUp, Users, DollarSign } from 'lucide-react';
import { secureFetch } from '@/lib/secure-fetch';

export default function BusinessAnalyticsPage() {
  const [businessId, setBusinessId] = useState<string>('');
  const [stats, setStats] = useState({
    totalShipments: 0,
    pendingShipments: 0,
    inTransit: 0,
    delivered: 0,
    totalRevenue: 0,
    activeDrivers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { getUnreadCount } = useNotifications();

  const unreadCount = getUnreadCount();

  useEffect(() => {
    const fetchAnalytics = async () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const bId = user?.jobId;
      setBusinessId(bId);
      try {
        setIsLoading(true);
        const response = await secureFetch(`/api/business/analytics?businessId=${bId}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('[v0] Analytics error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <BusinessLayout currentPage="analytics" unreadNotifications={unreadCount}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics & Insights</h1>
          <p className="mt-2 text-muted-foreground">Real-time metrics and performance data</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Shipments</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stats.totalShipments}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Transit</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{stats.inTransit}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.delivered}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold text-accent mt-2">{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {businessId && <AnalyticsCharts businessId={businessId} isLoading={isLoading} />}
      </div>
    </BusinessLayout>
  );
}
