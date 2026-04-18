'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/shared/Button';
import { Card, CardContent } from '@/components/shared/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Alert } from '@/components/ui/alert';

export default function BusinessCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const approvalId = searchParams.get('approvalId');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [approval, setApproval] = useState<any>(null);
  const [loadingApproval, setLoadingApproval] = useState(true);

  useEffect(() => {
    if (!approvalId) {
      setError('No approval ID provided');
      setLoadingApproval(false);
      return;
    }

    // Fetch approval details (optional - we can fetch it from the API endpoint)
    // For now, we'll just validate the approvalId is present
    setLoadingApproval(false);
  }, [approvalId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/register/business/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvalId,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to complete registration');
        return;
      }

      setSuccess(true);
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
                <h2 className="text-2xl font-bold text-foreground mb-2">Registration Complete!</h2>
                <p className="text-muted-foreground">Your business account has been created successfully.</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-900">
                  Welcome to FastShip! You can now login with your credentials and manage your shipments.
                </p>
              </div>

              <Link href="/login" className="block">
                <Button className="w-full" variant="default">
                  Go to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loadingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading approval details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!approvalId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0">
            <CardContent className="space-y-6 p-6 text-center">
              <AlertCircle className="h-16 w-16 text-red-600 mx-auto" />
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Invalid Link</h2>
                <p className="text-muted-foreground">No approval ID provided. Please check your approval link.</p>
              </div>
              <Link href="/register/check-status" className="block">
                <Button className="w-full" variant="default">
                  Check Application Status
                </Button>
              </Link>
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
        <Link href="/register/check-status" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Status Check
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Registration</h1>
          <p className="text-muted-foreground">Set your password to activate your business account</p>
        </div>

        {/* Completion Card */}
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
              {/* Approval ID Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-900 font-medium mb-1">Approval ID:</p>
                <p className="font-mono text-sm text-blue-700 break-all">{approvalId}</p>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                    Completing Registration...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </Button>
            </form>

            {/* Info */}
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Make sure to remember your password. You'll need it to login.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
