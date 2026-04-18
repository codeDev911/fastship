'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import {
  TrendingUp,
  Package,
  Users,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  Award,
  BadgeCheck,
  MapPin,
  Zap,
  Activity,
} from 'lucide-react';

interface DashboardMetrics {
  totalShipments: number;
  activeShipments: number;
  deliveredToday: number;
  failedShipments: number;
  totalRevenue: number;
  totalUsers: number;
  activeDrivers: number;
  verifiedSellers: number;
  activeBusinesses: number;
  pendingApprovals: number;
  openDisputes: number;
  failedPayments: number;
  pendingSettlements: number;
  recentShipments: Array<any>;
  recentDisputes: Array<any>;
  topDrivers: Array<any>;
  topSellers: Array<any>;
  pendingSettlementsList: Array<any>;
  pendingApprovalsList: Array<any>;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  PICKED_UP: 'bg-indigo-100 text-indigo-700',
  IN_TRANSIT: 'bg-cyan-100 text-cyan-700',
  DELIVERED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  OPEN: 'bg-red-100 text-red-700',
  RESOLVED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
};

export default function AdminDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/dashboard');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-red-600 mx-auto mb-3" />
          <p className="text-slate-600">Loading dashboard metrics...</p>
        </div>
      </div>
    );
  }

  const criticalAlerts = metrics.pendingApprovals + metrics.openDisputes + metrics.failedPayments;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600 mt-2">
            {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <Button
          onClick={fetchMetrics}
          variant="outline"
          className="flex items-center gap-2 rounded-full"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Critical Alert Banner */}
      {criticalAlerts > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-900">Action Required</p>
            <p className="text-sm text-red-700 mt-1">
              You have {metrics.pendingApprovals} pending approvals, {metrics.openDisputes} open disputes, and {metrics.failedPayments} failed payments requiring attention.
            </p>
          </div>
          <button onClick={() => router.push('/admin/approvals')} className="text-red-600 hover:text-red-700 font-medium text-sm">
            Review
          </button>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Shipments */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Total Shipments</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{metrics.totalShipments}</p>
                <p className="text-xs text-slate-500 mt-2">{metrics.activeShipments} active now</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">Rs {(metrics.totalRevenue / 100000).toFixed(1)}L</p>
                <p className="text-xs text-slate-500 mt-2">From completed payments</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Active Users</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{metrics.totalUsers}</p>
                <p className="text-xs text-slate-500 mt-2">{metrics.activeDrivers} drivers active</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">System Alerts</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{criticalAlerts}</p>
                <p className="text-xs text-slate-500 mt-2">Require immediate attention</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase">Delivered Today</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{metrics.deliveredToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase">Verified Sellers</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{metrics.verifiedSellers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase">Active Businesses</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{metrics.activeBusinesses}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase">Pending Settlements</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">{metrics.pendingSettlements}</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Action Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => router.push('/admin/approvals')}
          className="border-2 border-yellow-200 bg-yellow-50 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="text-left">
              <p className="text-sm font-medium text-yellow-700">Pending Approvals</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{metrics.pendingApprovals}</p>
            </div>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
        </button>

        <button
          onClick={() => router.push('/admin/disputes')}
          className="border-2 border-red-200 bg-red-50 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="text-left">
              <p className="text-sm font-medium text-red-700">Open Disputes</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{metrics.openDisputes}</p>
            </div>
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
        </button>

        <button
          onClick={() => router.push('/admin/financial/payments')}
          className="border-2 border-orange-200 bg-orange-50 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="text-left">
              <p className="text-sm font-medium text-orange-700">Failed Payments</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{metrics.failedPayments}</p>
            </div>
            <XCircle className="w-5 h-5 text-orange-600" />
          </div>
        </button>

        <button
          onClick={() => router.push('/admin/shipments')}
          className="border-2 border-green-200 bg-green-50 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="text-left">
              <p className="text-sm font-medium text-green-700">Delivered Today</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{metrics.deliveredToday}</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Shipments */}
          <Card>
            <CardHeader title="Recent Shipments" />
            <CardContent>
              {metrics.recentShipments.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">No recent shipments</p>
              ) : (
                <div className="space-y-3">
                  {metrics.recentShipments.map((shipment) => (
                    <button
                      key={shipment.id}
                      onClick={() => router.push(`/admin/shipments/${shipment.id}`)}
                      className="w-full border rounded-lg p-3 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{shipment.seller?.companyName || 'Unknown'}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {shipment.pickupCity} → {shipment.deliveryCity}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full inline-block whitespace-nowrap ${
                            statusColors[shipment.status] || 'bg-slate-100 text-slate-700'
                          }`}>
                            {shipment.status}
                          </span>
                          <p className="text-sm font-medium text-slate-900 mt-1">Rs {shipment.actualRate?.toFixed(0) || '0'}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Disputes */}
          <Card>
            <CardHeader title="Recent Disputes" />
            <CardContent>
              {metrics.recentDisputes.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">No recent disputes</p>
              ) : (
                <div className="space-y-3">
                  {metrics.recentDisputes.map((dispute) => (
                    <div key={dispute.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{dispute.reason}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(dispute.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full inline-block whitespace-nowrap ${
                            statusColors[dispute.status] || 'bg-slate-100 text-slate-700'
                          }`}>
                            {dispute.status}
                          </span>
                          <p className="text-sm font-medium text-red-600 mt-1">Rs {dispute.amount.toFixed(0)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Top Performers */}
          <Card>
            <CardHeader title="Top Drivers" />
            <CardContent>
              {metrics.topDrivers.length === 0 ? (
                <p className="text-sm text-slate-500">No drivers yet</p>
              ) : (
                <div className="space-y-3">
                  {metrics.topDrivers.map((driver, idx) => (
                    <div
                      key={driver.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{driver.user.name}</p>
                          <p className="text-xs text-slate-500">{driver.totalDeliveries} deliveries</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <span className="text-xs font-bold text-amber-600">⭐ {driver.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Sellers */}
          <Card>
            <CardHeader title="Top Sellers" />
            <CardContent>
              {metrics.topSellers.length === 0 ? (
                <p className="text-sm text-slate-500">No sellers yet</p>
              ) : (
                <div className="space-y-3">
                  {metrics.topSellers.map((seller, idx) => (
                    <button
                      key={seller.id}
                      onClick={() => router.push(`/admin/sellers/${seller.id}`)}
                      className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-600">
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{seller.companyName}</p>
                          <p className="text-xs text-slate-500">{seller.totalOrders} orders</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <span className="text-xs font-bold text-amber-600">⭐ {seller.rating.toFixed(1)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Approvals List */}
          {metrics.pendingApprovalsList.length > 0 && (
            <Card>
              <CardHeader title="Pending Approvals" />
              <CardContent>
                <div className="space-y-2">
                  {metrics.pendingApprovalsList.map((approval) => (
                    <button
                      key={approval.id}
                      onClick={() => router.push('/admin/approvals')}
                      className="w-full text-left border rounded p-2 hover:bg-slate-50 transition-colors text-xs"
                    >
                      <p className="font-medium text-slate-900">{approval.applicantName}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{approval.applicationType}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Settlements */}
          {metrics.pendingSettlementsList.length > 0 && (
            <Card>
              <CardHeader title="Pending Settlements" />
              <CardContent>
                <div className="space-y-2">
                  {metrics.pendingSettlementsList.map((settlement) => (
                    <div
                      key={settlement.id}
                      className="border rounded p-2 bg-orange-50"
                    >
                      <p className="text-xs font-medium text-slate-900">{settlement.business?.companyName}</p>
                      <p className="text-xs text-orange-600 font-bold mt-1">Rs {settlement.totalAmount.toFixed(0)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader title="Quick Actions" />
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <button
              onClick={() => router.push('/admin/approvals')}
              className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <BadgeCheck className="w-6 h-6 text-slate-600 mb-2" />
              <span className="text-xs font-medium text-slate-700 text-center">Approvals</span>
            </button>
            <button
              onClick={() => router.push('/admin/disputes')}
              className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <AlertCircle className="w-6 h-6 text-slate-600 mb-2" />
              <span className="text-xs font-medium text-slate-700 text-center">Disputes</span>
            </button>
            <button
              onClick={() => router.push('/admin/sellers')}
              className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Award className="w-6 h-6 text-slate-600 mb-2" />
              <span className="text-xs font-medium text-slate-700 text-center">Sellers</span>
            </button>
            <button
              onClick={() => router.push('/admin/drivers')}
              className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Truck className="w-6 h-6 text-slate-600 mb-2" />
              <span className="text-xs font-medium text-slate-700 text-center">Drivers</span>
            </button>
            <button
              onClick={() => router.push('/admin/financial/wallets')}
              className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <DollarSign className="w-6 h-6 text-slate-600 mb-2" />
              <span className="text-xs font-medium text-slate-700 text-center">Wallets</span>
            </button>
            <button
              onClick={() => router.push('/admin/shipments')}
              className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Package className="w-6 h-6 text-slate-600 mb-2" />
              <span className="text-xs font-medium text-slate-700 text-center">Shipments</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
