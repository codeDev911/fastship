'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@fastship/ui';
import { Button } from '@fastship/ui';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  Download,
} from 'lucide-react';
import { secureFetch } from '@fastship/lib';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

interface LedgerEntry {
  id: string;
  amount: number;
  type: string;
  category: string;
  balanceAfter: number;
  createdAt: string;
}

interface ReconciliationLog {
  id: string;
  expected: number;
  actual: number;
  difference: number;
  status: string;
  message: string | null;
  createdAt: string;
}

interface WalletDetail {
  id: string;
  name: string;
  entityType: string;
  balance: number;
  escrowBalance: number;
  available: number;
  totalEarnings: number;
  totalWithdrawals: number;
  createdAt: string;
  lastUpdated: string;
  transactions: Transaction[];
  ledgerEntries: LedgerEntry[];
  reconciliationLogs: ReconciliationLog[];
  seller?: {
    id: string;
    companyName: string;
    user: { name: string; email: string; phone: string };
  };
  driver?: {
    id: string;
    user: { name: string; email: string; phone: string };
    totalDeliveries: number;
  };
  business?: {
    id: string;
    companyName: string;
    user: { email: string; phone: string };
  };
}

export default function WalletDetailPage() {
  const params = useParams();
  const router = useRouter();
  const walletId = params.id as string;

  const [wallet, setWallet] = useState<WalletDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'ledger' | 'reconciliation'>(
    'overview'
  );
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileMessage, setReconcileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchWallet = async () => {
    try {
      setIsLoading(true);
      const response = await secureFetch(`/api/admin/wallets/${walletId}`);
      if (response.ok) {
        const { data } = await response.json();
        setWallet(data);
      } else {
        setError('Failed to fetch wallet details');
      }
    } catch (err) {
      console.error('Error fetching wallet:', err);
      setError('Failed to load wallet');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (walletId) {
      fetchWallet();
    }
  }, [walletId]);

  const handleReconcile = async () => {
    try {
      setIsReconciling(true);
      const response = await secureFetch(`/api/admin/wallets/${walletId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reconcile' }),
      });

      if (response.ok) {
        const { data } = await response.json();
        setReconcileMessage({
          type: 'success',
          text: `Wallet reconciled. Status: ${data.status}`,
        });
        setTimeout(() => fetchWallet(), 1000);
      } else {
        setReconcileMessage({ type: 'error', text: 'Failed to reconcile wallet' });
      }
    } catch (err) {
      setReconcileMessage({ type: 'error', text: 'Error reconciling wallet' });
    } finally {
      setIsReconciling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-red-600" />
        </div>
      </div>
    );
  }

  if (error || !wallet) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-red-600" />
            <p className="text-lg font-semibold text-slate-900">{error || 'Wallet not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <Button
          onClick={fetchWallet}
          variant="outline"
          className="flex items-center gap-2 rounded-full"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Wallet Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{wallet.name}</h1>
              <p className="text-slate-500 mt-1">
                {wallet.entityType} Wallet • ID: {wallet.id}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Balance</p>
              <p className="text-2xl font-bold text-green-600 mt-1">Rs {wallet.balance.toFixed(0)}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Escrow (Locked)</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">Rs {wallet.escrowBalance.toFixed(0)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Available</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">Rs {Number(wallet.balance-wallet.escrowBalance).toFixed(0)}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Total Earnings</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">Rs {wallet.totalEarnings.toFixed(0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entity Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader title="Entity Details" />
          <CardContent className="space-y-4">
            {wallet.seller && (
              <>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Company</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{wallet.seller.companyName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Contact</p>
                  <p className="text-sm text-slate-900 mt-1">{wallet.seller.user.name}</p>
                  <p className="text-xs text-slate-500">{wallet.seller.user.email}</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">ID</p>
                  <p className="text-xs text-slate-500">{wallet.seller.user.id}</p>

                </div>
              </>
            )}
            {wallet.driver && (
              <>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Name</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{wallet.driver.user.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Total Deliveries</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{wallet.driver.totalDeliveries}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Contact</p>
                  <p className="text-sm text-slate-900 mt-1">{wallet.driver.user.email}</p>
                </div>
              </>
            )}
            {wallet.business && (
              <>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Company</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{wallet.business.companyName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Email</p>
                  <p className="text-sm text-slate-900 mt-1">{wallet.business.user.email}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Financial Summary" />
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Total Earnings</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">Rs {wallet.totalEarnings.toFixed(0)}</p>
            </div>
            <div className="border-t pt-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Total Withdrawals</p>
              <p className="text-2xl font-bold text-red-600 mt-1">Rs {wallet.totalWithdrawals.toFixed(0)}</p>
            </div>
            <div className="border-t pt-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Account Created</p>
              <p className="text-sm text-slate-900 mt-1">{new Date(wallet.createdAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Actions" />
          <CardContent className="space-y-3">
            <Button
              onClick={handleReconcile}
              disabled={isReconciling}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              {isReconciling ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Reconcile Wallet
            </Button>
            <Button
              onClick={() => {
                /* Export logic */
              }}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 rounded-lg"
            >
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Reconciliation Message */}
      {reconcileMessage && (
        <Card>
          <CardContent className={`py-4 ${reconcileMessage.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-3">
              {reconcileMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <p className={`text-sm font-medium ${reconcileMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {reconcileMessage.text}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {(['overview', 'transactions', 'ledger', 'reconciliation'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium text-sm transition border-b-2 ${
              activeTab === tab
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <Card>
          <CardHeader title="Wallet Overview" />
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-2">Wallet ID</p>
                <p className="font-mono text-sm text-slate-900 break-all">{wallet.id}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-2">Last Updated</p>
                <p className="text-sm text-slate-900">
                  {new Date(wallet.lastUpdated).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'transactions' && (
        <Card>
          <CardHeader title="Transactions" />
          <CardContent className="overflow-x-auto">
            {wallet.transactions.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No transactions yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Type</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-slate-600">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {wallet.transactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            txn.type === 'CREDIT'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {txn.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold text-slate-900">
                        Rs {txn.amount.toFixed(0)}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{txn.description}</td>
                      <td className="py-3 px-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            txn.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {txn.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(txn.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'ledger' && (
        <Card>
          <CardHeader title="Ledger Entries" />
          <CardContent className="overflow-x-auto">
            {wallet.ledgerEntries.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No ledger entries yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Category</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-slate-600">Amount</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-slate-600">Balance After</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {wallet.ledgerEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            entry.type === 'CREDIT'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {entry.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{entry.category}</td>
                      <td className="py-3 px-4 text-right text-sm font-semibold text-slate-900">
                        Rs {entry.amount.toFixed(0)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold text-slate-900">
                        Rs {entry.balanceAfter.toFixed(0)}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'reconciliation' && (
        <Card>
          <CardHeader title="Reconciliation Logs" />
          <CardContent className="overflow-x-auto">
            {wallet.reconciliationLogs.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No reconciliation logs yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-slate-600">Expected</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-slate-600">Actual</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-slate-600">Difference</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Message</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {wallet.reconciliationLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.status === 'OK'
                              ? 'bg-green-100 text-green-800'
                              : log.status === 'FIXED'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold text-slate-900">
                        Rs {log.expected.toFixed(0)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold text-slate-900">
                        Rs {log.actual.toFixed(0)}
                      </td>
                      <td className={`py-3 px-4 text-right text-sm font-semibold ${
                        log.difference === 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        Rs {log.difference.toFixed(0)}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{log.message || '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
