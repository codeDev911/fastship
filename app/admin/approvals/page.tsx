'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Alert } from '@/components/shared/Alert';
import {
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface Approval {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber?: string;
  businessType?: string;
  operatingRegion?: string;
  applicationType: 'DRIVER' | 'BUSINESS' | 'RATE_CHANGE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchApprovals = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/approvals?type=${filterType}`);
      if (response.ok) {
        const data = await response.json();
        setApprovals(data.data);
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [filterType]);

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      const response = await fetch(`/api/admin/approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Application approved successfully!' });
        fetchApprovals();
      } else {
        setMessage({ type: 'error', text: 'Failed to approve' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error approving application' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async (id: string) => {
    if (!rejectionReason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a rejection reason' });
      return;
    }

    try {
      setProcessingId(id);
      const response = await fetch(`/api/admin/approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', rejectionReason }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Application rejected' });
        setRejectingId(null);
        setRejectionReason('');
        fetchApprovals();
      } else {
        setMessage({ type: 'error', text: 'Failed to reject' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error rejecting application' });
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = approvals.filter(a => a.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Approval Queue</h1>
          <p className="text-slate-600 mt-2">Review and approve pending applications</p>
        </div>
        <Button
          onClick={fetchApprovals}
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
                <p className="text-sm text-slate-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Approved</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {approvals.filter(a => a.status === 'APPROVED').length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Rejected</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {approvals.filter(a => a.status === 'REJECTED').length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
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
        {['all', 'DRIVER', 'BUSINESS'].map((type) => (
          <Button
            key={type}
            onClick={() => setFilterType(type)}
            variant={filterType === type ? 'primary' : 'outline'}
            className="rounded-full capitalize"
          >
            {type.toLowerCase()}
          </Button>
        ))}
      </div>

      {/* Applications */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
        </div>
      ) : approvals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No applications to review</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <Card key={approval.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-slate-900">{approval.name}</h3>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full capitalize">
                        {approval.applicationType.toLowerCase()}
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        approval.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        approval.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {approval.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Email</p>
                        <p className="font-medium text-slate-900">{approval.email}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Phone</p>
                        <p className="font-medium text-slate-900">{approval.phone}</p>
                      </div>
                      {approval.applicationType === 'DRIVER' ? (
                        <>
                          <div>
                            <p className="text-slate-600">License Number</p>
                            <p className="font-medium text-slate-900">{approval.licenseNumber || 'N/A'}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-slate-600">Business Type</p>
                            <p className="font-medium text-slate-900">{approval.businessType || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Operating Region</p>
                            <p className="font-medium text-slate-900">{approval.operatingRegion || 'N/A'}</p>
                          </div>
                        </>
                      )}
                      <div>
                        <p className="text-slate-600">Submitted</p>
                        <p className="font-medium text-slate-900">
                          {new Date(approval.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {approval.status === 'PENDING' && (
                    <>
                      {rejectingId !== approval.id ? (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(approval.id)}
                            disabled={processingId === approval.id}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-full whitespace-nowrap"
                          >
                            {processingId === approval.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Approve
                          </Button>
                          <Button
                            onClick={() => setRejectingId(approval.id)}
                            variant="destructive"
                            className="rounded-full whitespace-nowrap"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <div className="w-96 space-y-3 bg-red-50 p-4 rounded-lg border border-red-200">
                          <div>
                            <label className="text-sm font-medium text-slate-700 block mb-2">Rejection Reason</label>
                            <textarea
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Explain why this application is being rejected..."
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleRejectSubmit(approval.id)}
                              disabled={processingId === approval.id || !rejectionReason.trim()}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm"
                            >
                              {processingId === approval.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Confirm Rejection'}
                            </Button>
                            <Button
                              onClick={() => {
                                setRejectingId(null);
                                setRejectionReason('');
                              }}
                              variant="outline"
                              className="flex-1 rounded-full text-sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
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
