'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader } from 'lucide-react';
import { secureFetch } from '@fastship/lib';

const COLORS = ['#FFA500', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444'];

interface AnalyticsChartsProps {
  businessId: string;
  isLoading?: boolean;
}

export function AnalyticsCharts({ businessId, isLoading: initialLoading = false }: AnalyticsChartsProps) {
  const [deliveryData, setDeliveryData] = useState<any[]>([]);
  const [shipmentStatus, setShipmentStatus] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [kpis, setKpis] = useState({
    deliveryRate: 0,
    avgDeliveryTime: 0,
    avgOrderValue: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all shipments and payments for this business
        const [shipmentsRes, paymentsRes] = await Promise.all([
          secureFetch(`/api/shipments?businessId=${businessId}`),
          secureFetch(`/api/payments?businessId=${businessId}`),
        ]);

        if (!shipmentsRes.ok || !paymentsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const shipmentData = await shipmentsRes.json();
        const paymentData = await paymentsRes.json();
        const shipments = shipmentData.data || [];
        const payments = paymentData.payments || [];

        // Calculate delivery data for last 7 days
        const today = new Date();
        const deliveryMap = new Map<string, { completed: number; pending: number; failed: number }>();

        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateKey = date.toLocaleDateString('en-US', { weekday: 'short' });
          const dateISOKey = date.toISOString().split('T')[0];
          deliveryMap.set(dateISOKey, { completed: 0, pending: 0, failed: 0 });
        }

        // Count shipments by date and status
        shipments.forEach((shipment: any) => {
          const createdDate = new Date(shipment.createdAt);
          const dateKey = createdDate.toISOString().split('T')[0];
          
          const dayData = deliveryMap.get(dateKey);
          if (dayData) {
            if (shipment.status === 'DELIVERED') {
              dayData.completed += 1;
            } else if (shipment.status === 'FAILED' || shipment.status === 'CANCELLED') {
              dayData.failed += 1;
            } else {
              dayData.pending += 1;
            }
          }
        });

        // Convert to array with day labels
        const calculatedDeliveryData = Array.from(deliveryMap.entries()).map(
          ([dateKey, data]) => {
            const date = new Date(dateKey);
            return {
              date: date.toLocaleDateString('en-US', { weekday: 'short' }),
              ...data,
            };
          }
        );

        setDeliveryData(calculatedDeliveryData);

        // Calculate shipment status distribution
        const statusMap = new Map<string, number>();
        shipments.forEach((shipment: any) => {
          const status = shipment.status || 'UNKNOWN';
          statusMap.set(status, (statusMap.get(status) || 0) + 1);
        });

        const statusLabels: { [key: string]: string } = {
          PENDING: 'Pending',
          ASSIGNED: 'Assigned',
          PICKUP: 'Pickup',
          PICKED_UP: 'Picked Up',
          IN_TRANSIT: 'In Transit',
          DELIVERED: 'Delivered',
          FAILED: 'Failed',
          CANCELLED: 'Cancelled',
          RETURNED: 'Returned',
        };

        const calculatedStatusData = Array.from(statusMap.entries())
          .map(([status, count]) => ({
            name: statusLabels[status] || status,
            value: count,
          }))
          .sort((a, b) => b.value - a.value);

        setShipmentStatus(calculatedStatusData);

        // Calculate monthly revenue from payments (last 6 months)
        const monthlyRevenueMap = new Map<string, { revenue: number; earnings: number }>();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
          const date = new Date(today);
          date.setMonth(date.getMonth() - i);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyRevenueMap.set(monthKey, { revenue: 0, earnings: 0 });
        }

        // Sum payments by month
        payments.forEach((payment: any) => {
          const paymentDate = new Date(payment.createdAt);
          const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
          
          const monthData = monthlyRevenueMap.get(monthKey);
          if (monthData) {
            monthData.revenue += payment.amount || 0;
            monthData.earnings += (payment.driverPayable || 0);
          }
        });

        // Convert to array with proper month labels
        const calculatedRevenueData = Array.from(monthlyRevenueMap.entries()).map(
          ([monthKey, data], index) => {
            const monthIndex = parseInt(monthKey.split('-')[1]) - 1;
            return {
              month: months[index] || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][monthIndex],
              revenue: data.revenue,
              earnings: data.earnings,
            };
          }
        );

        setRevenueData(calculatedRevenueData);

        // Calculate KPIs
        const totalShipments = shipments.length;
        const deliveredShipments = shipments.filter((s: any) => s.status === 'DELIVERED').length;
        const deliveryRate = totalShipments > 0 ? ((deliveredShipments / totalShipments) * 100).toFixed(1) : 0;

        const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const avgOrderValue = totalShipments > 0 ? (totalRevenue / totalShipments).toFixed(2) : 0;

        // Calculate avg delivery time
        let totalDeliveryTime = 0;
        let deliveryCount = 0;
        shipments.forEach((shipment: any) => {
          if (shipment.status === 'DELIVERED' && shipment.deliveredAt && shipment.createdAt) {
            const createdTime = new Date(shipment.createdAt).getTime();
            const deliveredTime = new Date(shipment.deliveredAt).getTime();
            const diffHours = (deliveredTime - createdTime) / (1000 * 60 * 60);
            totalDeliveryTime += diffHours;
            deliveryCount += 1;
          }
        });

        const avgDeliveryTime = deliveryCount > 0 ? (totalDeliveryTime / deliveryCount).toFixed(1) : 0;

        setKpis({
          deliveryRate: parseFloat(deliveryRate as string),
          avgDeliveryTime: parseFloat(avgDeliveryTime as string),
          avgOrderValue: parseFloat(avgOrderValue as string),
          totalRevenue: totalRevenue,
        });
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics data');
        // Set empty data on error
        setDeliveryData([]);
        setShipmentStatus([]);
        setRevenueData([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (businessId) {
      fetchAnalyticsData();
    }
  }, [businessId]);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Analytics & Reports</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your delivery performance and revenue
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-slate-600">Loading analytics...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* Weekly Delivery Stats */}
          <Card>
            <CardHeader title="Weekly Delivery Performance" description="Last 7 days" />
            <CardContent>
              {deliveryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={deliveryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="completed" fill="#10B981" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="pending" fill="#FFA500" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="failed" fill="#EF4444" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-slate-500">No delivery data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Monthly Revenue */}
            <Card>
              <CardHeader title="Monthly Revenue" description="Last 6 months" />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#FFA500"
                      strokeWidth={2}
                      dot={{ fill: '#FFA500', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="earnings"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Shipment Status Distribution */}
            <Card>
              <CardHeader title="Shipment Status Distribution" description="All shipments" />
              <CardContent className="flex items-center justify-center">
                {shipmentStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={shipmentStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {shipmentStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-slate-500">No shipment data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics */}
          <Card>
            <CardHeader title="Key Performance Indicators" />
            <CardContent>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Delivery Rate</p>
                  <p className="text-2xl font-bold text-foreground">{kpis.deliveryRate.toFixed(1)}%</p>
                  <p className="text-xs text-green-600">All shipments</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Avg. Delivery Time</p>
                  <p className="text-2xl font-bold text-foreground">{kpis.avgDeliveryTime.toFixed(1)} hrs</p>
                  <p className="text-xs text-green-600">Delivered orders</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                  <p className="text-2xl font-bold text-foreground">PKR {parseInt(kpis.avgOrderValue).toLocaleString()}</p>
                  <p className="text-xs text-green-600">Based on payments</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground">PKR {(kpis.totalRevenue / 1000).toFixed(1)}k</p>
                  <p className="text-xs text-green-600">This period</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
