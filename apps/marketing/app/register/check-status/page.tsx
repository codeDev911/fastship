'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@fastship/ui';
import { Card, CardContent } from '@fastship/ui';
import { Input } from '@fastship/ui';
import { Label } from '@fastship/ui';
import { AlertCircle, Loader2, ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Alert } from '@fastship/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@fastship/ui';

interface ApprovalStatus {
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'NOT_FOUND';
  message: string;
  approvalId?: string;
  data:any;
  approval?: {
    id: string;
    email: string;
    applicationType: string;
    submittedAt: string;
    approvedAt?: string;
    rejectionReason?: string;
  };
}

export default function CheckStatusPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApprovalStatus | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    type: 'DRIVER',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, type: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/register/check-approval?email=${encodeURIComponent(formData.email)}&type=${formData.type}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to check status');
        return;
      }

      console.log(data);
      

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link href="/login" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Check Application Status</h1>
          <p className="text-muted-foreground">Track your registration application</p>
        </div>

        {/* Status Card */}
        <Card className="shadow-lg border-0">
          <CardContent className="space-y-6 p-6">
            {/* Error Alert */}
            {error && (
              <Alert className="bg-red-50 border-red-200 p-4 rounded-lg flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="font-medium text-red-900">{error}</p>
              </Alert>
            )}

            {!result ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full"
                  />
                </div>

                {/* Application Type */}
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium">Application Type</Label>
                  <Select value={formData.type} onValueChange={handleTypeChange} disabled={isLoading}>
                    <SelectTrigger id="type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRIVER">Driver</SelectItem>
                      <SelectItem value="BUSINESS">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Check Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-6"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    'Check Status'
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Status Display */}
                {result.status === 'APPROVED' && (
                  <>
                    <div className="flex justify-center">
                      <CheckCircle2 className="h-16 w-16 text-green-600" />
                    </div>
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-green-600 mb-2">Approved!</h2>
                      <p className="text-muted-foreground mb-4">
                        {result?.message}
                      </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-medium text-green-900">Application Details:</p>
                      <div className="text-sm text-green-800">
                        <p>Name: {result.data?.name}</p>
                        <p>Email: {result.data?.email}</p>
                        <p>Type: {result.data?.applicationType}</p>
                        <p>Approved: {new Date(result.data?.approvedAt || '').toLocaleDateString()}</p>
                      </div>
                    </div>

                    <Link
                      href={`/register/${result.data?.applicationType === 'DRIVER' ? 'driver' : 'business'}/complete?approvalId=${result.approvalId}`}
                      className="block"
                    >
                      <Button className="w-full" variant="default">
                        Complete Registration
                      </Button>
                    </Link>
                  </>
                )}

                {result.status === 'PENDING' && (
                  <>
                    <div className="flex justify-center">
                      <Clock className="h-16 w-16 text-amber-600" />
                    </div>
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-amber-600 mb-2">Under Review</h2>
                      <p className="text-muted-foreground">
                        Your application is being reviewed by our admin team.
                      </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-medium text-amber-900">Application Details:</p>
                      <div className="text-sm text-amber-800">
                        <p>Email: {result.approval?.email}</p>
                        <p>Type: {result.approval?.applicationType}</p>
                        <p>Submitted: {new Date(result.approval?.submittedAt || '').toLocaleDateString()}</p>
                        <p className="mt-2 font-medium">Expected decision: 24-48 hours</p>
                      </div>
                    </div>
                  </>
                )}

                {result.status === 'REJECTED' && (
                  <>
                    <div className="flex justify-center">
                      <XCircle className="h-16 w-16 text-red-600" />
                    </div>
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-red-600 mb-2">Application Rejected</h2>
                      <p className="text-muted-foreground">
                        Unfortunately, your application was not approved.
                      </p>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                      <p className="text-sm text-red-800">{result.approval?.rejectionReason || 'No reason provided'}</p>
                    </div>

                    <p className="text-sm text-muted-foreground text-center">
                      You can submit a new application after addressing the issues mentioned above.
                    </p>

                    <Link
                      href={`/register/${result.approval?.applicationType === 'DRIVER' ? 'driver' : 'business'}/apply`}
                      className="block"
                    >
                      <Button className="w-full" variant="outline">
                        Submit New Application
                      </Button>
                    </Link>
                  </>
                )}

                {result.status === 'NOT_FOUND' && (
                  <>
                    <div className="text-center">
                      <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-foreground mb-2">No Application Found</h2>
                      <p className="text-muted-foreground mb-6">
                        We couldn't find an application with the provided details. Please check your email and application type.
                      </p>
                    </div>

                    <Link
                      href={`/register/${formData.type === 'DRIVER' ? 'driver' : 'business'}/apply`}
                      className="block"
                    >
                      <Button className="w-full" variant="default">
                        Submit Application
                      </Button>
                    </Link>
                  </>
                )}

                {/* Check Another Button */}
                <Button
                  onClick={() => setResult(null)}
                  variant="outline"
                  className="w-full"
                >
                  Check Another Application
                </Button>
              </div>
            )}

            {/* Info */}
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Didn't submit yet?{' '}
                <Link href="/register/driver/apply" className="text-primary hover:underline">
                  Apply now
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
