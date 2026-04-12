'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { mockFleetDriverCODDebts } from '@/lib/mock-data';
import { QrCode, Camera, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { financialService } from '@/lib/services/financial.service';

interface SettlementFormState {
  selectedDriver: string;
  cashAmount: Number;
  scannedQR: string;
}

interface SettlementResponse {
  success: boolean;
  message: string;
  driverId?: string;
  debtCleared?: number;
}

export function CashSettlementDesk() {
  const [formState, setFormState] = useState<SettlementFormState>({
    selectedDriver: '',
    cashAmount: 0,
    scannedQR: '',
  });
  const [showCameraPlaceholder, setShowCameraPlaceholder] = useState(false);
  const [settlement, setSettlement] = useState<SettlementResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);


  const [driverDepts,setDriverDepts] = useState([])


  const fetchDriverDepts = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const businessId = user?.jobId;
    try {
      const response = await fetch(`/api/business/driver-depts?businessId=${businessId}`);
      const data = await response.json();
      console.log(data);
      
      setDriverDepts(data.data);

    } catch (error) {
      alert("Failed to fetch");
    }
  }

  useEffect(()=>{

    fetchDriverDepts()

  },[])

  const handleQRScan = () => {
    setShowCameraPlaceholder(true);
  };

  const handleSimulateQRScan = () => {
    // Simulate scanning a QR code
    setFormState(prev => ({
      ...prev,
      scannedQR: 'DRIVER_PROFILE_ID_FLEET_1_FASTSHIP',
    }));
    setShowCameraPlaceholder(false);
  };

  const handleDriverSelect = (id: string) => {
    const driver = driverDepts.find(d => d.id === id);
    if (driver) {
      setFormState(prev => ({
        ...prev,
        selectedDriver: id,
        cashAmount: driver?.currentDebt?.toFixed(2),
      }));
    }
  };

  const handleCashAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({
      ...prev,
      cashAmount: Number(e.target.value),
    }));
  };

  const handleConfirmSettlement = async () => {
    if (!formState.selectedDriver || !formState.cashAmount) {
      setSettlement({
        success: false,
        message: 'Please select a driver and enter cash amount.',
      });
      return;
    }else{
      try {
        setIsProcessing(true);
        await fetch('/api/business/driver-depts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driverId: formState.selectedDriver,
            amount: formState.cashAmount,
          }),
        });
        
        setSettlement({
          success: true,
          message: 'Settlement processed successfully.',
          driverId: formState.selectedDriver,
        });
      } catch (error) {
        console.log(error);
        setSettlement({
          success: false,
          message: `Failed to process settlement: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      } finally {
        setIsProcessing(false);
      }
    }



  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Cash Settlement Desk</h1>
        <p className="mt-2 text-muted-foreground">Process driver cash settlements and clear COD debts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: QR Scanner */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader title="QR Code Scanner" />
            <CardContent className="space-y-4 p-6">
              <div className="space-y-3">
                <Button
                  onClick={handleQRScan}
                  variant="primary"
                  className="w-full"
                  icon={<Camera className="h-5 w-5" />}
                >
                  Scan Driver QR
                </Button>

                {showCameraPlaceholder && (
                  <div className="rounded-2xl border-2 border-dashed border-border bg-secondary p-8 flex flex-col items-center justify-center">
                    <div className="text-center">
                      <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-medium text-foreground mb-4">Camera Placeholder</p>
                      <p className="text-xs text-muted-foreground mb-4">
                        In production, camera would scan QR codes here
                      </p>
                      <Button
                        onClick={handleSimulateQRScan}
                        variant="secondary"
                        size="sm"
                      >
                        Simulate Scan
                      </Button>
                    </div>
                  </div>
                )}

                {formState.scannedQR && (
                  <div className="rounded-2xl bg-green-50 border border-green-200 p-4">
                    <div className="flex gap-2 items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-green-700">QR Code Scanned</p>
                        <p className="text-xs text-green-600 mt-1 break-all">{formState.scannedQR}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Manual Entry Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Manual Settlement Entry" />
            <CardContent className="space-y-6 p-6">
              {/* Driver Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Select Driver
                </label>
                <div className="space-y-2">
                  {driverDepts.map(driver => (
                    <button
                      key={driver.id}
                      onClick={() =>{
                         handleDriverSelect(driver.id)
                      }}
                      className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                        formState.selectedDriver === driver.id
                          ? 'border-accent bg-accent/10'
                          : 'border-border bg-white hover:border-accent/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-bold text-primary mt-1">
                          {driver?.currentDebt?.toFixed(2)} PKR
                          </p>
                          <p className="text-sm  text-muted-foreground ">
                          {driver?.user?.name} {driver?.user?.phone || `- ${driver?.user?.email}`}
                          </p>
                          <p className="text-sm  text-muted-foreground ">
                            Active depts : {driver?.debts?.length}
                          </p>
                        </div>
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                          formState.selectedDriver === driver.id
                            ? 'border-accent bg-accent'
                            : 'border-border'
                        }`}>
                          {formState.selectedDriver === driver.id && (
                            <div className="h-2 w-2 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash Amount Input */}
              <div>
                <label htmlFor="cashAmount" className="block text-sm font-medium text-foreground mb-3">
                  Cash Amount Received (PKR)
                </label>
                <input
                  id="cashAmount"
                  type="number"
                  value={formState.cashAmount}
                  onChange={handleCashAmountChange}
                  placeholder="Enter amount"
                  className="w-full rounded-2xl border-2 border-border px-4 py-3 text-base font-medium text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-0 transition-colors"
                />
              </div>

              {/* Confirm Button */}
              <Button
                onClick={handleConfirmSettlement}
                variant="primary"
                className="w-full"
                icon={<Send className="h-5 w-5" />}
                disabled={isProcessing || !formState.selectedDriver || !formState.cashAmount}
              >
                {isProcessing ? 'Processing...' : 'Confirm & Clear Debt'}
              </Button>

              {/* Success/Error Message */}
              {settlement && (
                <div className={`rounded-2xl border-2 p-4 ${
                  settlement.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex gap-3">
                    {settlement.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`text-sm font-semibold ${
                        settlement.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {settlement.success ? 'Success' : 'Error'}
                      </p>
                      <p className={`text-sm mt-1 ${
                        settlement.success ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {settlement.message}
                      </p>
                      {settlement.success && settlement.debtCleared && (
                        <p className="text-xs text-green-600 mt-2 font-medium">
                          Total Debt Cleared: {settlement.debtCleared.toLocaleString()} PKR
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
