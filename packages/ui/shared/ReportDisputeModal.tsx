'use client';

import React, { useState } from 'react';
import { Button } from '@fastship/ui';
import { Card, CardContent } from '@fastship/ui';
import { Input } from '@fastship/ui';
import { Label } from '@fastship/ui';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { Alert } from '@fastship/ui';
import { Textarea } from '@fastship/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@fastship/ui';

interface ReportDisputeModalProps {
  shipmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userRole: 'SELLER' | 'DRIVER' | 'BUSINESS';
}

export function ReportDisputeModal({
  shipmentId,
  isOpen,
  onClose,
  onSuccess,
  userRole,
}: ReportDisputeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    amount: '',
  });

  const reasons = [
    { value: 'NOT_DELIVERED', label: 'Item Not Delivered' },
    { value: 'DAMAGED', label: 'Shipment Damaged' },
    { value: 'LOST', label: 'Shipment Lost' },
    { value: 'WRONG_ITEM', label: 'Wrong Item Received' },
    { value: 'INCOMPLETE', label: 'Incomplete Delivery' },
    { value: 'QUALITY_ISSUE', label: 'Quality Issue' },
    { value: 'LATE_DELIVERY', label: 'Late Delivery' },
    { value: 'OTHER', label: 'Other' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReasonChange = (value: string) => {
    setFormData((prev) => ({ ...prev, reason: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.reason || !formData.description || !formData.amount) {
      setError('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipmentId,
          reason: formData.reason,
          description: formData.description,
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to report dispute');
        return;
      }

      // Reset form
      setFormData({
        reason: '',
        description: '',
        amount: '',
      });

      // Call success callback and close
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-foreground">Report Dispute</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <CardContent className="p-6 space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert className="bg-red-50 border-red-200 p-4 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="font-medium text-red-900">{error}</p>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Shipment ID Display */}
            <div>
              <Label className="text-xs text-muted-foreground">Shipment ID</Label>
              <p className="font-mono text-sm text-foreground">{shipmentId}</p>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.reason} onValueChange={handleReasonChange} disabled={isLoading}>
                <SelectTrigger id="reason" className="w-full">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Provide detailed information about the issue..."
                value={formData.description}
                onChange={handleChange}
                disabled={isLoading}
                rows={4}
                className="w-full"
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">
                Claim Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                name="amount"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
                disabled={isLoading}
                step="0.01"
                min="0"
                className="w-full"
              />
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
              <p>Our team will review your dispute within 24-48 hours and reach out if additional information is needed.</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Report Dispute'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
