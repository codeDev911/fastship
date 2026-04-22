'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@fastship/ui';
import { Input } from '@fastship/ui';
import { Label } from '@fastship/ui';
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@fastship/ui';
import { secureFetch } from '@fastship/lib';

const QUOTE = {
  text: "Every delivery is an opportunity to build trust. Your professionalism drives our success.",
  author: "FastShip"
};

export default function DriverApplyPage() {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit application');
        return;
      }

      setApprovalId(data.approval.id);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 w-full max-w-7xl gap-0">
          <div className="hidden lg:flex flex-col items-center justify-center bg-secondary/40 px-12 py-20 min-h-screen">
            <div className="max-w-md">
              <blockquote className="space-y-6">
                <p className="text-3xl font-bold text-foreground leading-tight">
                  "{QUOTE.text}"
                </p>
                <footer className="text-lg text-muted-foreground">
                  — {QUOTE.author}
                </footer>
              </blockquote>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center px-6 py-12 sm:px-12 sm:py-20 min-h-screen">
            <div className="w-full max-w-sm text-center">
              <div className="flex justify-center mb-6">
                <CheckCircle2 className="h-16 w-16 text-accent" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Application Submitted!</h2>
              <p className="text-muted-foreground mb-4">
                Your driver application has been received. Your approval ID is:
              </p>
              <div className="bg-secondary/40 rounded-lg p-4 mb-6 break-all font-mono text-sm">
                {approvalId}
              </div>
              <p className="text-muted-foreground mb-8">
                We'll review your application and notify you via email within 24-48 hours. You can check your status anytime using your approval ID.
              </p>
              <div className="space-y-3">
                <Link href="/" className="block">
                  <Button variant="primary" fullWidth>
                    Go to Home
                  </Button>
                </Link>
                <Link href="/register/check-status" className="block">
                  <Button variant="outline" fullWidth>
                    Check Application Status
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="grid grid-cols-1 lg:grid-cols-2 w-full max-w-7xl gap-0">
        {/* Left Side - Quote */}
        <div className="hidden lg:flex flex-col items-center justify-center bg-secondary/40 px-12 py-20 min-h-screen">
          <div className="max-w-md">
            <blockquote className="space-y-6">
              <p className="text-3xl font-bold text-foreground leading-tight">
                "{QUOTE.text}"
              </p>
              <footer className="text-lg text-muted-foreground">
                — {QUOTE.author}
              </footer>
            </blockquote>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex flex-col items-center justify-center px-6 py-12 sm:px-12 sm:py-20 min-h-screen">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="mb-8">
              <Link href="/" className="inline-flex items-center gap-2 text-accent hover:underline mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
              <h1 className="text-4xl font-bold text-foreground mb-2">Become a Driver</h1>
              <p className="text-muted-foreground">Join our delivery network today</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-card"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-card"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  name="phone"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-card"
                />
              </div>

              {/* License Number */}
              <div className="space-y-2">
                <Label htmlFor="licenseNumber" className="text-sm font-medium">
                  License Number *
                </Label>
                <Input
                  id="licenseNumber"
                  type="text"
                  name="licenseNumber"
                  placeholder="ABC123456"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-card"
                />
              </div>

              {/* License Expiry */}
              <div className="space-y-2">
                <Label htmlFor="licenseExpiry" className="text-sm font-medium">
                  License Expiry Date *
                </Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  name="licenseExpiry"
                  value={formData.licenseExpiry}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-card"
                />
              </div>

              {/* Vehicle Type */}
              <div className="space-y-2">
                <Label htmlFor="vehicleType" className="text-sm font-medium">
                  Vehicle Type *
                </Label>
                <Select value={formData.vehicleType} onValueChange={handleVehicleTypeChange}>
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
                <Label htmlFor="vehicleNumber" className="text-sm font-medium">
                  Vehicle Number/Plate *
                </Label>
                <Input
                  id="vehicleNumber"
                  type="text"
                  name="vehicleNumber"
                  placeholder="ABC-1234"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-card"
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                variant="primary" 
                fullWidth 
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already registered?{' '}
              <Link href="/login" className="text-accent font-medium hover:underline">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
