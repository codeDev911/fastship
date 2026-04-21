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

export default function DriverApplyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [approvalId, setApprovalId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    name: '',
    licenseNumber: '',
    licenseExpiry: '',
    vehicleType: 'MOTORCYCLE',
    vehicleNumber: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVehicleTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, vehicleType: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.email || !formData.phone || !formData.name || !formData.licenseNumber || !formData.licenseExpiry || !formData.vehicleNumber) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.phone.length < 10) {
      setError('Phone number must be at least 10 digits');
      return;
    }

    setIsLoading(true);

    try {
      const response = await secureFetch('/api/register/driver/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
          name: formData.name,
          licenseNumber: formData.licenseNumber,
          licenseExpiry: formData.licenseExpiry,
          vehicleType: formData.vehicleType,
          vehicleNumber: formData.vehicleNumber,
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
        name: '',
        licenseNumber: '',
        licenseExpiry: '',
        vehicleType: 'MOTORCYCLE',
        vehicleNumber: '',
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
                <p className="text-muted-foreground">Your driver registration application has been submitted successfully.</p>
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
                  <Button className="w-full" variant="default">
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Apply as Driver</h1>
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
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

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

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
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

              {/* License Number */}
              <div className="space-y-2">
                <Label htmlFor="licenseNumber" className="text-sm font-medium">License Number</Label>
                <Input
                  id="licenseNumber"
                  type="text"
                  name="licenseNumber"
                  placeholder="DL123456789"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              {/* License Expiry */}
              <div className="space-y-2">
                <Label htmlFor="licenseExpiry" className="text-sm font-medium">License Expiry Date</Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  name="licenseExpiry"
                  value={formData.licenseExpiry}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              {/* Vehicle Type */}
              <div className="space-y-2">
                <Label htmlFor="vehicleType" className="text-sm font-medium">Vehicle Type</Label>
                <Select value={formData.vehicleType} onValueChange={handleVehicleTypeChange} disabled={isLoading}>
                  <SelectTrigger id="vehicleType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MOTORCYCLE">Motorcycle</SelectItem>
                    <SelectItem value="CAR">Car</SelectItem>
                    <SelectItem value="VAN">Van</SelectItem>
                    <SelectItem value="TRUCK">Truck</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Vehicle Number */}
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber" className="text-sm font-medium">Vehicle Number / Registration</Label>
                <Input
                  id="vehicleNumber"
                  type="text"
                  name="vehicleNumber"
                  placeholder="ABC-123"
                  value={formData.vehicleNumber}
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
