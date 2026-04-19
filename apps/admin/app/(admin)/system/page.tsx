'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@fastship/ui';
import { Button } from '@fastship/ui';
import { 
  AlertCircle, 
  CheckCircle2, 
  Server, 
  Database, 
  Activity, 
  Clock, 
  RotateCw,
  Zap,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Settings,
  Gauge,
  Shield,
  Trash2,
} from 'lucide-react';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'offline';
  message: string;
  responseTime?: number;
  lastChecked: Date;
}

interface AuditLog {
  id: string;
  action: string;
  type: 'APPROVAL' | 'REJECTION' | 'USER_CREATED' | 'PAYMENT' | 'ERROR';
  targetId: string;
  targetType: string;
  adminEmail: string;
  details: string;
  timestamp: Date;
}

export default function SystemHealthPage() {
  const [apiHealth, setApiHealth] = useState<HealthStatus>({
    status: 'healthy',
    message: 'Operational',
    responseTime: 0,
    lastChecked: new Date(),
  });

  const [dbHealth, setDbHealth] = useState<HealthStatus>({
    status: 'healthy',
    message: 'Connected',
    lastChecked: new Date(),
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconciliationResult, setReconciliationResult] = useState<any>(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check API health
      const apiStart = performance.now();
      const apiRes = await fetch('/api/health', { cache: 'no-store' });
      const apiTime = performance.now() - apiStart;

      if (apiRes.ok) {
        setApiHealth({
          status: 'healthy',
          message: 'All systems operational',
          responseTime: Math.round(apiTime),
          lastChecked: new Date(),
        });
      } else {
        setApiHealth({
          status: 'degraded',
          message: 'API responding with errors',
          responseTime: Math.round(apiTime),
          lastChecked: new Date(),
        });
      }

      // Check database health
      const dbRes = await fetch('/api/admin/system/db-health', { cache: 'no-store' });
      if (dbRes.ok) {
        setDbHealth({
          status: 'healthy',
          message: 'Database connected',
          lastChecked: new Date(),
        });
      } else {
        setDbHealth({
          status: 'offline',
          message: 'Database connection failed',
          lastChecked: new Date(),
        });
      }

      // Fetch audit logs
      const logsRes = await fetch('/api/admin/system/audit-logs?limit=20', { cache: 'no-store' });
      if (logsRes.ok) {
        const data = await logsRes.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check system health');
    } finally {
      setIsLoading(false);
    }
  };

  const reconcileAllWallets = async () => {
    try {
      setIsReconciling(true);
      setError(null);
      const response = await fetch('/api/admin/system/reconcile-wallets', { 
        method: 'POST',
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        setReconciliationResult(data.result);
      } else {
        setError('Wallet reconciliation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error during reconciliation');
    } finally {
      setIsReconciling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-amber-600';
      case 'offline':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'APPROVAL':
        return 'bg-green-100 text-green-800';
      case 'REJECTION':
        return 'bg-red-100 text-red-800';
      case 'USER_CREATED':
        return 'bg-blue-100 text-blue-800';
      case 'PAYMENT':
        return 'bg-purple-100 text-purple-800';
      case 'ERROR':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Management</h1>
          <p className="text-slate-600 mt-2">Monitor health, reconciliation, and system maintenance</p>
        </div>
        <Button
          onClick={checkHealth}
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2 rounded-full"
        >
          <RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">System Alert</p>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* API Health */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium mb-2">API Health</p>
                <h3 className={`text-2xl font-bold ${getStatusColor(apiHealth.status)}`}>
                  {apiHealth.status === 'healthy' ? '✓ Operational' : '✗ ' + apiHealth.status.toUpperCase()}
                </h3>
                <p className="text-sm text-slate-600 mt-2">{apiHealth.message}</p>
                {apiHealth.responseTime !== undefined && (
                  <p className="text-xs text-slate-500 mt-2">Response: {apiHealth.responseTime}ms</p>
                )}
              </div>
              <Server className={`h-8 w-8 ${getStatusColor(apiHealth.status)}`} />
            </div>
          </CardContent>
        </Card>

        {/* Database Health */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium mb-2">Database</p>
                <h3 className={`text-2xl font-bold ${getStatusColor(dbHealth.status)}`}>
                  {dbHealth.status === 'healthy' ? '✓ Connected' : '✗ Error'}
                </h3>
                <p className="text-sm text-slate-600 mt-2">{dbHealth.message}</p>
              </div>
              <Database className={`h-8 w-8 ${getStatusColor(dbHealth.status)}`} />
            </div>
          </CardContent>
        </Card>

        {/* Last Check */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium mb-2">Last Check</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {apiHealth.lastChecked.toLocaleTimeString()}
                </h3>
                <p className="text-sm text-slate-600 mt-2">
                  {Math.round((new Date().getTime() - apiHealth.lastChecked.getTime()) / 1000)}s ago
                </p>
              </div>
              <Clock className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance & Reconciliation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wallet Reconciliation */}
        <Card>
          <CardHeader title="Wallet Reconciliation" />
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Verify and fix wallet balances against ledger entries. This operation checks all wallets and auto-corrects any discrepancies.
            </p>
            <Button
              onClick={reconcileAllWallets}
              disabled={isReconciling}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isReconciling ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin mr-2" />
                  Running Reconciliation...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Reconcile All Wallets
                </>
              )}
            </Button>
            
            {reconciliationResult && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
                <p className="text-sm font-medium text-slate-900 mb-2">Reconciliation Results:</p>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>Total Checked: {reconciliationResult.length || 0} wallets</p>
                  <p className="text-green-600">Fixed Issues: {reconciliationResult.filter((r: any) => r.status === 'FIXED').length}</p>
                  <p className="text-yellow-600">No Issues: {reconciliationResult.filter((r: any) => r.status === 'OK').length}</p>
                  <p className="text-red-600">Errors: {reconciliationResult.filter((r: any) => r.status === 'ERROR').length}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Maintenance */}
        <Card>
          <CardHeader title="Database Health" />
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Monitor database connection, query performance, and storage usage.
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-700 mb-2">Connection Status</p>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${dbHealth.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-slate-600">{dbHealth.message}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-700 mb-2">Last Health Check</p>
                <p className="text-sm text-slate-600">{dbHealth.lastChecked.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Audit Logs</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{auditLogs.length}</p>
              </div>
              <Activity className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Status</p>
                <p className="text-2xl font-bold text-green-600 mt-2">Healthy</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Environment</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{process.env.NODE_ENV || 'dev'}</p>
              </div>
              <Settings className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">API Version</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">v1.0.0</p>
              </div>
              <Gauge className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Audit Logs */}
      <Card>
        <CardHeader title="Recent System Activity" />
        <CardContent>
          {auditLogs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No recent activity</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Time</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Action</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Target</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Admin</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{log.action}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.type)}`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {log.targetType}: {log.targetId.substring(0, 8)}...
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{log.adminEmail}</td>
                      <td className="py-3 px-4 text-sm text-slate-600 max-w-xs truncate">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader title="System Information & Configuration" />
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase mb-1">Environment</p>
              <p className="text-lg font-semibold text-slate-900">{process.env.NODE_ENV || 'development'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase mb-1">API Version</p>
              <p className="text-lg font-semibold text-slate-900">v1.0.0</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase mb-1">Database Status</p>
              <p className="text-lg font-semibold text-green-600">Connected</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase mb-1">Total Audit Logs</p>
              <p className="text-lg font-semibold text-slate-900">{auditLogs.length}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase mb-1">Last Updated</p>
              <p className="text-lg font-semibold text-slate-900">{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase mb-1">System Health</p>
              <p className="text-lg font-semibold text-green-600">✓ Healthy</p>
            </div>
              <div>
              <p className="text-sm text-muted-foreground mb-1">API Version</p>
              <p className="font-medium">v1.0.0</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Audit Logs</p>
              <p className="font-medium">{auditLogs.length} (last 20)</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
              <p className="font-medium">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 