'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button'; 
import { QrCode, Camera, Send, CheckCircle, AlertCircle } from 'lucide-react'; 
import { secureFetch } from '@/lib/secure-fetch';

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
  const [uniqueId,setUniqueId] = useState("")

  const [driverDepts,setDriverDepts] = useState([])


  const fetchDriverDepts = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const businessId = user?.jobId;
    try {
      const response = await secureFetch(`/api/business/driver-depts?businessId=${businessId}`);
      const data = await response.json();
      
      setDriverDepts(data.data);

    } catch (error) {
      alert("Failed to fetch");
    }
    finally{
    }
  }

  useEffect(()=>{

    fetchDriverDepts()

  },[])

  const handleQRScan = () => {
    setShowCameraPlaceholder(true);
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
              setUniqueId(new Date().toISOString()) // just to avoid duplicate clicks

        await secureFetch('/api/business/driver-depts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driverId: formState.selectedDriver,
            amount: formState.cashAmount,
            uniqueId
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
              setUniqueId("")

      }
    }



  };

  return (
    <div className="space-y-6">
   

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       

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
