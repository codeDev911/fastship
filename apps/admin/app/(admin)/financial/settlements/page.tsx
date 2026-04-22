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
  TrendingDown,
  Calendar,
} from 'lucide-react';
import { secureFetch } from '@fastship/lib';

interface Settlement {
  id: string;
  sellerName: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  settlementDate: string;
  bankAccount: string;
  processedDate?: string;
  reference: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSettlements = async () => {
    try {
      setIsLoading(true);
      const response = await secureFetch(`/api/admin/settlements?status=${filterStatus}`);
      if (response.ok) {
        const data = await response.json();
        setSettlements(data.data);
      }
    } catch (error) {
      console.error('Error fetching settlements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [filterStatus]);

  const filteredSettlements = settlements.filter(settlement =>
    settlement.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    settlement.reference.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSettled = settlements
    .filter(s => s.status === 'COMPLETED')
    .reduce((sum, s) => sum + s.amount, 0);
  const pendingAmount = settlements
    .filter(s => s.status === 'PENDING')
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settlement History</h1>
          <p className="text-slate-600 mt-2">Track seller payouts and settlements</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchSettlements}
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
                <p className="text-sm text-slate-600">Total Settled</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  PKR {(totalSettled / 1000).toFixed(0)}K
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pending Payouts</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">
                  PKR {(pendingAmount / 1000).toFixed(0)}K
                </p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Settlements</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{settlements.length}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-blue-500" />
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
            placeholder="Search by seller name or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {['all', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].map((status) => (
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

      {/* Settlements Table */}
      <Card>
        <CardHeader title={`Settlements (${filteredSettlements.length})`} />
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
            </div>
          ) : filteredSettlements.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No settlements found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Seller</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Bank Account</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Date Requested</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSettlements.map((settlement) => (
                  <tr key={settlement.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{settlement.sellerName}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">
                      PKR {settlement.amount}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {settlement.bankAccount.slice(0, 4)}****{settlement.bankAccount.slice(-2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(settlement.settlementDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[settlement.status]}`}>
                        {settlement.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                      {settlement.reference}
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
