'use client';

import React, { useState } from 'react';
import { BusinessLayout } from '@/components/business/BusinessLayout';
import { OverviewStats } from '@/components/business/OverviewStats';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { useShipments, useNotifications } from '@/lib/hooks';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const recentActivityData = [
  { time: '8 AM', orders: 5, deliveries: 3 },
  { time: '10 AM', orders: 8, deliveries: 6 },
  { time: '12 PM', orders: 12, deliveries: 10 },
  { time: '2 PM', orders: 15, deliveries: 12 },
  { time: '4 PM', orders: 18, deliveries: 15 },
  { time: '6 PM', orders: 22, deliveries: 18 },
];

export default function BusinessOverviewPage() {
  const { shipments, isLoading: shipmentsLoading } = useShipments();
  const { notifications, getUnreadCount } = useNotifications();

  const unreadCount = getUnreadCount();
  
  const stats = {
    totalShipments: shipments.length,
    activeShipments: shipments.filter(s => ['pending', 'assigned', 'in-transit'].includes(s.status)).length,
    totalDrivers: 12,
    revenue: 45230.5,
  };

  return (
    <BusinessLayout currentPage="overview" unreadNotifications={unreadCount}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="mt-2 text-muted-foreground">Welcome back! Here&apos;s your business performance</p>
        </div>

        {/* Stats Cards */}
        <OverviewStats stats={stats} isLoading={shipmentsLoading} />

        {/* Recent Activity */}
        <Card>
          <CardHeader
            title="Today's Activity"
            description="Orders and deliveries throughout the day"
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={recentActivityData}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFA500" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FFA500" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#FFA500" 
                  fillOpacity={1} 
                  fill="url(#colorOrders)"
                  name="Orders"
                />
                <Area 
                  type="monotone" 
                  dataKey="deliveries" 
                  stroke="#10B981" 
                  fill="#10B981"
                  fillOpacity={0.1}
                  name="Deliveries"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Summary */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
              <p className="mt-2 text-3xl font-bold text-yellow-600">
                {shipments.filter(s => s.status === 'pending').length}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Awaiting driver assignment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">In Transit</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">
                {shipments.filter(s => s.status === 'in-transit').length}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Currently being delivered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Delivered Today</p>
              <p className="mt-2 text-3xl font-bold text-green-600">
                {shipments.filter(s => s.status === 'delivered').length}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Successfully completed
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </BusinessLayout>
  );
}
