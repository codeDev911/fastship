'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { StatusBadge } from '@/components/shared/Badge';
import { DriverAssignmentModal } from '@/components/business/DriverAssignmentModal';
import {
  MapPin,
  Phone,
  User, 
  ArrowLeft,
  AlertCircle,
  Truck, 
  FileText,
  Motorbike, 
  Clock10, 
  CheckCircle,
  XCircle,
  InfoIcon,
  ArrowBigDownDash,
  UserCircle,
  BoxIcon,
} from 'lucide-react';
import { BusinessLayout } from '@/components/business/BusinessLayout';
import { secureFetch } from '@/lib/secure-fetch';

function formatDuration(date1:any, date2:any) {
     // Ensure start is the earlier date
    let start:any = new Date(Math.min(date1, date2));
    let end:any = new Date(Math.max(date1, date2));

    const totalMinutes = (end - start) / 60000;

    // Rule 1: Only show decimal minutes if under 1 hour
    if (totalMinutes < 60) {
        return totalMinutes.toFixed(1) + "mins";
    }

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();
    let hours = end.getHours() - start.getHours();
    let mins = end.getMinutes() - start.getMinutes();

    // Adjust for negative values (borrowing from larger units)
    if (mins < 0) { mins += 60; hours--; }
    if (hours < 0) { hours += 24; days--; }
    if (days < 0) {
        // Get days in the previous month
        const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
        days += prevMonth;
        months--;
    }
    if (months < 0) { months += 12; years--; }

    // Calculate weeks and remaining days
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;

    // Build output string
    let parts = [];
    if (years > 0) parts.push(years + "yrs");
    if (months > 0) parts.push(months + "mos");
    if (weeks > 0) parts.push(weeks + "wks");
    if (remainingDays > 0) parts.push(remainingDays + "days");
    if (hours > 0) parts.push(hours + "hrs");
    if (mins > 0) parts.push(mins + "mins");

    return parts.join(" ");
}


