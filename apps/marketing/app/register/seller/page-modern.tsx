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
  text: "Reliable delivery is the foundation of customer trust. Start your journey with FastShip.",
  author: "FastShip"
};

const BENEFITS = [
  { number: "01", title: "Auto-Fulfillment", desc: "Automated order processing" },
  { number: "02", title: "Rate Calculator", desc: "Dynamic pricing for all routes" },
  { number: "03", title: "Smart Analytics", desc: "Track sales and delivery metrics" }
];

export default function SellerApplyPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [approvalId, setApprovalId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    businessName: '',
    businessType: 'RETAIL',
    city: '',
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

    if (!formData.email || !formData.phone || !formData.businessName || !formData.city) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const response = await secureFetch('/api/register/seller/apply', {
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
      <div className="min-h-screen bg-background grid grid-cols-1 lg:grid-cols-2">
        <div className="hidden lg:flex flex-col items-center justify-center bg-secondary/40 px-12 py-20 min-h-screen">
          <div className="max-w-md">
            <blockquote className="space-y-6">
              <p className="text-3xl font-bold text-foreground leading-tight">"{QUOTE.text}"</p>
              <footer className="text-lg text-muted-foreground">— {QUOTE.author}</footer>
            </blockquote>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center px-6 py-12 sm:px-12 sm:py-20">
          <div className="w-full max-w-sm text-center">
            <CheckCircle2 className="h-16 w-16 text-accent mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-2">Welcome to FastShip!</h2>
            <p className="text-muted-foreground mb-4">Your seller account has been created successfully.</p>
            <div className="bg-secondary/40 rounded-lg p-4 mb-6 break-all font-mono text-sm font-semibold text-accent">{approvalId}</div>
            <p className="text-muted-foreground mb-8">Complete your profile and start shipping products today.</p>
            <Link href="/" className="block mb-3">
              <Button variant="primary" fullWidth>Go to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid grid-cols-1 lg:grid-cols-2">
      {/* Left Side - Quote */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-secondary/40 px-12 py-20 min-h-screen">
        <div className="max-w-md">
          <div className="inline-block bg-accent/10 rounded-full px-4 py-2 mb-6">
            <p className="text-sm font-semibold text-accent">For Sellers</p>
          </div>
          <blockquote className="space-y-8">
            <p className="text-3xl font-bold text-foreground leading-tight">"{QUOTE.text}"</p>
            <footer className="text-lg text-muted-foreground">— {QUOTE.author}</footer>
          </blockquote>
          <div className="mt-12 space-y-6">
            {BENEFITS.map((benefit) => (
              <div key={benefit.number} className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-accent font-bold">{benefit.number}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-col items-center justify-center px-6 py-12 sm:px-12 sm:py-20 min-h-screen">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-accent hover:underline mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <h1 className="text-4xl font-bold text-foreground mb-2">Sell on FastShip</h1>
            <p className="text-muted-foreground">Start shipping your products today</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                name="businessName"
                placeholder="Your Store"
                value={formData.businessName}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="seller@store.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                name="phone"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type *</Label>
              <Select value={formData.businessType} onValueChange={handleBusinessTypeChange}>
                <SelectTrigger id="businessType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RETAIL">Retail Store</SelectItem>
                  <SelectItem value="ECOMMERCE">E-Commerce</SelectItem>
                  <SelectItem value="WHOLESALE">Wholesale</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                name="city"
                placeholder="Your City"
                value={formData.city}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <Button variant="primary" fullWidth type="submit" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Start Selling'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already registered?{' '}
            <Link href="/login" className="text-accent font-medium hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
