'use client';

import React, { useState, useEffect } from 'react';
import { SellerLayout } from '@/components/seller/SellerLayout'; 
import { RecentOrdersTable } from '@/components/seller/RecentOrdersTable';
import { BiddingModal } from '@/components/seller/BiddingModal';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { TrendingUp, AlertCircle, Package, Truck, CheckCircle2 } from 'lucide-react';
import { secureFetch } from '@/lib/secure-fetch';
import { useRouter } from 'next/navigation';

export default function SellerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sellerId, setSellerId] = useState<string>('');
  const [orders, setOrders] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderForBidding, setSelectedOrderForBidding] = useState<any>(null);
  const [isBiddingModalOpen, setIsBiddingModalOpen] = useState(false);

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
        const [ordersRes, walletRes] = await Promise.all([
          secureFetch(`/api/sellers/orders?sellerId=${sellerId}`),
          secureFetch(`/api/wallets?sellerId=${sellerId}`),
        ]);

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData.data || []);
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
  const totalOrders = orders.length;
  const pendingDispatch = orders.filter((o) => o.status === 'PENDING').length;
  const assignedOrders = orders.filter((o) => o.status === 'ASSIGNED').length;
  const inTransit = orders.filter((o) => o.status === 'IN_TRANSIT').length;
  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED').length;
  const failedOrders = orders.filter((o) => o.status === 'FAILED').length;
  
  // Calculate delivery rate
  const deliveryRate = totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : 0;

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
            <p className="mt-2 text-muted-foreground">Welcome back, {user?.name || 'Seller'}!</p>
          </div>
          <Button variant="secondary" onClick={() => window.print()}>Export Report</Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {/* Total Orders Card */}
          <Card>
            <CardContent className="space-y-3 p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-blue-50 p-2.5">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-foreground">{totalOrders}</p>
              </div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
            </CardContent>
          </Card>

          {/* Pending Card */}
          <Card>
            <CardContent className="space-y-3 p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-yellow-50 p-2.5">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-yellow-600">{pendingDispatch}</p>
              </div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>

          {/* In Transit Card */}
          <Card>
            <CardContent className="space-y-3 p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-purple-50 p-2.5">
                  <Truck className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-purple-600">{inTransit}</p>
              </div>
              <p className="text-sm text-muted-foreground">In Transit</p>
            </CardContent>
          </Card>

          {/* Delivered Card */}
          <Card>
            <CardContent className="space-y-3 p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-green-50 p-2.5">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">{deliveredOrders}</p>
              </div>
              <p className="text-sm text-muted-foreground">Delivered</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance & Active Shipments */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Performance Card */}
          <Card>
            <CardHeader title="Performance" />
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Delivery Rate</p>
                  <p className="text-2xl font-bold text-green-600">{deliveryRate}%</p>
                  <p className="text-xs text-muted-foreground">{deliveredOrders} of {totalOrders} orders delivered</p>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary">
                <div 
                  className="h-full rounded-full bg-green-600" 
                  style={{ width: `${deliveryRate}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Active Orders Card */}
          <Card>
            <CardHeader title="Order Summary" />
            <CardContent className="space-y-4 p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Processing (Pending)</p>
                  <p className="text-lg font-bold text-yellow-600">{pendingDispatch}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Assigned</p>
                  <p className="text-lg font-bold text-blue-600">{assignedOrders}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">In Transit</p>
                  <p className="text-lg font-bold text-purple-600">{inTransit}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-lg font-bold text-red-600">{failedOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
            <a href="/seller/orders" className="text-sm text-accent hover:underline font-medium">
              View All
            </a>
          </div>
          <RecentOrdersTable
            orders={recentOrders}
            onFindCourier={handleFindCourier}
            onEdit={handleEdit}
            onViewDetails={(order) => router.push(`/seller/orders/${order.id}`)}
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
