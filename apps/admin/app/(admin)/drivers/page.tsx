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
  MapPin,
  Navigation,
} from 'lucide-react';

interface Driver {
  id: string;
  name: string;
  email: string;
  licenseNumber: string;
  vehicleType: string;
  status: string;
  rating: number;
  totalDeliveries: number;
  isVerified: boolean;
  isActive: boolean;
  currentLocation?: string;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDrivers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/drivers?status=${filterStatus}`);
      if (response.ok) {
        const data = await response.json();
        setDrivers(data.data);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [filterStatus]);

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Drivers Management</h1>
          <p className="text-slate-600 mt-2">Manage drivers and their performance</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchDrivers}
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
            placeholder="Search drivers by name, email, or license..."
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

      {/* Drivers Table */}
      <Card>
        <CardHeader title={`Drivers (${filteredDrivers.length})`} />
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No drivers found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">License</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Vehicle</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Deliveries</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Rating</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{driver.name}</p>
                      <p className="text-xs text-slate-500">{driver.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{driver.licenseNumber}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{driver.vehicleType}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">{driver.totalDeliveries}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-yellow-600">⭐ {driver.rating.toFixed(1)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {driver.isActive ? (
                          <>
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            <span className="text-xs font-medium text-green-700">Active</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                            <span className="text-xs font-medium text-slate-600">Inactive</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/drivers/${driver.id}`}>
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
