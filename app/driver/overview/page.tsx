'use client';

import React, { useState, useEffect } from 'react';
import { DriverLayout } from '@/components/driver/DriverLayout';
import { DriverOverview } from '@/components/driver/DriverOverview';
import { useShipments, useNotifications } from '@/lib/hooks';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { AlertCircle, Wallet } from 'lucide-react';
import Link from 'next/link';

export default function DriverOverviewPage() {
  const [currentDriver, setCurrentDriver] = useState<any>(null);
  const [debt, setDebt] = useState<any>(null);
  const { shipments } = useShipments();
  const { getUnreadCount } = useNotifications();

  const unreadCount = getUnreadCount();

  useEffect(() => {
    const fetchDriver = async () => {
      const user : any = localStorage.getItem("user") 
      const driverId = user ? JSON.parse(user).jobId : null;
      console.log(user);
      
      try {
        const [driverRes, debtRes] = await Promise.all([
          fetch(`/api/driver/${driverId}`),
          fetch(`/api/drivers/debt?driverId=${driverId}`),
        ]);
        
        if (driverRes.ok) {
          const driverData = await driverRes.json();
          setCurrentDriver(driverData || null);
        }
        
        if (debtRes.ok) {
          const debtData = await debtRes.json();
          setDebt(debtData);
        }
      } catch (error) {
        console.error('Error fetching driver data:', error);
      }
    };

    fetchDriver();
  }, []);

  if (!currentDriver) return null;
  
  // Get active deliveries for this driver
  const activeDeliveries = shipments.filter(
    s => s.driverId === currentDriver.id && ['ASSIGNED', 'IN_TRANSIT'].includes(s.status)
  ).length;

  // Get completed deliveries today
  const completedToday = shipments.filter(
    s => s.driverId === currentDriver.id && s.status === 'DELIVERED'
  ).length;

  const debtPercentage = debt?.debtPercentage || 0;

  return (
    <DriverLayout currentPage="overview" unreadNotifications={unreadCount}>
      <div className="space-y-6">
        <DriverOverview
          driver={currentDriver}
          activeDeliveries={activeDeliveries}
          completedToday={completedToday}
        />

        {/* COD Debt Alert Card */}
        {debt && debt.currentDebt > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader title="COD Debt Alert" />
            <CardContent className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Current Debt</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    -{debt.currentDebt.toLocaleString()} PKR
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Debt Limit</p>
                  <p className="text-3xl font-bold text-accent mt-2">
                    {debt.maxDebtLimit.toLocaleString()} PKR
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Debt Usage</span>
                  <span className="text-sm font-bold text-red-600">{Math.round(debtPercentage)}%</span>
                </div>
                <div className="w-full h-3 bg-red-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      debtPercentage > 85 ? 'bg-red-600' : debtPercentage > 50 ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(debtPercentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Warning Message */}
              <div className="flex items-start gap-3 rounded-lg bg-white p-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {debt.remainingLimit} PKR remaining before suspension
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Please settle your debt as soon as possible to keep your account active
                  </p>
                </div>
              </div>

              <Link href="/driver/settle-debt" className="block">
                <Button variant="primary" className="w-full" icon={<Wallet className="h-4 w-4" />}>
                  Settle Debt Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DriverLayout>
  );
}
