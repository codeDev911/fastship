'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@fastship/ui';
import { Button } from '@fastship/ui';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Eye,
  Filter,
  RefreshCw,
  Trash2,
  Clock,
  BarChart3,
  Database,
} from 'lucide-react';
import { secureFetch } from '@fastship/lib';

interface Alert {
  id: string;
  walletId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: 'WALLET_MISMATCH' | 'BANK_MISMATCH';
  message: string;
  status: 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED';
  expectedCents: number;
  actualCents: number;
  diffCents: number;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  wallet: {
    id: string;
    sellerId?: string;
    businessId?: string;
    driverId?: string;
  };
}

interface AlertStats {
  total: number;
  bySeverity: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  byStatus: {
    NEW: number;
    ACKNOWLEDGED: number;
    RESOLVED: number;
  };
  requiresAction: number;
}

interface DbStats {
  reconciliationLogs: {
    count: number;
    sizeBytes: number;
    sizeMB: string;
  };
  reconciliationAlerts: {
    count: number;
    sizeBytes: number;
    sizeMB: string;
  };
}

const severityColors: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border-red-300',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-300',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  LOW: 'bg-blue-100 text-blue-700 border-blue-300',
};

const statusColors: Record<string, string> = {
  NEW: 'bg-purple-100 text-purple-700',
  ACKNOWLEDGED: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
};

const severityIcons: Record<string, React.ReactNode> = {
  CRITICAL: <AlertCircle className="w-4 h-4" />,
  HIGH: <AlertTriangle className="w-4 h-4" />,
  MEDIUM: <AlertTriangle className="w-4 h-4" />,
  LOW: <Clock className="w-4 h-4" />,
};

export default function ReconciliationPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchWallet, setSearchWallet] = useState('');

  const formatCents = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const response = await secureFetch('/api/admin/reconciliation/alerts', {
        method: 'GET',
      });

      if (!response.ok) throw new Error('Failed to fetch alerts');

      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await secureFetch('/api/admin/reconciliation/stats', {
        method: 'GET',
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchDbStats = async () => {
    try {
      const response = await secureFetch('/api/admin/reconciliation/db-stats', {
        method: 'GET',
      });

      if (!response.ok) throw new Error('Failed to fetch DB stats');

      const data = await response.json();
      setDbStats(data);
    } catch (error) {
      console.error('Error fetching DB stats:', error);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      const response = await secureFetch(
        `/api/admin/reconciliation/alerts/${alertId}/acknowledge`,
        { method: 'POST' }
      );

      if (!response.ok) throw new Error('Failed to acknowledge alert');

      fetchAlerts();
      fetchStats();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleResolve = async (
    alertId: string,
    resolution: string
  ) => {
    try {
      const response = await secureFetch(
        `/api/admin/reconciliation/alerts/${alertId}/resolve`,
        {
          method: 'POST',
          body: JSON.stringify({ resolution }),
        }
      );

      if (!response.ok) throw new Error('Failed to resolve alert');

      fetchAlerts();
      fetchStats();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchAlerts(), fetchStats(), fetchDbStats()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const filteredAlerts = alerts.filter((alert) => {
    if (selectedSeverity !== 'all' && alert.severity !== selectedSeverity)
      return false;
    if (selectedStatus !== 'all' && alert.status !== selectedStatus) return false;
    if (selectedType !== 'all' && alert.type !== selectedType) return false;
    if (
      searchWallet &&
      !alert.walletId.toLowerCase().includes(searchWallet.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reconciliation Alerts
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage financial reconciliation issues
          </p>
        </div>
        <Button
          onClick={() => {
            fetchAlerts();
            fetchStats();
            fetchDbStats();
          }}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Alerts</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.total}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">Requires Action</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {stats.requiresAction}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">Critical</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {stats.bySeverity.CRITICAL}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">Resolved</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {stats.byStatus.RESOLVED}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Database Stats */}
      {dbStats && (
        <Card>
          <CardHeader className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Database Statistics</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="text-sm text-gray-600">Reconciliation Logs</p>
                <div className="mt-2 space-y-1">
                  <p className="text-lg font-semibold">
                    {dbStats?.reconciliationLogs?.count} records
                  </p>
                  <p className="text-sm text-gray-500">
                    {dbStats?.reconciliationLogs?.sizeMB} MB
                  </p>
                </div>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-sm text-gray-600">Reconciliation Alerts</p>
                <div className="mt-2 space-y-1">
                  <p className="text-lg font-semibold">
                    {dbStats?.reconciliationAlerts?.count} records
                  </p>
                  <p className="text-sm text-gray-500">
                    {dbStats?.reconciliationAlerts?.sizeMB} MB
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Severity Breakdown */}
      {stats && (
        <Card>
          <CardHeader className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Alerts by Severity</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.bySeverity).map(([severity, count]) => (
                <div
                  key={severity}
                  className={`p-4 rounded-lg border ${
                    severityColors[severity as keyof typeof severityColors]
                  }`}
                >
                  <p className="text-sm font-medium">{severity}</p>
                  <p className="text-2xl font-bold mt-2">{count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Wallet ID
              </label>
              <input
                type="text"
                placeholder="Search wallet..."
                value={searchWallet}
                onChange={(e) => setSearchWallet(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="NEW">New</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="WALLET_MISMATCH">Wallet Mismatch</option>
                <option value="BANK_MISMATCH">Bank Mismatch</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            Alerts ({filteredAlerts.length})
          </h3>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Loading alerts...
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No alerts found
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 border rounded-lg ${severityColors[alert.severity]}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {severityIcons[alert.severity]}
                        <span className="font-semibold">{alert.severity}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[alert.status]}`}>
                          {alert.status}
                        </span>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          {alert.type}
                        </span>
                      </div>

                      <p className="text-sm font-mono mb-2">
                        Wallet: {alert.walletId}
                      </p>

                      <p className="text-sm mb-2">{alert.message}</p>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-gray-600">Expected</p>
                          <p className="font-semibold">
                            ${formatCents(alert.expectedCents)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Actual</p>
                          <p className="font-semibold">
                            ${formatCents(alert.actualCents)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Difference</p>
                          <p className="font-semibold text-red-600">
                            ${formatCents(alert.diffCents)}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 mt-2">
                        Created: {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {alert.status === 'NEW' && (
                        <Button
                          onClick={() => handleAcknowledge(alert.id)}
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                      {alert.status !== 'RESOLVED' && (
                        <Button
                          onClick={() => {
                            const resolution = prompt(
                              'Enter resolution details:'
                            );
                            if (resolution) {
                              handleResolve(alert.id, resolution);
                            }
                          }}
                          size="sm"
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
