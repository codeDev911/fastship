'use client';

import React, { useState, useEffect } from 'react';
import { SellerLayout } from '../../../components/SellerLayout';
import { Card, CardHeader, CardContent } from '@fastship/ui';
import { Eye, Filter, Download, TrendingUp } from 'lucide-react';
import { secureFetch } from '@fastship/lib';
import { useRouter } from 'next/navigation';

interface Payment {
  id: string;
  shipmentId: string;
  amount: number;
  tax: number;
  commission: number;
  driverPayable: number;
  paymentMethod: string;
  paymentStatus: string;
  paidAt: string | null;
  createdAt: string;
  shipment?: {
    id: string;
    deliveryCity: string;
    deliveryState: string;
    weight: number;
    status: string;
  };
}

const paymentStatusConfig = {
  PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  COMPLETED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  FAILED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  REFUNDED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

export default function SellerPaymentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sellerId, setSellerId] = useState<string>('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState({ pendingAmount: 0, totalPayments: 0, amountRatio: 0,peferredCurrency:"USD" });
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [walletBalance, setWalletBalance] = useState(0);

  // Get user from localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(storedUser);
    setSellerId(storedUser?.jobId || '');
  }, []);

  useEffect(() => {
    if (!sellerId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [paymentsRes] = await Promise.all([
          secureFetch(`/api/payments?sellerId=${sellerId}`),
        ]);

        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          setPayments(paymentsData.payments || []);
          setStats(paymentsData.stats || {});
        }

          setWalletBalance( 0);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sellerId]);

  const filteredPayments =
    filterStatus === 'all' ? payments : payments.filter((p) => p.paymentStatus === filterStatus);

  const completedCount = payments.filter((p) => p.paymentStatus === 'COMPLETED').length;
  const pendingCount = payments.filter((p) => p.paymentStatus === 'PENDING').length;

  return (
    <SellerLayout
      currentPage="payments"
      walletBalance={walletBalance}
      currency="PKR"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payments</h1>
            <p className="mt-2 text-muted-foreground">Track your shipment payments and earnings</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Total Payments Card */}
          <Card>
            <CardContent className="space-y-3 p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-blue-50 p-2.5">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-foreground">{payments.length}</p>
              </div>
              <p className="text-sm text-muted-foreground">Total Payments</p>
            </CardContent>
          </Card>

          {/* Completed Card */}
          <Card>
            <CardContent className="space-y-3 p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-green-50 p-2.5">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-xs text-green-700 font-medium">{stats?.peferredCurrency}  {stats.totalPayments?.toLocaleString() || '0'}</p>
            </CardContent>
          </Card>

          {/* Pending Card */}
          <Card>
            <CardContent className="space-y-3 p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-yellow-50 p-2.5">
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-xs text-yellow-700 font-medium">{stats?.peferredCurrency} {stats.pendingAmount?.toLocaleString() || '0'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <p className="font-medium text-foreground">Filter by Status:</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['all', 'COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors capitalize ${
                    filterStatus === status
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader title="Payment History" />
          <CardContent>
            <div className="w-full overflow-x-auto">
              {filteredPayments.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Payment ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Shipment</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Method</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment, idx) => {
                      const statusStyle = paymentStatusConfig[payment?.paymentStatus] || paymentStatusConfig.PENDING;
                      return (
                        <tr key={payment.id} className={idx !== filteredPayments.length - 1 ? 'border-b border-border/50' : ''}>
                          <td className="px-4 py-4 text-sm font-medium text-foreground truncate">{payment.id.slice(0, 8)}...</td>
                          <td className="px-4 py-4 text-sm text-foreground">
                            <div className="space-y-1">
                              <p className="font-medium">{payment.shipment?.deliveryCity}</p>
                              <p className="text-xs text-muted-foreground">{payment.shipment?.weight} kg</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-foreground">
                            {stats?.peferredCurrency}  {payment.amount?.toLocaleString() || '0'}
                          </td>
                          <td className="px-4 py-4 text-sm text-foreground">{payment.paymentMethod}</td>
                          <td className="px-4 py-4 text-sm">
                            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium border ${statusStyle?.bg} ${statusStyle?.text} ${statusStyle?.border}`}>
                              {payment.paymentStatus}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <button
                              onClick={() => router.push(`/seller/orders/${payment.shipmentId}`)}
                              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors"
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No payments found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </SellerLayout>
  );
}
