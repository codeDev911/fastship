'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@fastship/ui';
import { Button } from '@fastship/ui';
import {
  Search,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Eye,
  Filter,
} from 'lucide-react';
import { secureFetch } from '@fastship/lib';

interface Wallet {
  id: string;
  name: string;
  entityId: string;
  entityType: string;
  balance: number;
  escrow: number;
  available: number;
  totalEarnings: number;
  totalWithdrawals: number;
  createdAt: string;
  lastUpdated: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'seller' | 'driver' | 'business'>('all');

  const fetchWallets = async (page: number = 1) => {
    try {
      setIsLoading(true);
      const response = await secureFetch(`/api/admin/wallets?page=${page}&limit=20&type=${filterType}`);
      if (response.ok) {
        const { data, pagination } = await response.json();
        setWallets(data);
        setPagination(pagination);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets(1);
  }, [filterType]);

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  const totalEscrow = wallets.reduce((sum, w) => sum + w.escrow, 0);
  const totalEarnings = wallets.reduce((sum, w) => sum + w.totalEarnings, 0);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (pagination?.pages || 1)) {
      fetchWallets(newPage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Wallet Management</h1>
          <p className="text-slate-600 mt-1">Monitor and manage all wallet balances</p>
        </div>
        <Button
          onClick={() => fetchWallets(currentPage)}
          variant="outline"
          className="flex items-center gap-2 rounded-full"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Total Balance</p>
                <p className="text-2xl font-bold text-green-600 mt-2">$ {totalBalance.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Escrow (Locked)</p>
                <p className="text-2xl font-bold text-yellow-600 mt-2">$ {totalEscrow.toFixed(2)}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Total Earnings</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">$ {totalEarnings.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Active Wallets</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{pagination?.total || 0}</p>
              </div>
              <DollarSign className="w-8 h-8 text-slate-400 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search wallets by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'seller', 'driver', 'business'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                filterType === type
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader title="All Wallets" />
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
            </div>
          ) : wallets.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No wallets found</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-4 px-4 font-semibold text-sm text-slate-600">Entity</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-slate-600">Type</th>
                    <th className="text-right py-4 px-4 font-semibold text-sm text-slate-600">Balance</th>
                    <th className="text-right py-4 px-4 font-semibold text-sm text-slate-600">Escrow</th>
                    <th className="text-right py-4 px-4 font-semibold text-sm text-slate-600">Available</th>
                    <th className="text-right py-4 px-4 font-semibold text-sm text-slate-600">Total Earnings</th>
                    <th className="text-right py-4 px-4 font-semibold text-sm text-slate-600">Created</th>
                    <th className="text-center py-4 px-4 font-semibold text-sm text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((wallet) => (
                    <tr key={wallet.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-slate-900">{wallet.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{wallet.entityId.slice(0, 12)}...</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            wallet.entityType === 'Seller'
                              ? 'bg-blue-100 text-blue-800'
                              : wallet.entityType === 'Driver'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {wallet.entityType}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <p className="font-semibold text-slate-900">$ {wallet.balance.toFixed(2)}</p>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <p className="font-semibold text-yellow-600">$ {wallet.escrow.toFixed(2)}</p>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <p className="font-semibold text-green-600">$ {wallet.available.toFixed(2)}</p>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <p className="font-semibold text-blue-600">$ {wallet.totalEarnings.toFixed(2)}</p>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <p className="text-sm text-slate-600">{new Date(wallet.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Link href={`/admin/financial/wallets/${wallet.id}`}>
                          <Button
                            variant="outline"
                            className="inline-flex items-center gap-2 text-xs"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    Page {pagination.page} of {pagination.pages} ({pagination.total} total wallets)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="outline"
                      className="text-sm"
                    >
                      Previous
                    </Button>
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                      .filter((p) => Math.abs(p - currentPage) <= 1 || p === 1 || p === pagination.pages)
                      .map((p, idx, arr) => (
                        <React.Fragment key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-2">...</span>}
                          <Button
                            onClick={() => handlePageChange(p)}
                            variant={p === currentPage ? 'primary' : 'outline'}
                            className="text-sm w-10"
                          >
                            {p}
                          </Button>
                        </React.Fragment>
                      ))}
                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.pages}
                      variant="outline"
                      className="text-sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
