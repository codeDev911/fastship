'use client';

import React, { useState, useEffect } from 'react';
import { SellerLayout } from '@/components/seller/SellerLayout';
import { RecentOrdersTable } from '@/components/seller/RecentOrdersTable';
import { BiddingModal } from '@/components/seller/BiddingModal';
import { OrderSyncPreview } from '@/components/seller/OrderSyncPreview';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { Filter, Download, Plus, RefreshCw, Upload } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import OrderDetailsSheet from '@/components/seller/OrderDetails';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { secureFetch } from '@/lib/secure-fetch';
import { useToast } from '@/hooks/use-toast';

export default function SellerOrdersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderForBidding, setSelectedOrderForBidding] = useState<any>(null);
  const [isBiddingModalOpen, setIsBiddingModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showOrderDetails, setShowOrderDetails] = useState({isActive:false,order:{}});
  const [showSyncPreview, setShowSyncPreview] = useState(false);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
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

  // Fetch connected integrations for sync
  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const response = await fetch('/api/sellers/integrations', {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const connected = data.data?.filter((i: any) => i.status === 'connected') || [];
          setIntegrations(connected);
          if (connected.length > 0) {
            setSelectedIntegration(connected[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching integrations:', error);
      }
    };

    fetchIntegrations();
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
        
        // If this order is from a Shopify integration, fulfill it
        if (selectedIntegration && selectedOrderForBidding.shopifyOrders && selectedOrderForBidding.shopifyOrders.length > 0) {
          try {
            await fetch('/api/integrations/shopify/fulfill', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                shipmentId: selectedOrderForBidding.id,
                integrationId: selectedIntegration,
              }),
            });
          } catch (fulfillError) {
            console.error('Warning: Failed to fulfill Shopify order:', fulfillError);
            // Don't fail the entire operation if Shopify fulfillment fails
          }
        }
        
        setOrders(orders.map((o) => (o.id === selectedOrderForBidding.id ? updated : o)));
        setIsBiddingModalOpen(false);
        toast({
          title: 'Success',
          description: 'Shipment assigned successfully!',
        });
      } catch (error) {
        console.error("Error accepting bid:", error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : "Failed to accept bid",
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEdit = (order: any) => {
    router.push(`/seller/orders/create?isEdit=true&shipmentId=${order.id}`);
  };

  const handleSync = async () => {
    if (!selectedIntegration) {
      toast({
        title: 'No Integration',
        description: 'Please connect a store first in Integrations',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch('/api/integrations/shopify/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integrationId: selectedIntegration,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Sync failed');
      }

      const data = await response.json();

      toast({
        title: 'Sync Complete',
        description: `Imported ${data.data.imported} orders, skipped ${data.data.skipped}`,
      });

      // Refresh orders
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const sellerId = user?.jobId;
      const response2 = await secureFetch(`/api/sellers/orders?sellerId=${sellerId}`);
      if (response2.ok) {
        const data2 = await response2.json();
        setOrders(data2.data);
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Sync failed';
      toast({
        title: 'Sync Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportOrders = async (orderIds: string[]) => {
    if (!selectedIntegration) return;

    try {
      const response = await fetch('/api/integrations/shopify/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integrationId: selectedIntegration,
          orderIds,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Import failed');
      }

      const data = await response.json();

      toast({
        title: 'Import Complete',
        description: `Successfully imported ${data.data.imported} orders`,
      });

      // Refresh orders
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const sellerId = user?.jobId;
      const response2 = await secureFetch(`/api/sellers/orders?sellerId=${sellerId}`);
      if (response2.ok) {
        const data2 = await response2.json();
        setOrders(data2.data);
      }

      setShowSyncPreview(false);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Import failed';
      toast({
        title: 'Import Error',
        description: errorMsg,
        variant: 'destructive',
      });
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
         
          <div className="flex gap-2">
            {integrations.length > 0 && (
              <>
                <Button
                  icon={<Upload className="h-4 w-4" />}
                  variant="secondary"
                  onClick={() => setShowSyncPreview(true)}
                >
                  Import Orders
                </Button>
                <Button
                  icon={<RefreshCw className="h-4 w-4" />}
                  variant="secondary"
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? 'Syncing...' : 'Sync'}
                </Button>
              </>
            )}
            <Link href={"/seller/orders/create"}>
            <Button
              icon={<Plus className="h-4 w-4" />}
              variant="primary"
            >
              Create order
            </Button>
            </Link>
          </div>
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
          onEdit={handleEdit}
          onViewDetails={(order) => location.assign(`/seller/orders/${order.id}`)}
        />


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

        {/* Order Sync Preview Modal */}
        {selectedIntegration && (
          <OrderSyncPreview
            open={showSyncPreview}
            onOpenChange={setShowSyncPreview}
            integrationId={selectedIntegration}
            onImport={handleImportOrders}
          />
        )}
      </div>
    </SellerLayout>
  );
}
