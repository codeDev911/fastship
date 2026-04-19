'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@fastship/lib';
import { Button } from '@fastship/ui';
import { Card, CardHeader, CardContent } from '@fastship/ui';
import { Input } from '@fastship/ui';
import { Label } from '@fastship/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@fastship/ui';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert } from '@fastship/ui';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'DRIVER',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.email || !formData.password) {
      setFormError('Please fill in all fields');
      return;
    }

    try {
      // login now returns the redirect URL
      const redirectUrl = await login(formData.email, formData.password, formData.role);
      
      // Redirect to the appropriate app based on role
      window.location.href = redirectUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setFormError(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">FastShip</h1>
          <p className="text-muted-foreground">Modern Delivery Management Platform</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-0">
          <CardHeader title="Sign In to Your Account" />
          <CardContent className="space-y-6 p-6">
            {/* Error Alert */}
            {(error || formError) && (
              <Alert className="bg-red-50 border-red-200 p-4 rounded-lg flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-900">{error || formError}</p>
                </div>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">
                  I am a
                </Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRIVER">Driver</SelectItem>
                    <SelectItem value="SELLER">Seller</SelectItem>
                    <SelectItem value="BUSINESS">Logistics Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
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

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
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

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">New user?</span>
              </div>
            </div>

            {/* Registration Links */}
            <div className="space-y-2">
              <Link href="/register/driver" className="block">
                <Button
                  variant="outline"
                  className="w-full text-primary border-primary hover:bg-primary/5"
                >
                  Register as Driver
                </Button>
              </Link>
              <Link href="/register/seller" className="block">
                <Button
                  variant="outline"
                  className="w-full text-primary border-primary hover:bg-primary/5"
                >
                  Register as Seller
                </Button>
              </Link>
              <Link href="/register/business" className="block">
                <Button
                  variant="outline"
                  className="w-full text-primary border-primary hover:bg-primary/5"
                >
                  Register as Business
                </Button>
              </Link>
            </div>

            {/* Footer */}
            <p className="text-xs text-center text-muted-foreground">
              By signing in, you agree to our{' '}
              <Link href="#" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="#" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
