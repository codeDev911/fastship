'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Sample data for charts
const deliveryData = [
  { date: 'Mon', completed: 12, pending: 4, failed: 1 },
  { date: 'Tue', completed: 15, pending: 3, failed: 0 },
  { date: 'Wed', completed: 10, pending: 5, failed: 2 },
  { date: 'Thu', completed: 18, pending: 2, failed: 1 },
  { date: 'Fri', completed: 22, pending: 1, failed: 0 },
  { date: 'Sat', completed: 8, pending: 3, failed: 1 },
  { date: 'Sun', completed: 6, pending: 2, failed: 0 },
];

const revenueData = [
  { month: 'Jan', revenue: 4000, earnings: 2400 },
  { month: 'Feb', revenue: 5200, earnings: 2800 },
  { month: 'Mar', revenue: 6100, earnings: 3200 },
  { month: 'Apr', revenue: 7800, earnings: 4100 },
  { month: 'May', revenue: 8900, earnings: 4700 },
  { month: 'Jun', revenue: 9500, earnings: 5100 },
];

const shipmentStatus = [
  { name: 'Pending', value: 15 },
  { name: 'Assigned', value: 24 },
  { name: 'In Transit', value: 32 },
  { name: 'Delivered', value: 287 },
  { name: 'Failed', value: 8 },
];

const COLORS = ['#FFA500', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444'];

interface AnalyticsChartsProps {
  isLoading?: boolean;
}

export function AnalyticsCharts({ isLoading = false }: AnalyticsChartsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Analytics & Reports</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your delivery performance and revenue
        </p>
      </div>

      {/* Weekly Delivery Stats */}
      <Card>
        <CardHeader title="Weekly Delivery Performance" description="Last 7 days" />
        <CardContent>
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
              <p className="text-2xl font-bold text-foreground">97.3%</p>
              <p className="text-xs text-green-600">↑ 2.1% from last month</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Avg. Delivery Time</p>
              <p className="text-2xl font-bold text-foreground">2.4 hrs</p>
              <p className="text-xs text-green-600">↓ 0.3 hrs from last month</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
              <p className="text-2xl font-bold text-foreground">4.7/5.0</p>
              <p className="text-xs text-green-600">↑ 0.2 from last month</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Avg. Order Value</p>
              <p className="text-2xl font-bold text-foreground">$142.50</p>
              <p className="text-xs text-green-600">↑ $12.30 from last month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