export default function ShipmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const shipmentId = params.id as string;

  const [shipment, setShipment] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [timeTaken,setTimeTaken] = useState("")



  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const businessId = user?.jobId;
        const [shipmentRes, driversRes] = await Promise.all([
          secureFetch(`/api/shipments/${shipmentId}?businessId=${businessId}`),
          secureFetch('/api/drivers'),
        ]);

        if (shipmentRes.ok) {
          const shipmentData = await shipmentRes.json();
          setShipment(shipmentData);
          setSelectedDriver(shipmentData?.driverId || '');
          const time = formatDuration(new Date(shipmentData?.activities[0]?.createdAt), new Date(shipmentData?.activities?.slice(-1)?.createdAt))
          setTimeTaken(time)
        }

        if (driversRes.ok) {
          const driversData = await driversRes.json();
          setDrivers(driversData.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [shipmentId]);

  if (isLoading) {
    return (
      <BusinessLayout currentPage="shipments" unreadNotifications={0}>
        <div className="flex items-center justify-center py-12">
          <p>Loading...</p>
        </div>
      </BusinessLayout>
    );
  }

  if (!shipment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-semibold text-foreground">Shipment not found</p>
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

  const assignedDriver = shipment?.assignment?.driverId
    ? drivers.find((d) => d.id === shipment?.assignment?.driverId)
    : null;

  const availableDrivers = drivers.filter(
    (d) => d.status === 'ACTIVE' || d.status === 'on-delivery'
  );

  const handleAssignDriver = async () => {
    if (selectedDriver) {
      try {
        setIsUpdating(true);
        const response = await secureFetch(`/api/shipments/${shipmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ driverId: selectedDriver, status: 'ASSIGNED', businessId: shipment.businessId }),
        });

        if (!response.ok) throw new Error('Failed to assign driver');
        const updated = await response.json();
        setShipment(updated);
        setIsAssignmentModalOpen(false);
      } catch (error) {
        console.error('Error assigning driver:', error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <BusinessLayout currentPage="shipments" unreadNotifications={0}>
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
            <h1 className="text-3xl font-bold text-foreground">{shipment.id}</h1>
            <p className="text-sm text-muted-foreground">
              Order placed {new Date(shipment?.createdAt || Date.now())?.toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Status Card */}
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
                      PKR {(shipment?.codAmount + shipment?.actualRate)?.toFixed(2)}
                    </p>
                  </div>
                </div>

                {shipment?.payment?.paymentMethod === "COD" && shipment?.payment?.paymentStatus === "PENDING" && (
                  <div className='rounded-2xl border border-yellow-500 p-3 mt-2 bg-yellow-100'>
                    <h3 className="text-base font-bold text-yellow-600">Attention</h3>
                    <p className="text-xs text-muted-foreground">The payment of this shipment in up-paid, the payments recieved by your driver from customer, you need to collect the COD payments from driver and hand over to the seller. The pending COD payments reduce your visibility and trust on our platform</p>
                  </div>
                )}

                {shipment.status === 'PENDING' && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      This shipment needs a driver assignment to proceed.
                    </p>
                  </div>
                )}
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
                  <p className="text-foreground">{shipment.deliveryEmail}</p>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <div className="grid md:grid-cols-2 gap-4
          ">
              <Card>
                <CardHeader title="Delivery Address" />
                <CardContent>
                  <div className="flex gap-3">
                    <MapPin className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-foreground">
                        {shipment.deliveryAddress}
                      </p>
                      <p className="text-foreground text-sm">
                        City : {shipment.deliveryCity}
                      </p>
                      <p className="text-foreground text-sm">
                        State : {shipment.deliveryState}
                      </p>
                      <p className="text-foreground text-sm">
                        Zip Code : {shipment.deliveryZipCode}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader title="Pickup Address" />
                <CardContent>
                  <div className="flex gap-3">
                    <MapPin className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-foreground">
                        {shipment.pickupAddress}
                      </p>
                      <p className="text-foreground text-sm">
                        City : {shipment.pickupCity},
                      </p>
                      <p className="text-foreground text-sm">
                        State : {shipment.pickupState}
                      </p>
                      <p className="text-foreground text-sm">
                        Zip Code : {shipment.pickupZipCode}
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

            {/* Source Information */}
            <Card>
              <CardHeader title="Order Source" />
              <CardContent>
                <div className="flex gap-3">
                  <FileText className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground capitalize">{shipment.source}</p>
                    <p className="text-sm text-muted-foreground">
                      {shipment.source === 'shopify'
                        ? 'Imported from Shopify store'
                        : 'Manually created order'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Payments" />
              <CardContent>
                <div className="grid md:grid-cols-5 grid-cols-2 gap-3">
                  <div className="flex flex-col ">
                    <h3 className="text-sm font-medium">
                      Amount
                    </h3>
                    <p className="text-lg font-bold ">Rs. {shipment?.payment?.amount}</p>
                  </div>
                  <div className="flex flex-col ">
                    <h3 className="text-sm font-medium">
                      Status
                    </h3>
                    <p className="text-sm ">{shipment?.payment?.paymentStatus}</p>
                  </div>
                  <div className="flex flex-col ">
                    <h3 className="text-sm font-medium">
                      Method
                    </h3>
                    <p className="text-sm ">Rs. {shipment?.payment?.paymentMethod}</p>
                  </div>
                  <div className="flex flex-col ">
                    <h3 className="text-sm font-medium">
                      Paid At
                    </h3>
                    <p className="text-sm ">{shipment?.payment?.paidAt ? new Date(shipment?.payment?.paidAt).toLocaleDateString() : "Not paid"}</p>
                  </div>
                  <div className="flex flex-col ">
                    <h3 className="text-sm font-medium">
                      Created At
                    </h3>
                    <p className="text-sm ">{new Date(shipment?.payment?.createdAt).toLocaleDateString() || "-"}</p>
                  </div>
                  <div className="flex flex-col ">
                    <h3 className="text-sm font-medium">
                      Transaction Id
                    </h3>
                    <p className="text-sm ">{shipment?.payment?.transactionId || "-"}</p>
                  </div>
                  <div className="flex flex-col ">
                    <h3 className="text-sm font-medium">
                      Tax
                    </h3>
                    <p className="text-sm ">Rs {shipment?.payment?.tax || "0"}</p>
                  </div>
                  <div className="flex flex-col ">
                    <h3 className="text-sm font-medium">
                      Commission
                    </h3>
                    <p className="text-sm ">Rs {shipment?.payment?.commission || "0"}</p>
                  </div>
                  <div className="flex flex-col ">
                    <h3 className="text-sm font-medium">
                      Driver Payable
                    </h3>
                    <p className="text-sm ">Rs {shipment?.payment?.driverPayable || "-"}</p>
                  </div>
                  <div className="flex flex-col ">
                    <h3 className="text-sm font-medium">
                      Notes
                    </h3>
                    <p className="text-sm ">{shipment?.payment?.notes || "-"}</p>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Financial Information */}
            <Card>
              <CardHeader title="Financial Information" />
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Payment method</span>
                    <span className="font-medium text-foreground">
                      PKR {shipment?.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal (seller)</span>
                    <span className="font-medium text-foreground">
                      PKR {shipment?.codAmount?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Delivery Fee (total)</span>
                    <span className="font-medium text-accent">
                      PKR {shipment?.actualRate?.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-border pt-3">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-accent">
                      PKR {(shipment?.codAmount + shipment?.actualRate)?.toFixed(2)}
                    </span>
                  </div>

                  <div className="p-3 space-y-1 rounded-2xl border ">
                    <h2 className="text-sm  font-medium">
                      Delivery fee distribution
                    </h2>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Business Commission (10%)</span>
                      <span className="text-xs text-muted-foreground">
                        PKR {shipment?.actualRate * 0.1}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Platform Commission (10%)</span>
                      <span className="text-xs text-muted-foreground">
                        PKR {shipment?.actualRate * 0.1}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Driver Commission (80%)</span>
                      <span className="text-xs text-muted-foreground">
                        PKR {shipment?.actualRate * 0.8}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

           
            {
             assignedDriver &&  <Card>
                <CardHeader title="Assigned Driver" />
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <Motorbike className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{assignedDriver?.user.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {assignedDriver?.vehicleType} - {assignedDriver?.vehicleNumber}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Rating:</span>
                          <span className="ml-2 font-medium">⭐ {assignedDriver.rating}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Deliveries:</span>
                          <span className="ml-2 font-medium">{assignedDriver.totalDeliveries}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="ml-2 font-medium">{assignedDriver.user.phone}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            }
             {/* Driver Assignment */}
            {!shipment?.assignment?.driverId  && (
              <Card>
                <CardHeader title="Assign Driver" />
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select an available driver from our network to assign this shipment.
                  </p>
                  <Button
                    onClick={() => setIsAssignmentModalOpen(true)}
                    isLoading={isUpdating}
                    fullWidth
                  >
                    Browse & Assign Driver
                  </Button>
                </CardContent>
              </Card>
            ) }

            {/* Timeline */}
            <Card>
              <CardHeader title="Status Timeline" />
              <CardContent className="space-y-4">
                {shipment?.activities?.map((step:any, idx:any) => {
                  const isActive =
                    shipment.status === step.status 

                  const getIcon = (status:any) =>{
                    let icon: any
                  switch (status) {
                    case "PENDING":
                      icon = <Clock10 className='h-4 w-4' />
                      break;
                    case "ASSIGNED":
                      icon = <UserCircle className='h-4 w-4' />
                      break;
                    case "PICKED_UP":
                      icon = <BoxIcon className='h-4 w-4' />
                      break;
                    case "IN_TRANSIT":
                      icon = <Truck className='h-4 w-4' />
                      break;
                    case "DELIVERED":
                      icon = <CheckCircle className='h-4 w-4' />
                      break;
                    case "CANCELLED":
                      icon = <XCircle className='h-4 w-4' />
                      break;
                    case "FAILED":
                      icon = <InfoIcon className='h-4 w-4' />
                      break;
                    case "RETURNED":
                      icon = <ArrowBigDownDash className='h-4 w-4' />
                      break;
                    default:
                      break;
                  }
                  return icon
                  }

                  return (
                    <div key={step.status} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`rounded-full p-2 ${isActive
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-secondary text-muted-foreground'
                            }`}
                        >
                          {getIcon(step.status)}
                        </div>
                        {idx < shipment?.activities?.length && <div className="w-0.5 h-8 bg-border my-1" />}
                      </div>
                      <div className="pt-1 pb-2">
                        <p className="font-medium text-foreground">{step?.status}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(step?.createdAt).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            minute: "2-digit",
                            hour: "2-digit",
                            hour12: true
                          })}
                        </p>
                          <p className="text-sm text-foreground">{step?.description}</p>
                      </div>
                    </div>
                  );
                })}
                <p className="text-sm">Time taken : {timeTaken}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <DriverAssignmentModal
          isOpen={isAssignmentModalOpen}
          drivers={availableDrivers}
          onClose={() => setIsAssignmentModalOpen(false)}
          onAssignDriver={async (driverId) => {
            setSelectedDriver(driverId);
            setIsUpdating(true);
            await handleAssignDriver()
            setIsUpdating(false);
          }}
          isLoading={isUpdating}
        />
      </div>
    </BusinessLayout>
  );
}
