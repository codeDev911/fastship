'use client';

import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { SellerOrder } from '@/lib/types';
import { Eye, Search } from 'lucide-react';

interface RecentOrdersTableProps {
  orders: SellerOrder[];
  onViewDetails?: (order: SellerOrder) => void;
  onFindCourier?: (order: SellerOrder) => void;
}

const statusConfig = {
  PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  PICKED_UP: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  BIDDING: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  ASSIGNED: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  FAILED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  IN_TRANSIT: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  DELIVERED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
};

const statusLabel = {
  PICKED_UP: 'PICKED_UP',
  PENDING: 'PENDING',
  BIDDING: 'BIDDING',
  ASSIGNED: 'ASSIGNED',
  IN_TRANSIT: 'IN_TRANSIT',
  FAILED: 'FAILED',
  DELIVERED: 'DELIVERED',
};

export function RecentOrdersTable({
  orders,
  onViewDetails,
  onFindCourier,
}: RecentOrdersTableProps) {
  return (
    <Card>
      <CardHeader title="Recent Orders" />
      <CardContent>
        <div className="w-full overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Order ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Destination</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Weight</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Final Cost</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => {
                const statusStyle = statusConfig[order?.status];
                return (
                  <tr key={order.id} className={idx !== orders.length - 1 ? 'border-b border-border/50' : ''}>
                    <td className="px-4 py-4 text-sm font-medium text-foreground">{order.id}</td>
                    <td className="px-4 py-4 text-sm text-foreground">{order?.deliveryAddress}</td>
                    <td className="px-4 py-4 text-sm text-foreground">{order.weight} kg</td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium border ${statusStyle?.bg} ${statusStyle?.text} ${statusStyle?.border}`}>
                        {statusLabel[order?.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-foreground">
                      {order.actualRate ? `${order.actualRate} PKR` : '—'}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex gap-2">
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => onFindCourier?.(order)}
                            className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 transition-opacity"
                          >
                            <Search className="h-3 w-3" />
                            Find Courier
                          </button>
                        )}
                        <button
                          onClick={() => onViewDetails?.(order)}
                          className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
