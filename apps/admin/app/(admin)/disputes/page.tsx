'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@fastship/ui';
import { Button } from '@fastship/ui';
import { Alert } from '@fastship/ui';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface Dispute {
  id: string;
  shipmentId: string;
  sellerName: string;
  driverName: string;
  reason: string;
  status: 'OPEN' | 'RESOLVED' | 'REJECTED';
  amount: number;
  claimedAt: string;
  description?: string;
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'OPEN' | 'RESOLVED' | 'REJECTED'>('OPEN');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [refundAmount, setRefundAmount] = useState<number | null>(null);

  const fetchDisputes = async () => {
    try {
      setIsLoading(true);
      const statusParam = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const response = await fetch(`/api/disputes${statusParam}`);
      if (response.ok) {
        const data = await response.json();
        setDisputes(data.data.map((d: any) => ({
          id: d.id,
          shipmentId: d.shipmentId,
          sellerName: d.seller?.companyName || 'Unknown Seller',
          driverName: d.driver?.user?.name || 'Unknown Driver',
          reason: d.reason,
          status: d.status,
          amount: d.amount,
          claimedAt: d.createdAt,
          description: d.description,
        })));
      }
    } catch (error) {
      console.error('Error fetching disputes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [filterStatus]);

  const handleResolveDispute = async (id: string, resolution: 'APPROVE' | 'REJECT', amount?: number) => {
    try {
      setProcessingId(id);
      const response = await fetch(`/api/disputes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: resolution === 'APPROVE' ? 'RESOLVED' : 'REJECTED',
          refundAmount: amount,
        }),
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: resolution === 'APPROVE' ? 'Dispute approved and refund initiated' : 'Dispute rejected',
        });
        fetchDisputes();
        setSelectedDispute(null);
        setRefundAmount(null);
      } else {
        setMessage({ type: 'error', text: 'Failed to resolve dispute' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error resolving dispute' });
    } finally {
      setProcessingId(null);
    }
  };

  const openCount = disputes.filter(d => d.status === 'OPEN').length;
  const resolvedCount = disputes.filter(d => d.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dispute Resolution</h1>
          <p className="text-slate-600 mt-2">Manage complaints and resolve disputes</p>
        </div>
        <Button
          onClick={fetchDisputes}
          variant="outline"
          className="flex items-center gap-2 rounded-full"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Open Disputes</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{openCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Resolved</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{resolvedCount}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Amount</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  PKR {(disputes.reduce((sum, d) => sum + d.amount, 0) / 1000).toFixed(0)}K
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message */}
      {message && (
        <Alert title={message.type === 'success' ? 'Success' : 'Error'} type={message.type}>
          <p className="text-sm">{message.text}</p>
        </Alert>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'OPEN', 'RESOLVED', 'REJECTED'].map((status) => (
          <Button
            key={status}
            onClick={() => setFilterStatus(status as any)}
            variant={filterStatus === status ? 'primary' : 'outline'}
            className="rounded-full capitalize"
          >
            {status.toLowerCase()}
          </Button>
        ))}
      </div>

      {/* Disputes List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
        </div>
      ) : disputes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No disputes found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <Card key={dispute.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-slate-900">Shipment {dispute.shipmentId.slice(0, 8)}</h3>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        dispute.status === 'OPEN' ? 'bg-red-100 text-red-700' :
                        dispute.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {dispute.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-slate-600">Seller</p>
                        <p className="font-medium text-slate-900">{dispute.sellerName}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Driver</p>
                        <p className="font-medium text-slate-900">{dispute.driverName}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Reason</p>
                        <p className="font-medium text-slate-900">{dispute.reason}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Amount</p>
                        <p className="font-medium text-red-600">PKR {dispute.amount}</p>
                      </div>
                    </div>

                    {dispute.description && (
                      <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm text-slate-700">{dispute.description}</p>
                      </div>
                    )}
                  </div>

                  {dispute.status === 'OPEN' && (
                    <div className="flex flex-col gap-2 min-w-fit">
                      {!selectedDispute || selectedDispute.id !== dispute.id ? (
                        <>
                          <Button
                            onClick={() => setSelectedDispute(dispute)}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-full whitespace-nowrap"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleResolveDispute(dispute.id, 'REJECT')}
                            disabled={processingId === dispute.id}
                            variant="destructive"
                            className="rounded-full whitespace-nowrap"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Refund Amount</label>
                            <input
                              type="number"
                              value={refundAmount || dispute.amount}
                              onChange={(e) => setRefundAmount(Number(e.target.value))}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          </div>
                          <Button
                            onClick={() => handleResolveDispute(dispute.id, 'APPROVE', refundAmount || dispute.amount)}
                            disabled={processingId === dispute.id}
                            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full text-sm"
                          >
                            {processingId === dispute.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Confirm Refund
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedDispute(null);
                              setRefundAmount(null);
                            }}
                            variant="outline"
                            className="w-full rounded-full text-sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
