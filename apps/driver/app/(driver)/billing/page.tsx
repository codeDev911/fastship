'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@fastship/ui';
import { Button } from '@fastship/ui';
import { Plus, Lock, Wallet, DollarSign } from 'lucide-react';
import { DriverLayout } from '../../../components/DriverLayout';
import {TopUpModal} from '@fastship/ui';
import { secureFetch } from '@fastship/lib';

export default function BillingPage() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoTopUpEnabled, setAutoTopUpEnabled] = useState(false);
  const [wallet, setWallet]: any = useState({})
  const [isTopupModalOpen,setIsTopupModalOpen] = useState(false)
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const sellerId = user?.jobId;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [walletRes, billingRes] = await Promise.all([
          secureFetch(`/api/wallets?driverId=${sellerId}`),
          secureFetch(`/api/billing?driverId=${sellerId}&limit=10`),
        ]);

        if (walletRes.ok) {
          const data = await walletRes.json();
          setWallet(data?.data)
          setWalletBalance(data.data?.balance || 0);
        }

        if (billingRes.ok) {
          const data = await billingRes.json();
          setTransactions(data.data);
        }
      } catch (error) {
        console.error('[v0] Error fetching billing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <DriverLayout
      currentPage="billing"
      walletBalance={walletBalance}
      currency="PKR" 
      unreadNotifications={0}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Wallet & Billing</h1>
            <p className="mt-2 text-muted-foreground">Manage your escrow balance and payments</p>
          </div>
          <Button
            icon={<Plus className="h-4 w-4" />}
            variant="primary"
    onClick={()=>setIsTopupModalOpen(true)}
          >
            Top Up Wallet
          </Button>
        </div>

        <TopUpModal isOpen = {isTopupModalOpen} onClose={()=>setIsTopupModalOpen(false)} />

        {/* Escrow Visual - Three Prominent Metric Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Available Balance Card - Green */}
          <Card className="overflow-hidden">
            <div className="h-1 bg-green-500" />
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-green-50 p-3">
                  <Wallet className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
              </div>
              <p className="text-4xl font-bold text-green-600">
                {(walletBalance - wallet?.escrowBalance || 0)?.toLocaleString() || "0"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Funds ready to use</p>
            </CardContent>
          </Card>

          {/* Locked in Escrow Card - Orange */}
          <Card className="overflow-hidden">
            <div className="h-1 bg-orange-500" />
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-orange-50 p-3">
                  <Lock className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Locked in Escrow</p>
              </div>
              <p className="text-4xl font-bold text-orange-600">
                {wallet.escrowBalance?.toLocaleString() || "0"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Reserved for active shipments</p>
            </CardContent>
          </Card>

          {/* Total Balance Card - Neutral */}
          <Card className="overflow-hidden">
            <div className="h-1 bg-accent" />
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-accent/10 p-3">
                  <DollarSign className="h-6 w-6 text-accent" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
              </div>
              <p className="text-4xl font-bold text-accent">
                {walletBalance?.toLocaleString() || "0"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{wallet?.currency}</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader title="Recent Transactions" />
          <CardContent>
            <div className="w-full overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Transaction ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Order Reference</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                 {transactions?.length > 0 && transactions?.map((txn: any, idx: React.Key) => {
                                   const isAddition = txn.type === 'TOPUP' || txn.type === 'REFUND' || txn.type === 'CREDIT' ? true : false;
                                   const isEscrow = txn.type === "ESCROW_LOCK" ||txn.type=== "ESCROW_RELEASE"
                                   const typeLabel = txn.type
               
                                   return (
                                     <tr
                                       key={txn.id}
                                       className={idx !== wallet?.recentTransactions?.length - 1 ? 'border-b border-border/50' : ''}
                                     >
                                       <td className="px-4 py-4 text-sm text-foreground">
                                         {new Date(txn.date)?.toLocaleDateString()}
                                       </td>
                                       <td className="px-4 py-4 text-sm font-medium text-muted-foreground font-mono">
                                         {txn?.id}
                                       </td>
                                       <td className="px-4 py-4 text-sm">
                                         <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                                           txn.type === 'TOPUP' || txn.type ==="CREDIT"
                                           ? 'bg-green-50 text-green-700'
                                           : txn.type === 'ESCROW_LOCK'
                                             ? 'bg-yellow-50 text-yellow-700'
                                             : txn.type === 'DEBIT' || txn.type === 'COMMISSION'
                                               ? 'bg-red-50 text-red-700'
                                               : 'bg-blue-50 text-blue-700'
                                           }`}>
                                           {typeLabel}
                                         </span>
                                       </td>
                                       <td className="px-4 py-4 text-sm">
                                         {txn.orderReference ? (
                                           <span className="font-medium text-foreground">{txn.orderReference}</span>
                                         ) : (
                                           <span className="text-muted-foreground">{txn.description}</span>
                                         )}
                                       </td>
                                       <td className={`px-4 py-4 text-right text-sm font-semibold ${isAddition ? 'text-green-600' : isEscrow ? "text-yellow-500" : 'text-red-600'
                                         }`}>
                                         {isAddition ? '+' : isEscrow ? "" : '-'} Rs.{txn?.amount?.toLocaleString()} {wallet?.currency}
                                       </td>
                                     </tr>
                                   );
                                 })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Auto-Billing Settings */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Auto Top-Up Settings */}
          <Card>
            <CardHeader title="Auto Top-Up Settings" />
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between rounded-2xl border border-border p-4">
                <div className="flex-1">
                  <p className="font-medium text-foreground">Automatic Top-Up</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically top up when balance falls below {wallet?.autoTopUpThreshold?.toLocaleString()} {wallet?.currency}
                  </p>
                </div>
                <button
                  onClick={() => setAutoTopUpEnabled(!autoTopUpEnabled)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${autoTopUpEnabled ? 'bg-accent' : 'bg-secondary'
                    }`}
                  role="switch"
                  aria-checked={autoTopUpEnabled}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${autoTopUpEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              {autoTopUpEnabled && (
                <div className="rounded-lg bg-accent/10 p-4 border border-accent/20">
                  <p className="text-sm font-medium text-foreground mb-2">Top-Up Amount</p>
                  <p className="text-2xl font-bold text-accent">5,000 {wallet?.currency}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Will be charged to your default payment method
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          
        </div>
      </div>
    </DriverLayout>
  );
}
