'use client';

import React, { useState, useEffect } from 'react';
import { BusinessLayout } from '@fastship/ui';
import { OverviewStats } from '@fastship/ui';
import { Card, CardHeader, CardContent } from '@fastship/ui';
import { useShipments, useNotifications } from '@fastship/lib/client';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader } from 'lucide-react';
import { secureFetch } from '@fastship/lib/client';

export default function BusinessOverviewPage() {
  const { shipments, isLoading: shipmentsLoading } = useShipments();
  const { notifications, getUnreadCount } = useNotifications();
  const [businessId, setBusinessId] = useState<string>('');
  const [recentActivityData, setRecentActivityData] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  const unreadCount = getUnreadCount();
  
  // Calculate today's delivered shipments only
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  const stats = {
    totalShipments: shipments.length,
    activeShipments: shipments.filter(s => ['PENDING', 'ASSIGNED', 'PICKUP', 'PICKED_UP', 'IN_TRANSIT'].includes(s.status?.toUpperCase())).length,
    deliveredShipments: shipments.filter(s => {
      const isDelivered = s.status?.toUpperCase() === 'DELIVERED';
      const deliveredDate = s.deliveredAt ? new Date(s.deliveredAt) : new Date(s.updatedAt);
      const isToday = deliveredDate >= todayStart && deliveredDate < todayEnd;
      return isDelivered && isToday;
    }).length,
    totalDrivers: 12,
    revenue: 45230.5,
  };

  // Get business ID and fetch hourly activity data
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const bId = user?.jobId;
    setBusinessId(bId);

    const fetchActivityData = async () => {
      try {
        setIsLoadingActivity(true);
        const response = await secureFetch(`/api/shipments?businessId=${bId}`);
        
        if (response.ok) {
          const data = await response.json();
          const businessShipments = data.data || [];

          // Calculate hourly activity for today
          const today = new Date();
          const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

          const hourlyMap = new Map<number, { orders: number; deliveries: number }>();

          // Initialize 24 hours
          for (let hour = 0; hour < 24; hour++) {
            hourlyMap.set(hour, { orders: 0, deliveries: 0 });
          }

          // Count shipments by hour
          businessShipments.forEach((shipment: any) => {
            const createdDate = new Date(shipment.createdAt);
            const isToday = createdDate >= todayStart && createdDate < todayEnd;
            
            if (isToday) {
              const hour = createdDate.getHours();
              const hourData = hourlyMap.get(hour) || { orders: 0, deliveries: 0 };
              hourData.orders += 1;
              // Check for DELIVERED status (uppercase)
              if (shipment.status?.toUpperCase() === 'DELIVERED') {
                hourData.deliveries += 1;
              }
              hourlyMap.set(hour, hourData);
            }
          });

          // Convert to array showing ALL hours with data (not just 8 specific hours)
          const calculatedActivity = Array.from({ length: 24 }, (_, hour) => {
            const data = hourlyMap.get(hour) || { orders: 0, deliveries: 0 };
            const period = hour < 12 ? 'AM' : hour === 12 ? 'PM' : 'PM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            return {
              time: `${displayHour}${period}`,
              orders: data.orders,
              deliveries: data.deliveries,
            };
          });

          setRecentActivityData(calculatedActivity);
        }
      } catch (error) {
        console.error('Error fetching activity data:', error);
        setRecentActivityData([]);
      } finally {
        setIsLoadingActivity(false);
      }
    };

    if (bId) {
      fetchActivityData();
    }
  }, []);

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
          />
          <CardContent>
            {isLoadingActivity ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <Loader className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-slate-600">Loading activity data...</p>
                </div>
              </div>
            ) : recentActivityData.length > 0 ? (
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
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-slate-500">No activity data available for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Summary */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
              <p className="mt-2 text-3xl font-bold text-yellow-600">
                {shipments.filter(s => s.status?.toUpperCase() === 'PENDING').length}
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
                {shipments.filter(s => s.status?.toUpperCase() === 'IN_TRANSIT').length}
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
                {shipments.filter(s => {
                  const isDelivered = s.status?.toUpperCase() === 'DELIVERED';
                  const deliveredDate = s.deliveredAt ? new Date(s.deliveredAt) : new Date(s.updatedAt);
                  const isToday = deliveredDate >= todayStart && deliveredDate < todayEnd;
                  return isDelivered && isToday;
                }).length}
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
