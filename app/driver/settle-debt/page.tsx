'use client';

import React, { useState, useEffect } from 'react';
import { DriverLayout } from '@/components/driver/DriverLayout';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { AlertCircle, QrCode, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SettleDebtPage() {
  const [debt, setDebt] = useState({
    currentDebt: 0,
    maxDebtLimit: 50000,
    remainingLimit: 50000,
    totalCollectedCash: 0,
    debtPercentage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const driverId = user?.jobId;
    const fetchDebt = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/drivers/debt?driverId=${driverId}`);
        if (!response.ok) throw new Error('Failed to fetch debt');
        const data = await response.json();
          console.log(data);
          
        setDebt(data);
      } catch (error) {
        console.error('Error fetching debt:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDebt();
  }, []);

  const debtPercentage = debt.debtPercentage;
  return (
    <DriverLayout currentPage="overview">
      <div className="space-y-6">
        {/* Back Button */}
        <Link href="/driver/overview" className="inline-flex">
          <Button variant="secondary" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Back to Overview
          </Button>
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settle COD Debt</h1>
          <p className="mt-2 text-muted-foreground">Show your QR code to the Hub Admin to hand over collected cash</p>
        </div>

        {/* QR Code Section */}
        <Card className="flex flex-col items-center justify-center p-8">
          <div className="mb-6">
            <p className="text-sm font-medium text-muted-foreground mb-4">Your Driver Profile QR Code</p>
            <div className="bg-white p-4 rounded-2xl border border-border">
              <img 
                src={debt?.qrCodeUrl || '/placeholder-qr.png'} 
                alt="Driver QR Code" 
                className="w-64 h-64 object-contain"
              />
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6 max-w-md">
            Show this QR code to the Hub Admin to hand over collected cash and clear your digital debt.
          </p>
        </Card>

        {/* Debt Progress Section */}
        <Card className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">COD Debt Progress</h2>
            <p className="text-sm text-muted-foreground">Your current debt vs maximum limit before account suspension</p>
          </div>

          {/* Current Debt Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-red-50 p-4 border border-red-200">
              <p className="text-xs text-muted-foreground font-medium">Current Debt</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {debt.currentDebt?.toLocaleString() ||"0"} PKR
              </p>
            </div>
            <div className="rounded-2xl bg-secondary p-4 border border-border">
              <p className="text-xs text-muted-foreground font-medium">Max Limit</p>
              <p className="text-3xl font-bold text-accent mt-2">
                {debt.maxDebtLimit?.toLocaleString() ||"0"} PKR
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">Debt Usage</span>
              <span className="text-sm font-bold text-red-600">{Math.round(debtPercentage)}%</span>
            </div>
            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  debtPercentage > 85 ? 'bg-red-600' : debtPercentage > 50 ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(debtPercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {Number(debt?.remainingLimit)} PKR remaining before account suspension
            </p>
          </div>

          {/* Warning if near limit */}
          {debtPercentage > 80 && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">Warning: High Debt Level</p>
                <p className="text-sm text-red-600 mt-1">
                  You&apos;re close to the maximum debt limit. Please settle your debt soon to avoid account suspension.
                </p>
              </div>
            </div>
          )}

          {/* Collected Cash Info */}
          <div className="rounded-2xl bg-green-50 p-4 border border-green-200">
            <p className="text-sm font-medium text-green-700">Total Collected Cash</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {debt?.totalCollectedCash?.toLocaleString() || "0"} PKR
            </p>
            <p className="text-xs text-green-600 mt-1">Ready for settlement with hub</p>
          </div>

          {/* Last Settlement */}
          {/* {debt?.lastSettlementDate && (
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Last Settlement: {new Date(codDebt?.lastSettlementDate || new Date())?.toLocaleDateString()}
              </p>
            </div>
          )} */}
        </Card>

        {/* Instructions Card */}
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Settlement Instructions</h3>
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold">1</span>
              <span className="text-sm text-foreground">Go to the nearest FastShip Hub during operating hours</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold">2</span>
              <span className="text-sm text-foreground">Show the QR code above to the Hub Admin</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold">3</span>
              <span className="text-sm text-foreground">Hand over your collected cash</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold">4</span>
              <span className="text-sm text-foreground">Receive confirmation and your debt will be cleared</span>
            </li>
          </ol>
        </Card>
      </div>
    </DriverLayout>
  );
}
