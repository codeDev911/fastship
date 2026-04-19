'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@fastship/ui';
import { Button } from '@fastship/ui';
import {
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

interface Business {
  id: string;
  companyName: string;
  email: string;
  operatingRegion: string;
  commissionRate: number;
  rating: number;
  isActive: boolean;
  activeDrivers: number;
  createdAt: string;
}

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBusinesses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/businesses?status=${filterStatus}`);
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.data);
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [filterStatus]);

  const filteredBusinesses = businesses.filter(business =>
    business.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    business.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Businesses Management</h1>
          <p className="text-slate-600 mt-2">Manage logistics companies and dispatch partners</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchBusinesses}
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

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 relative min-w-64">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search businesses by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex gap-2">
          {['all', 'active', 'inactive'].map((status) => (
            <Button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              variant={filterStatus === status ? 'primary' : 'outline'}
              className="rounded-full capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Businesses Table */}
      <Card>
        <CardHeader title={`Businesses (${filteredBusinesses.length})`} />
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No businesses found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Company</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Region</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Active Drivers</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Commission</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Rating</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredBusinesses.map((business) => (
                  <tr key={business.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{business.companyName}</p>
                      <p className="text-xs text-slate-500">ID: {business.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{business.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{business.operatingRegion}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">{business.activeDrivers}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">{business.commissionRate}%</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-yellow-600">⭐ {business.rating.toFixed(1)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {business.isActive ? (
                        <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full w-fit">
                          <AlertCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/businesses/${business.id}`}>
                        <Button variant="outline" className="flex items-center gap-2 text-sm rounded-full">
                          <Eye className="w-3 h-3" />
                          View
                        </Button>
                      </Link>
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
