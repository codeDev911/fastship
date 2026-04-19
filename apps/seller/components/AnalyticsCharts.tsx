'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
} from 'recharts';
import { Card, CardHeader, CardContent } from '@fastship/ui';
import { Loader } from 'lucide-react';
import { secureFetch } from '@fastship/lib';

interface AnalyticsData {
  byStatus: Array<{
    status: string;
    _count: number;
  }>;
  todayCount: number;
  deliveredCount: number;
  revenue?: number;
  earnings?: number;
}

interface AnalyticsChartsProps {
  sellerId: string;
}

const COLORS = {
  PENDING: '#FBBF24',
  ASSIGNED: '#3B82F6',
  PICKUP: '#8B5CF6',
  PICKED_UP: '#06B6D4',
  IN_TRANSIT: '#EC4899',
  DELIVERED: '#10B981',
  FAILED: '#EF4444',
  CANCELLED: '#F43F5E',
  RETURNED: '#14B8A6',
};

const STATUS_COLORS = [
  '#FBBF24', // PENDING - yellow
  '#3B82F6', // ASSIGNED - blue
  '#8B5CF6', // PICKUP - purple
  '#06B6D4', // PICKED_UP - cyan
  '#EC4899', // IN_TRANSIT - pink
  '#10B981', // DELIVERED - green
  '#EF4444', // FAILED - red
  '#F43F5E', // CANCELLED - rose
  '#14B8A6', // RETURNED - teal
];

export function AnalyticsCharts({ sellerId }: AnalyticsChartsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const response = await secureFetch(`/api/analytics?sellerId=${sellerId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();
        setAnalyticsData(data.stats);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    if (sellerId) {
      fetchAnalytics();
    }
  }, [sellerId]);

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        const response = await secureFetch(`/api/sellers/orders?sellerId=${sellerId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch shipments');
        }

        const data = await response.json();
        const shipments = data.data || [];

        // Calculate trend data for the last 7 days
        const today = new Date();
        const trendMap = new Map<string, { orders: number; delivered: number,returned:number,cancelled:number,failed:number }>();

        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
          const dateKey = date.toISOString().split('T')[0];
          trendMap.set(dateKey, { orders: 0, delivered: 0,returned:0,cancelled:0,failed:0 });
        }

        // Count orders by date
        shipments.forEach((shipment: any) => {
          const createdDate = new Date(shipment.createdAt);
          const dateKey = createdDate.toISOString().split('T')[0];
          
          const dayData = trendMap.get(dateKey);
          if (dayData) {
            dayData.orders += 1;
            if (shipment.status === 'DELIVERED') {
              dayData.delivered += 1;
            }else if(shipment.status === 'RETURNED'){
              dayData.returned += 1;
            } else if(shipment.status === 'CANCELLED'){
              dayData.cancelled += 1;
            } else if(shipment.status === 'FAILED'){
              dayData.failed += 1;
            }
          }
        });

        // Convert map to array with day names
        const calculatedTrend = Array.from(trendMap.entries()).map(
          ([dateKey, data], index) => {
            const date = new Date(dateKey);
            return {
              name: date.toLocaleDateString('en-US', { weekday: 'short' }),
              date: dateKey,
              orders: data.orders,
              delivered: data.delivered,
              cancelled:data.cancelled,
              failed:data.failed,
              returned:data.returned
            };
          }
        );

        setTrendData(calculatedTrend);
      } catch (err) {
        console.error('Error fetching trend data:', err);
        // Fall back to empty trend data if fetch fails
        setTrendData([]);
      }
    };

    if (sellerId) {
      fetchTrendData();
    }
  }, [sellerId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-red-600" />
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{error || 'No analytics data available'}</p>
      </div>
    );
  }

  // Process status data for charts
  const statusData = analyticsData.byStatus.map((item) => ({
    name: item.status,
    value: item._count,
    color: COLORS[item.status as keyof typeof COLORS] || '#6B7280',
  }));

  const totalOrders = statusData.reduce((sum, item) => sum + item.value, 0);

  // Calculate metrics
  const deliveryRate =
    totalOrders > 0
      ? ((analyticsData.deliveredCount / totalOrders) * 100).toFixed(1)
      : 0;

  // Status distribution for bar chart
  const barChartData = statusData
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm text-slate-600">Total Orders</p>
            <p className="text-3xl font-bold text-slate-900">{totalOrders}</p>
            <p className="text-xs text-slate-500">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm text-slate-600">Delivered</p>
            <p className="text-3xl font-bold text-green-600">{analyticsData.deliveredCount}</p>
            <p className="text-xs text-slate-500">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm text-slate-600">Delivery Rate</p>
            <p className="text-3xl font-bold text-blue-600">{deliveryRate}%</p>
            <p className="text-xs text-slate-500">Success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm text-slate-600">Today's Orders</p>
            <p className="text-3xl font-bold text-purple-600">{analyticsData.todayCount}</p>
            <p className="text-xs text-slate-500">Created today</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Status Distribution Pie Chart */}
        <Card>
          <CardHeader title="Order Status Distribution" />
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => `${value} orders`}
                  contentStyle={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Bar Chart */}
        <Card>
          <CardHeader title="Orders by Status" />
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={barChartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) => `${value} orders`}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Trend Line Chart */}
        <Card className="lg:col-span-2">
          <CardHeader title="Weekly Order Trend" />
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={trendData}
                margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) => `${value} orders`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Total Orders"
                />
                <Line
                  type="monotone"
                  dataKey="delivered"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Delivered"
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke="#FF0000"
                  strokeWidth={2}
                  dot={{ fill: '#FF0000', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Failed"
                />
                <Line
                  type="monotone"
                  dataKey="returned"
                  stroke="#000"
                  strokeWidth={2}
                  dot={{ fill: '#000', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Returned"
                />
                <Line
                  type="monotone"
                  dataKey="cancelled"
                  stroke="#FFA500"
                  strokeWidth={2}
                  dot={{ fill: '#FFA500', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Cancelled"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Summary Table */}
        <Card className="lg:col-span-2">
          <CardHeader title="Status Summary" />
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 px-3 text-left text-sm font-semibold text-slate-900">
                      Status
                    </th>
                    <th className="py-2 px-3 text-right text-sm font-semibold text-slate-900">
                      Count
                    </th>
                    <th className="py-2 px-3 text-right text-sm font-semibold text-slate-900">
                      Percentage
                    </th>
                    <th className="py-2 px-3 text-right text-sm font-semibold text-slate-900">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {statusData.map((item, index) => (
                    <tr
                      key={item.name}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 px-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-slate-700 font-medium">
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-sm font-semibold text-slate-900">
                        {item.value}
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-slate-600">
                        {totalOrders > 0
                          ? ((item.value / totalOrders) * 100).toFixed(1)
                          : 0}
                        %
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              backgroundColor: item.color,
                              width: `${totalOrders > 0 ? (item.value / totalOrders) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AnalyticsCharts;
