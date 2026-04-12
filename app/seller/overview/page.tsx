'use client';

import React, { useState, useEffect } from 'react';
import { SellerLayout } from '@/components/seller/SellerLayout';
import { SellerMetrics } from '@/components/seller/SellerMetrics';
import { RecentOrdersTable } from '@/components/seller/RecentOrdersTable';
import { BiddingModal } from '@/components/seller/BiddingModal';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { TrendingUp, AlertCircle } from 'lucide-react';

export default function SellerDashboardPage() {
  const [sellerId] = useState<string>('seller-1');
  const [orders, setOrders] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderForBidding, setSelectedOrderForBidding] = useState<any>(null);
  const [isBiddingModalOpen, setIsBiddingModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [ordersRes, walletRes] = await Promise.all([
          fetch(`/api/sellers/orders?sellerId=${sellerId}`),
          fetch(`/api/wallets?sellerId=${sellerId}`),
        ]);

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData.data.slice(0, 5));
        }

        if (walletRes.ok) {
          const walletData = await walletRes.json();
          setWalletBalance(walletData.data?.balance || 0);
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
  const inTransit = orders.filter((o) => o.status === 'IN_TRANSIT').length;
  const deliveredToday = orders.filter(
    (o) =>
      o.status === 'DELIVERED' &&
      new Date(o.createdAt).toDateString() === new Date().toDateString()
  ).length;

  const handleFindCourier = (order: any) => {
    setSelectedOrderForBidding(order);
    setIsBiddingModalOpen(true);
  };

  const handleAcceptBid = async (bid: any) => {
    if (selectedOrderForBidding) {
      try {
        const response = await fetch(`/api/shipments/${selectedOrderForBidding.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'ASSIGNED',
            businessId: bid.businessId,
            amount: bid.price,
          }),
        });

        if (!response.ok) throw new Error('Failed to assign');
        const updated = await response.json();
        setOrders(orders.map((o) => (o.id === selectedOrderForBidding.id ? updated : o)));
        setIsBiddingModalOpen(false);
      } catch (error) {
        console.error('Error accepting bid:', error);
      }
    }
  };

  const recentOrders = orders.slice(0, 5);

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
            <p className="mt-2 text-muted-foreground">Welcome back, Fashion Store!</p>
          </div>
          <Button variant="secondary">Export Report</Button>
        </div>

        {/* Key Metrics */}
        {/* <SellerMetrics
          pendingDispatch={pendingDispatch}
          inTransit={inTransit}
          deliveredToday={deliveredToday}
          walletBalance={mockSellerWallet.balance}
          currency={mockSellerWallet.currency}
        /> */}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Performance Card */}
          <Card>
            <CardHeader title="Performance" />
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 flex-shrink-0 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Delivery Rate</p>
                  <p className="text-2xl font-bold text-green-600">98.5%</p>
                  <p className="text-xs text-muted-foreground">+2.1% from last week</p>
                </div>
              </div>
              <div className="h-1 w-full rounded-full bg-secondary">
                <div className="h-full w-[98.5%] rounded-full bg-green-600"></div>
              </div>
            </CardContent>
          </Card>

          {/* Active Orders Card */}
          <Card>
            <CardHeader title="Active Shipments" />
            <CardContent className="space-y-4 p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Processing</p>
                  <p className="text-lg font-bold text-blue-600">{pendingDispatch}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">In Transit</p>
                  <p className="text-lg font-bold text-purple-600">{inTransit}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Delivered Today</p>
                  <p className="text-lg font-bold text-green-600">{deliveredToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert */}
        {pendingDispatch > 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600 mt-0.5" />
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
            <a href="/seller/orders" className="text-sm text-accent hover:underline font-medium">
              View All
            </a>
          </div>
          <RecentOrdersTable
            orders={recentOrders}
            onFindCourier={handleFindCourier}
            onViewDetails={(order) => console.log('View details:', order)}
          />
        </div>

        {/* Bidding Modal */}
        {selectedOrderForBidding && (
          <BiddingModal
            isOpen={isBiddingModalOpen}
            order={selectedOrderForBidding}
            bids={bids}
            onClose={() => setIsBiddingModalOpen(false)}
            onAcceptBid={handleAcceptBid}
          />
        )}
      </div>
    </SellerLayout>
  );
}
