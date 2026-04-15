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
import { secureFetch } from '@/lib/secure-fetch';

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
        const response = await secureFetch(`/api/sellers/orders?sellerId=${sellerId}`);
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
      setIsLoading(true);
      // Use new smart quote calculation API with order context
      const response = await secureFetch(
        `/api/bids/calculate-quotes?shipmentId=${order.id}&limit=10`
      );
      if (response.ok) {
        const data = await response.json();
        setBids(data.data);
      } else {
        const error = await response.json();
        console.error("Error fetching quotes:", error);
        // Fallback message for seller
        alert(error.error || "No businesses available for this shipment");
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
      alert("Failed to find couriers. Please try again.");
    } finally {
      setIsLoading(false);
    }
    setSelectedOrderForBidding(order);
    setIsBiddingModalOpen(true);
  };

  const handleAcceptBid = async (bid: any) => {
    if (selectedOrderForBidding) {
      try {
        setIsLoading(true);
        // Accept bid with validated amount (not just baseRate)
        const response = await secureFetch(
          `/api/shipments/${selectedOrderForBidding.id}?lockEscrow=true`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "PENDING",
              businessId: bid.id,
              amount: bid.totalRate, // Use calculated totalRate, not baseRate
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to assign shipment");
        }

        const updated = await response.json();
        setOrders(orders.map((o) => (o.id === selectedOrderForBidding.id ? updated : o)));
        setIsBiddingModalOpen(false);
        alert("Shipment assigned successfully!");
      } catch (error) {
        console.error("Error accepting bid:", error);
        alert(
          error instanceof Error ? error.message : "Failed to accept bid"
        );
      } finally {
        setIsLoading(false);
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
