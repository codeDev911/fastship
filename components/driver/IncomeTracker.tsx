'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Wallet, Download } from 'lucide-react';
import { Button } from '@/components/shared/Button';

interface IncomeData {
  date: string;
  earnings: number;
}

interface IncomeTrackerProps {
  totalEarnings: number;
  completedDeliveries: number;
  isLoading?: boolean;
}

const incomeChartData: IncomeData[] = [
  { date: 'Mon', earnings: 85.5 },
  { date: 'Tue', earnings: 120.0 },
  { date: 'Wed', earnings: 95.25 },
  { date: 'Thu', earnings: 150.75 },
  { date: 'Fri', earnings: 180.5 },
  { date: 'Sat', earnings: 125.0 },
  { date: 'Sun', earnings: 65.0 },
];

const monthlyIncomeData = [
  { month: 'Jan', earnings: 2400 },
  { month: 'Feb', earnings: 2210 },
  { month: 'Mar', earnings: 2900 },
  { month: 'Apr', earnings: 2780 },
  { month: 'May', earnings: 3200 },
  { month: 'Jun', earnings: 3500 },
];

interface TransactionProps {
  date: string;
  description: string;
  amount: number;
  type: 'earning' | 'deduction';
}

function Transaction({ date, description, amount, type }: TransactionProps) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
      <div>
        <p className="font-medium text-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
      <p
        className={`text-lg font-bold ${
          type === 'earning' ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {type === 'earning' ? '+' : '-'}${amount.toFixed(2)}
      </p>
    </div>
  );
}

export function IncomeTracker({
  totalEarnings,
  completedDeliveries,
  isLoading = false,
}: IncomeTrackerProps) {
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');

  const weeklyEarnings = incomeChartData.reduce((sum, day) => sum + day.earnings, 0);
  const avgPerDelivery = completedDeliveries > 0 ? (totalEarnings / completedDeliveries).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Income Tracking</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor your earnings and payment history
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                ${totalEarnings.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-green-600">↑ 12% from last month</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <DollarSign className="h-6 w-6 text-accent" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">This Week</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                ${weeklyEarnings.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-green-600">7 days activity</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg. Per Delivery</p>
              <p className="mt-2 text-3xl font-bold text-foreground">${avgPerDelivery}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {completedDeliveries} deliveries
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weekly Earnings */}
        <Card>
          <CardHeader title="Weekly Earnings" description="Last 7 days" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incomeChartData}>
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
                <Bar dataKey="earnings" fill="#FFA500" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader title="Monthly Income Trend" description="Last 6 months" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyIncomeData}>
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
                <Line
                  type="monotone"
                  dataKey="earnings"
                  stroke="#FFA500"
                  strokeWidth={2}
                  dot={{ fill: '#FFA500', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader
          title="Recent Transactions"
          description="Your earnings and deductions"
          action={
            <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />}>
              Export
            </Button>
          }
        />
        <CardContent className="space-y-3">
          <Transaction
            date="Today, 2:30 PM"
            description="Delivery - Order #ORD-2024-001"
            amount={15.5}
            type="earning"
          />
          <Transaction
            date="Today, 1:15 PM"
            description="Delivery - Order #ORD-2024-002"
            amount={18.25}
            type="earning"
          />
          <Transaction
            date="Yesterday, 4:45 PM"
            description="Delivery - Order #ORD-2024-003"
            amount={22.0}
            type="earning"
          />
          <Transaction
            date="Yesterday, 11:30 AM"
            description="Platform Fee"
            amount={2.5}
            type="deduction"
          />
          <Transaction
            date="June 1, 5:00 PM"
            description="Weekly Payout"
            amount={485.75}
            type="earning"
          />
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader title="Payment Method" />
        <CardContent className="space-y-3">
          <div className="rounded-lg border-2 border-accent bg-accent/5 p-4">
            <p className="text-xs font-medium text-muted-foreground">Default Bank Account</p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              Bank of America ••••5678
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Next payout: June 5, 2024
            </p>
          </div>
          <Button variant="outline" fullWidth>
            Update Payment Method
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
