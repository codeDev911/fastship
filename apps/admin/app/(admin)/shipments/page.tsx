'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@fastship/ui';
import { Button } from '@fastship/ui';
import {
  Search,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
  MapPin,
  Truck,
} from 'lucide-react';

interface Shipment {
  id: string;
  pickupCity: string;
  deliveryCity: string;
  weight: number;
  status: string;
  paymentMethod: string;
  actualRate?: number;
  createdAt: string;
  sellerName?: string;
  businessName?: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  PICKUP: 'bg-purple-100 text-purple-700',
  PICKED_UP: 'bg-indigo-100 text-indigo-700',
  IN_TRANSIT: 'bg-cyan-100 text-cyan-700',
  DELIVERED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};

export default function ShipmentsPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchShipments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/shipments?status=${filterStatus}`);
      if (response.ok) {
        const data = await response.json();
        setShipments(data.data);
      }
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [filterStatus]);

  const filteredShipments = shipments.filter(shipment =>
    shipment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shipment.pickupCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shipment.deliveryCity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Shipments Management</h1>
          <p className="text-slate-600 mt-2">Track and manage all shipments in the system</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchShipments}
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
            placeholder="Search by shipment ID or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {['all', 'PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'FAILED'].map((status) => (
            <Button
              key={status}
              onClick={() => setFilterStatus(status)}
              variant={filterStatus === status ? 'primary' : 'outline'}
              className="rounded-full capitalize whitespace-nowrap"
            >
              {status.toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Shipments Table */}
      <Card>
        <CardHeader title={`Shipments (${filteredShipments.length})`} />
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No shipments found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Shipment ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Route</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Weight</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Rate</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Payment</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredShipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{shipment.id.slice(0, 12)}</p>
                      <p className="text-xs text-slate-500">{new Date(shipment.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <div className="text-sm">
                          <p className="text-slate-900">{shipment.pickupCity} → {shipment.deliveryCity}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{shipment.weight} kg</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {shipment.actualRate ? `PKR ${shipment.actualRate}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{shipment.paymentMethod}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[shipment.status] || 'bg-slate-100 text-slate-700'}`}>
                        {shipment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Button 
                        onClick={() => router.push(`/admin/shipments/${shipment.id}`)}
                        variant="outline" 
                        className="flex items-center gap-2 text-sm rounded-full"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
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
