'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/shared/Button';
import { Card, CardContent } from '@/components/shared/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BusinessRegistrationPage() {
  const router = useRouter();
  const { registerBusiness, isLoading, error } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    businessName: '',
    businessType: 'LOGISTICS',
    operationCity: '',
    operationArea: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBusinessTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, businessType: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.email || !formData.password || !formData.name || !formData.phone || !formData.businessName || !formData.businessType || !formData.operationCity) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    try {
      await registerBusiness({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        businessName: formData.businessName,
        businessType: formData.businessType,
        operationCity: formData.operationCity,
        operationArea: formData.operationArea,
      });

      router.push('/business/overview');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setFormError(message);
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Register as Business</h1>
          <p className="text-muted-foreground">Scale your logistics operations on FastShip</p>
        </div>

        {/* Registration Card */}
        <Card className="shadow-lg border-0">
          <CardContent className="space-y-6 p-6">
            {/* Error Alert */}
            {(error || formError) && (
              <Alert className="bg-red-50 border-red-200 p-4 rounded-lg flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="font-medium text-red-900">{error || formError}</p>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Contact Person Name</Label>
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
                  placeholder="your@company.com"
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

              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-sm font-medium">Business Name</Label>
                <Input
                  id="businessName"
                  type="text"
                  name="businessName"
                  placeholder="FastCargo Logistics"
                  value={formData.businessName}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              {/* Business Type */}
              <div className="space-y-2">
                <Label htmlFor="businessType" className="text-sm font-medium">Business Type</Label>
                <Select value={formData.businessType} onValueChange={handleBusinessTypeChange}>
                  <SelectTrigger id="businessType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOGISTICS">Logistics Company</SelectItem>
                    <SelectItem value="COURIER">Courier Service</SelectItem>
                    <SelectItem value="FLEET">Fleet Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Operation City */}
              <div className="space-y-2">
                <Label htmlFor="operationCity" className="text-sm font-medium">Primary Operation City</Label>
                <Input
                  id="operationCity"
                  type="text"
                  name="operationCity"
                  placeholder="Karachi"
                  value={formData.operationCity}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              {/* Operation Area */}
              <div className="space-y-2">
                <Label htmlFor="operationArea" className="text-sm font-medium">Operation Area (Optional)</Label>
                <Input
                  id="operationArea"
                  type="text"
                  name="operationArea"
                  placeholder="Entire City / Specific Areas"
                  value={formData.operationArea}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white hover:bg-primary/90 mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  'Register as Business'
                )}
              </Button>
            </form>

            {/* Login Link */}
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
