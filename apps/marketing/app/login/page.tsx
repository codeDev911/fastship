'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@fastship/lib';
import { Button } from '@fastship/ui';
import { Input } from '@fastship/ui';
import { Label } from '@fastship/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@fastship/ui';
import { AlertCircle } from 'lucide-react';

const QUOTES = {
  DRIVER: {
    text: "Every journey is an opportunity to deliver excellence.",
    author: "FastShip"
  },
  SELLER: {
    text: "Reliable delivery is the foundation of customer trust.",
    author: "FastShip"
  },
  BUSINESS: {
    text: "Efficiency at scale defines modern logistics.",
    author: "FastShip"
  }
};

export default function LoginPage() {
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
      const redirectUrl = await login(formData.email, formData.password, formData.role);
      window.location.href = redirectUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setFormError(message);
    }
  };

  const quote = QUOTES[formData.role as keyof typeof QUOTES];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="grid grid-cols-1 lg:grid-cols-2 w-full max-w-7xl gap-0">
        {/* Left Side - Quote */}
        <div className="hidden lg:flex flex-col items-center justify-center bg-secondary/40 px-12 py-20 min-h-screen">
          <div className="max-w-md">
            <blockquote className="space-y-6">
              <p className="text-3xl font-bold text-foreground leading-tight">
                "{quote.text}"
              </p>
              <footer className="text-lg text-muted-foreground">
                — {quote.author}
              </footer>
            </blockquote>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex flex-col items-center justify-center px-6 py-12 sm:px-12 sm:py-20 min-h-screen">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">Welcome Back</h1>
              <p className="text-muted-foreground">Sign in to your account to continue</p>
            </div>

            {/* Error Alert */}
            {(error || formError) && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error || formError}</p>
              </div>
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
                  className="w-full px-4 py-2 rounded-lg border border-border bg-card"
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
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="mt-8 text-center space-y-4">
              <p className="text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/register/driver/apply" className="text-accent font-medium hover:underline">
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
           