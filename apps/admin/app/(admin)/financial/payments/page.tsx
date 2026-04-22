'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@fastship/ui';
import { Button } from '@fastship/ui';
import {
  Search,
  Download,
  RefreshCw,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { secureFetch } from '@fastship/lib';

interface Payment {
  id: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  paymentMethod: string;
  transactionId: string;
  createdAt: string;
  reason?: string;
  referenceId?: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'PENDING' | 'COMPLETED' | 'FAILED'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const response = await secureFetch(`/api/admin/payments?status=${filterStatus}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [filterStatus]);

  const filteredPayments = payments.filter(payment =>payment?.transactionId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCompleted = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalFailed = payments
    .filter(p => p.status === 'FAILED')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payment Management</h1>
          <p className="text-slate-600 mt-2">Monitor all payments and transactions</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchPayments}
            variant="outline"
            className="flex items-center gap-2 rounded-full"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            onClick={() => {}}
            variant="outline"
            className="flex items-center gap-2 rounded-full"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  PKR {(totalCompleted / 1000).toFixed(2)}K
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">
                  PKR {(totalPending / 1000).toFixed(2)}K
                </p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Failed</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  PKR {(totalFailed / 1000).toFixed(2)}K
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 relative min-w-64">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by seller name or transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {['all', 'PENDING', 'COMPLETED', 'FAILED'].map((status) => (
            <Button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              variant={filterStatus === status ? 'primary' : 'outline'}
              className="rounded-full capitalize whitespace-nowrap"
            >
              {status.toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader title={`Payments (${filteredPayments.length})`} />
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No payments found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Reference</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Method</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{payment?.referenceId}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      PKR {payment.amount}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {payment.paymentMethod}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                      {payment.transactionId.slice(0, 12)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[payment.status]}`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
