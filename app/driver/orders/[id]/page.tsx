'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { secureFetch } from '@/lib/secure-fetch';

import { StatusBadge } from '@/components/shared/Badge';
import { ReportDisputeModal } from '@/components/shared/ReportDisputeModal';
import { StatusUpdateModal } from '@/components/driver/StatusUpdateModal';
import { 
  MapPin,
  Phone,
  User,
  Package,
  DollarSign,
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Navigation,
  Signature,
} from 'lucide-react';
import { DriverLayout } from '@/components/driver/DriverLayout';
import { shipmentService } from '@/lib/services/shipment.service';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const shipmentId = params.id as string;


  const [shipment, setShipment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

  useEffect(() => {
    const fetchShipment = async () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
  const driverId = user?.jobId;
      try {
        setIsLoading(true);
        const response = await secureFetch(`/api/shipments/${shipmentId}?driverId=${driverId}`);
        if (!response.ok) throw new Error('Failed to fetch shipment');
        const data = await response.json();
        setShipment(data);
        setSelectedStatus(data.status);
      } catch (error) {
        console.error('Error fetching shipment:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShipment();
  }, [shipmentId]);

  if (isLoading) {
    return (
      <DriverLayout currentPage="orders" unreadNotifications={0}>
        <div className="flex items-center justify-center py-12">
          <p>Loading...</p>
        </div>
      </DriverLayout>
    );
  }

  if (!shipment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-semibold text-foreground">Order not found</p>
            <Button
              onClick={() => router.back()}
              className="mt-4"
              variant="outline"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getNextAction = () => {
    switch (shipment.status) {
      case 'ASSIGNED':
        return { label: 'Start Delivery', action: 'IN_TRANSIT', icon: Navigation };
      case 'IN_TRANSIT':
        return { label: 'Complete Delivery', action: 'DELIVERED', icon: CheckCircle2 };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  const handleStatusChange = async (newStatus: any) => {
    setIsUpdating(true);
   try {
     await secureFetch(`/api/driver/delivery?shipmentId=${shipmentId}&status=${newStatus}&canceledBy=driver`, {
       method: 'PATCH',
       headers: { 'Content-Type': 'application/json' },
     });
     setShipment((prev: any) => ({ ...prev, status: newStatus }));
   } catch (error) {
    alert("Error occured")
   }finally{
    
    
    setSelectedStatus(newStatus);
    setIsUpdating(false);
   }
  };

  return (
    <DriverLayout currentPage="orders" unreadNotifications={0}>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-full p-2 hover:bg-secondary transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{shipment.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">
              Order placed {new Date(shipment.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Status and Quick Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Current Status</p>
                    <StatusBadge status={shipment.status} />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-2">Order Value</p>
                    <p className="text-2xl font-bold text-accent">
                      PKR {(shipment.codAmount + shipment.actualRate).toFixed(2)}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => setIsStatusModalOpen(true)}
                  isLoading={isUpdating}
                  fullWidth
                  className="mt-4"
                >
                  Update Status
                </Button>

                <Button
                  onClick={() => setIsDisputeModalOpen(true)}
                  variant="outline"
                  fullWidth
                  className="mt-2"
                >
                  Report Issue
                </Button>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader title="Customer Information" />
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex gap-3">
                    <User className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Name</p>
                      <p className="text-lg font-semibold text-foreground">{shipment.deliveryName}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Phone className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Phone</p>
                      <p className="text-lg font-semibold text-foreground">{shipment.deliveryPhone}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Email</p>
                  <p className="text-foreground">{shipment.deliveryPhone}</p>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <div className="grid md:grid-cols-2 gap-4" >
              <Card>
              <CardHeader title="Pickup Address" />
              <CardContent>
                <div className="flex gap-3">
                  <MapPin className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-foreground">
                      {shipment.pickupAddress}
                    </p>
                    <p className="text-foreground">
                      {shipment.pickupCity}, {shipment.pickupState} {shipment.pickupZipCode}
                    </p> 
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader title="Delivery Address" />
              <CardContent>
                <div className="flex gap-3">
                  <MapPin className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-foreground">
                      {shipment.deliveryAddress}
                    </p>
                    <p className="text-foreground">
                      {shipment.deliveryCity}, {shipment.deliveryState} {shipment.deliveryZipCode}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Estimated delivery time: 2-3 hours
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Products */}
            {/* <Card>
              <CardHeader title={`Items (${shipment.products.length})`} />
              <CardContent className="space-y-3">
                {shipment.products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-start justify-between rounded-lg bg-secondary/30 p-4"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {product.quantity}</p>
                    </div>
                    <p className="font-semibold text-accent">${product.price.toFixed(2)}</p>
                  </div>
                ))}
              </CardContent>
            </Card> */}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Method */}
            <Card>
              <CardHeader title="Payment Method" />
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <CreditCard className="h-5 w-5 text-accent flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-semibold text-foreground">{shipment.paymentMethod}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-foreground">
                      PKR {shipment.codAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Delivery Fee</span>
                    <span className="font-medium text-accent">
                      PKR {shipment.actualRate.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-3">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-accent">
                      PKR {(shipment.codAmount + shipment.actualRate).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Your Earning */}
            <Card className="border-l-4 border-l-accent">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">Your Earning</p>
                <p className="text-3xl font-bold text-accent mb-4">
                  PKR {(shipment.actualRate * 0.8).toFixed(2)}
                </p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>Base delivery fee for this order</p>
                  <p>Credited after successful delivery</p>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Status Timeline */}
            <Card>
              <CardHeader title="Status Timeline" />
              <CardContent className="space-y-4">
                {[
                  { status: 'ASSIGNED', label: 'Assigned to you', icon: CheckCircle2 },
                  { status: 'IN_TRANSIT', label: 'In Transit', icon: Navigation },
                  { status: 'DELIVERED', label: 'Completed', icon: CheckCircle2 },
                ].map((step, idx) => (
                  <div key={step.status} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`rounded-full p-2 ${['PENDING', 'ASSIGNED'].includes(shipment.status) && shipment.status === step.status
                          ? 'bg-accent text-accent-foreground'
                          : ['IN_TRANSIT', 'DELIVERED'].includes(shipment.status) && step.status !== 'ASSIGNED'
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-secondary text-muted-foreground'
                          }`}
                      >
                        <step.icon className="h-4 w-4" />
                      </div>
                      {idx < 2 && <div className="w-0.5 h-8 bg-border my-1" />}
                    </div>
                    <div className="pt-1">
                      <p className="font-medium text-foreground">{step.label}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
        <StatusUpdateModal
          isOpen={isStatusModalOpen}
          currentStatus={selectedStatus}
          onClose={() => setIsStatusModalOpen(false)}
          onStatusChange={handleStatusChange}
          isLoading={isUpdating}
        />

        <ReportDisputeModal
          shipmentId={shipmentId}
          isOpen={isDisputeModalOpen}
          onClose={() => setIsDisputeModalOpen(false)}
          onSuccess={() => {
            setIsDisputeModalOpen(false);
            // Optionally refresh shipment data
          }}
          userRole="DRIVER"
        />
      </div>
    </DriverLayout>
  );
}
