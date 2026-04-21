'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@fastship/ui';
import { Card, CardHeader, CardContent } from '@fastship/ui';
import { Input } from '@fastship/ui';
import { Label } from '@fastship/ui';
import { AlertCircle, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Alert } from '@fastship/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@fastship/ui';
import { secureFetch } from '@fastship/lib';

export default function BusinessApplyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [approvalId, setApprovalId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    companyName: '',
    businessType: 'LOGISTICS',
    operatingRegion: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBusinessTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, businessType: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.email || !formData.phone || !formData.companyName || !formData.operatingRegion) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.phone.length < 10) {
      setError('Phone number must be at least 10 digits');
      return;
    }

    setIsLoading(true);

    try {
      const response = await secureFetch('/api/register/business/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
          companyName: formData.companyName,
          businessType: formData.businessType,
          operatingRegion: formData.operatingRegion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit application');
        return;
      }

      setApprovalId(data.approval.id);
      setSuccess(true);
      setFormData({
        email: '',
        phone: '',
        companyName: '',
        businessType: 'LOGISTICS',
        operatingRegion: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0">
            <CardContent className="space-y-6 p-6 text-center">
              <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Application Submitted!</h2>
                <p className="text-muted-foreground">Your business registration application has been submitted successfully.</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium mb-2">Your Application ID:</p>
                <p className="font-mono text-blue-700 break-all">{approvalId}</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                  Our admin team will review your application within 24-48 hours. You can check the status using your application ID and email.
                </p>
              </div>

              <div className="space-y-3">
                <Link href="/register/check-status" className="block">
                  <Button className="w-full" variant="primary">
                    Check Application Status
                  </Button>
                </Link>
                <Link href="/login" className="block">
                  <Button className="w-full" variant="outline">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-foreground mb-2">Apply as Business</h1>
          <p className="text-muted-foreground">Submit your application to join FastShip</p>
        </div>

        {/* Application Card */}
        <Card className="shadow-lg border-0">
          <CardContent className="space-y-6 p-6">
            {/* Error Alert */}
            {error && (
              <Alert className="bg-red-50 border-red-200 p-4 rounded-lg flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="font-medium text-red-900">{error}</p>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium">Company Name</Label>
                <Input
                  id="companyName"
                  type="text"
                  name="companyName"
                  placeholder="FastShip Partners Inc."
                  value={formData.companyName}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Business Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="business@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Business Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  name="phone"
                  placeholder="+92 300 1234567"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              {/* Business Type */}
              <div className="space-y-2">
                <Label htmlFor="businessType" className="text-sm font-medium">Business Type</Label>
                <Select value={formData.businessType} onValueChange={handleBusinessTypeChange} disabled={isLoading}>
                  <SelectTrigger id="businessType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOGISTICS">Logistics</SelectItem>
                    <SelectItem value="ECOMMERCE">E-Commerce</SelectItem>
                    <SelectItem value="RETAIL">Retail</SelectItem>
                    <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Operating Region */}
              <div className="space-y-2">
                <Label htmlFor="operatingRegion" className="text-sm font-medium">Operating Region/City</Label>
                <Input
                  id="operatingRegion"
                  type="text"
                  name="operatingRegion"
                  placeholder="Karachi, Lahore, Islamabad"
                  value={formData.operatingRegion}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </form>

            {/* Info */}
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Login here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
