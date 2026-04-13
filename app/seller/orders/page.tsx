'use client';

import React, { useState, useEffect } from 'react';
import { SellerLayout } from '@/components/seller/SellerLayout';
import { RecentOrdersTable } from '@/components/seller/RecentOrdersTable';
import { BiddingModal } from '@/components/seller/BiddingModal';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { Filter, Download, Plus } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import OrderDetailsSheet from '@/components/seller/OrderDetails';
import Link from 'next/link';

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderForBidding, setSelectedOrderForBidding] = useState<any>(null);
  const [isBiddingModalOpen, setIsBiddingModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showOrderDetails, setShowOrderDetails] = useState({isActive:false,order:{}});
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const user= JSON.parse(localStorage.getItem('user') || '{}');
        const sellerId = user?.jobId;
        const response = await fetch(`/api/sellers/orders?sellerId=${sellerId}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setOrders(data.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleFindCourier = async (order: any) => {
    try {
      const response = await fetch(`/api/bids/business-rates?limit=10`);
      if (response.ok) {
        const data = await response.json();
        setBids(data.data);
      }
    } catch (error) {
      console.error('Error fetching bids:', error);
    }
    setSelectedOrderForBidding(order);
    setIsBiddingModalOpen(true);
  };

  const handleAcceptBid = async (bid: any) => {
    if (selectedOrderForBidding) {
      try {
        const response = await fetch(`/api/shipments/${selectedOrderForBidding.id}?lockEscrow=true`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'PENDING',
            businessId: bid.id,
            amount: bid.baseRate,
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

  const filteredOrders =
    filterStatus === 'all' ? orders : orders.filter((order) => order.status === filterStatus);

  return (
    <SellerLayout
      currentPage="orders"
      walletBalance={walletBalance}
      currency="PKR"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
         
          <Link href={"/seller/orders/create"}>
          <Button
            icon={<Plus className="h-4 w-4" />}
            variant="primary"
          >
            Create order
          </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <p className="font-medium text-foreground">Filter by Status:</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {['all', 'PENDING', 'PUCKED_UP', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED',"FAILED"].map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors capitalize ${
                        filterStatus === status
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-secondary text-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {status}
                    </button>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <RecentOrdersTable
          orders={filteredOrders}
          onFindCourier={handleFindCourier}
          onViewDetails={(order) => setShowOrderDetails({isActive:true,order:order})}
        />

        <OrderDetailsSheet isOpen={showOrderDetails.isActive} data={showOrderDetails.order} onClose={() => setShowOrderDetails({isActive:false,order:{}})} />

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
