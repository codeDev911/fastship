'use client';

import { Card, CardHeader, CardContent } from '@fastship/ui';
import { Eye, Download } from 'lucide-react';

interface Payment {
  id: string;
  shipmentId: string;
  amount: number;
  tax?: number;
  commission?: number;
  paymentMethod: 'PREPAID' | 'COD';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  paidAt?: string;
  notes?: string;
}

interface RecentPaymentsTableProps {
  payments: Payment[];
  onViewDetails?: (payment: Payment) => void;
  onDownloadReceipt?: (payment: Payment) => void;
}

const statusConfig = {
  PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  COMPLETED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  FAILED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  REFUNDED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

const methodConfig = {
  PREPAID: { label: 'Prepaid', icon: '💳' },
  COD: { label: 'Cash on Delivery', icon: '💵' },
};

export function RecentPaymentsTable({
  payments,
  onViewDetails,
  onDownloadReceipt,
}: RecentPaymentsTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader title="Recent Payments" />
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-slate-500">No payments yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Recent Payments" />
      <CardContent>
        <div className="w-full overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 text-left text-sm font-semibold text-slate-900">
                  Payment ID
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-slate-900">
                  Shipment
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-slate-900">
                  Amount
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-slate-900">
                  Method
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-slate-900">
                  Status
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-slate-900">
                  Date
                </th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-slate-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const config = statusConfig[payment.paymentStatus];
                const methodInfo = methodConfig[payment.paymentMethod];

                return (
                  <tr
                    key={payment.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm font-medium text-slate-900">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                        {payment.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">
                      <span className="font-mono text-xs">
                        {payment.shipmentId.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-slate-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{methodInfo.icon}</span>
                        <span className="text-slate-700">{methodInfo.label}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
                      >
                        {payment.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      <div className="flex flex-col">
                        <span>{formatDate(payment.createdAt)}</span>
                        <span className="text-xs text-slate-500">{formatTime(payment.createdAt)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onViewDetails && (
                          <button
                            onClick={() => {
                                location.assign(`/seller/orders/${payment.shipmentId}`)
                            }}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                         
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

export default RecentPaymentsTable;
