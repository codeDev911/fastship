'use client';

import  { useState, useEffect } from 'react';
import { SellerLayout } from '../../../components/SellerLayout';
import { RecentOrdersTable } from '../../../components/RecentOrdersTable';
import { RecentPaymentsTable } from '../../../components/RecentPaymentsTable';
import { AnalyticsCharts } from '../../../components/AnalyticsCharts';
import { BiddingModal } from '../../../components/BiddingModal';
import { Card,  CardContent } from '@fastship/ui';
import { Button } from '@fastship/ui';
import {  AlertCircle, CheckCircle2, Banknote, PercentCircle } from 'lucide-react';
import { CurrencyDisplay, secureFetch } from '@fastship/lib';
import { useRouter } from 'next/navigation';
import { Currency } from '@prisma/client';

export default function SellerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sellerId, setSellerId] = useState<string>('');
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderForBidding, setSelectedOrderForBidding] = useState<any>(null);
  const [isBiddingModalOpen, setIsBiddingModalOpen] = useState(false);
  const [paymentStats, setPaymentStats] = useState({
    pendingAmount: 0,
    pendingAmountBase: 0,
    peferredCurrency:Currency.USD,
    amountRatio: 0,
    totalPayments: 0,
    totalPaymentsBase: 0,
    completedAmount:0,
    completedAmountBase:0,
  })
  // Get user from localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(storedUser);
    setSellerId(storedUser?.jobId || '');
  }, []);

  useEffect(() => {
    if (!sellerId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [ordersRes, paymentsRes] = await Promise.all([
          secureFetch(`/api/sellers/orders?sellerId=${sellerId}`),
          secureFetch(`/api/payments?sellerId=${sellerId}&limit=5`),
        ]);

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData.data || []);
          console.log(ordersData);
          
        }

        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          setPaymentStats({
            pendingAmount: paymentsData.stats.pendingAmount,
            amountRatio: paymentsData.stats.amountRatio,
            totalPayments: paymentsData.stats.totalPayments,
            completedAmount: paymentsData.stats.completedAmount,
            peferredCurrency: paymentsData.stats.peferredCurrency || 'USD',
            pendingAmountBase: paymentsData.stats.pendingAmountBase,
            totalPaymentsBase: paymentsData.stats.totalPaymentsBase,
            completedAmountBase: paymentsData.stats.completedAmountBase,
          })
          setPayments(paymentsData.payments || []);
          console.log(paymentsData);
          
        }


      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sellerId]);

  // Calculate metrics
  const pendingDispatch = orders.filter((o) => o.status === 'PENDING').length;


  const handleFindCourier = async (order: any) => {
    try {
      const response = await secureFetch(
        `/api/bids/calculate-quotes?shipmentId=${order.id}&limit=10`
      );
      if (response.ok) {
        const data = await response.json();
        setSelectedOrderForBidding(order);
        // Store bids in state if needed
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    }
    setSelectedOrderForBidding(order);
    setIsBiddingModalOpen(true);
  };

  const handleEdit = (order: any) => {
    router.push(`/seller/orders/create?isEdit=true&shipmentId=${order.id}`);
  };

  const handleAcceptBid = async (bid: any) => {
    if (selectedOrderForBidding) {
      try {
        setIsLoading(true);
        const response = await secureFetch(
          `/api/shipments/${selectedOrderForBidding.id}?lockEscrow=true`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'ASSIGNED',
              businessId: bid.id,
              amount: bid.totalRate,
            }),
          }
        );

        if (!response.ok) throw new Error('Failed to assign shipment');
        const updated = await response.json();
        setOrders(orders.map((o) => (o.id === selectedOrderForBidding.id ? updated : o)));
        setIsBiddingModalOpen(false);
      } catch (error) {
        console.error('Error accepting bid:', error);
        alert('Failed to accept bid');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const recentOrders = orders 

  return (
    <SellerLayout
      currentPage="overview"
      walletBalance={walletBalance}
      currency="PKR"
      onTopUp={() => alert('Top up functionality would open payment modal')}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-2 text-muted-foreground">Welcome back, {user?.name || 'Seller'}!</p>
          </div>
          <Button variant="secondary" onClick={() => window.print()}>Export Report</Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {/* Total Orders Card */}
          <Card>
            <CardContent className="space-y-3 p-1 ">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-blue-50 p-2.5">
                  <Banknote className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-foreground"><CurrencyDisplay amountBase={paymentStats.totalPaymentsBase} currency={paymentStats.peferredCurrency} amount={paymentStats?.totalPayments}/></p>
              </div>
              <p className="text-sm text-muted-foreground">Total Payments</p>
            </CardContent>
          </Card>

          {/* Pending Card */}
          <Card>
            <CardContent className="space-y-3 p-1">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-yellow-50 p-2.5">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-yellow-600"><CurrencyDisplay amountBase={paymentStats.pendingAmountBase} currency={paymentStats.peferredCurrency} amount={paymentStats?.pendingAmount}/></p>
              </div>
              <p className="text-sm text-muted-foreground">Pending payments</p>
            </CardContent>
          </Card>

          {/* In Transit Card */}
          <Card>
            <CardContent className="space-y-3 p-1">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-purple-50 p-2.5">
                  <PercentCircle className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-purple-600">{paymentStats.amountRatio}%</p>
              </div>
              <p className="text-sm text-muted-foreground">Amount ratio</p>
            </CardContent>
          </Card>

          {/* Delivered Card */}
          <Card>
            <CardContent className="space-y-3 ">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-green-50 p-2.5">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600"><CurrencyDisplay amountBase={paymentStats.completedAmountBase} currency={paymentStats.peferredCurrency} amount={paymentStats.completedAmount}/></p>
              </div>
              <p className="text-sm text-muted-foreground">Completed payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts Section */}
        {sellerId && (
          <div className="border-t border-slate-200 pt-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Analytics & Insights</h2>
              <p className="text-sm text-muted-foreground">Comprehensive overview of your shipment performance and order statistics</p>
            </div>
            <AnalyticsCharts sellerId={sellerId} />
          </div>
        )}


        {/* Alert */}
        {pendingDispatch > 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">
                {pendingDispatch} orders awaiting dispatch
              </p>
              <p className="text-sm text-yellow-800">
                Find couriers for pending orders to accelerate shipping
              </p>
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Recent Orders</h2>
            <a href="/orders" className="text-sm text-accent hover:underline font-medium">
              View All
            </a>
          </div>
          <RecentOrdersTable
            orders={recentOrders}
            onFindCourier={handleFindCourier}
            onEdit={handleEdit}
            onViewDetails={(order) => router.push(`/orders/${order.id}`)}
          />
        </div>

        {/* Recent Payments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Recent Payments</h2>
            <a href="/payments" className="text-sm text-accent hover:underline font-medium">
              View All
            </a>
          </div>
          <RecentPaymentsTable
            payments={payments}
            peferredCurrency={paymentStats.peferredCurrency}
            onViewDetails={(payment) => {
              // Handle view payment details
              console.log('View payment details:', payment);
            }}
            onDownloadReceipt={(payment) => {
              // Handle download receipt
              console.log('Download receipt for:', payment);
            }}
          />
        </div>

        {/* Bidding Modal */}
        {selectedOrderForBidding && (
          <BiddingModal
            isOpen={isBiddingModalOpen}
            order={selectedOrderForBidding}
            bids={[]}
            onClose={() => setIsBiddingModalOpen(false)}
            onAcceptBid={handleAcceptBid}
          />
        )}
      </div>
    </SellerLayout>
  );
}
