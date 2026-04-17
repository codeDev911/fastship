'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { StatusBadge } from '@/components/shared/Badge';
import { TrackingMap, MapDirections, MapLink } from '@/components/maps';
import type { ShipmentMapData } from '@/lib/types/maps';
import {
  MapPin,
  Phone,
  User,
  Package,
  Calendar,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Loader,
  Navigation,
  MapPinOff,
  TrendingUp,
  ArrowBigDownDash,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface TrackingShipment {
  id: string;
  paymentMethod:string
  shipmentNumber: string;
  status: string;
  createdAt: Date;
  totalAmount: number;
  deliveryFee: number;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  pickupLocation: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  driverId?: string;
  driver?: {
    id: string;
    name: string;
    phone: string;
    vehicle: {
      type: string;
      licensePlate: string;
    };
    rating: number;
    totalDeliveries: number;
    currentLocation?: {
      lat: number;
      lng: number;
      timestamp: Date;
    };
  };
  products: Array<{
    name: string;
    sku: string;
    quantity: number;
    price: number;
  }>;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  activities: Array<{
    id: string;
    status: string;
    description: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    createdAt: Date;
  }>;
}

export default function TrackPage() {
  const [searchId, setSearchId] = useState('');
  const [foundShipment, setFoundShipment] = useState<TrackingShipment | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingMapData, setTrackingMapData] = useState<ShipmentMapData | null>(null);
  const id =  useSearchParams().get('id') || null;
  // Fetch shipment details from API
  const handleSearch = async (id?:string) => {
    setHasSearched(true);
    setIsLoading(true);
    setError(null);
    setFoundShipment(null);
    setTrackingMapData(null);

    try {
      if (!searchId.trim() && !id?.trim()) {
        setError('Please enter a shipment ID');
        return;
      }

      // Fetch from API only - no mock data fallback
      const response = await fetch(`/api/shipments/track/${searchId.trim()||id?.trim()}`);
      
      if (response.ok) {
        const data = await response.json();
        const shipment = data.shipment || data;
        setFoundShipment(shipment);
        
        // Transform to ShipmentMapData for TrackingMap component
        const mapData: ShipmentMapData = {
          shipmentId: shipment.id,
          shipmentNumber: shipment.shipmentNumber || shipment.id,
          pickupLocation: {
            name: shipment.pickupLocation?.name || 'Pickup Location',
            address: shipment.pickupLocation?.address || 'Pickup Address',
            lat: shipment.pickupLocation?.coordinates?.lat,
            lng: shipment.pickupLocation?.coordinates?.lng,
            type: 'pickup',
          },
          deliveryLocation: {
            name: shipment.customer?.name,
            address: `${shipment.customer?.address}, ${shipment.customer?.city}, ${shipment.customer?.state} ${shipment.customer?.zipCode}`,
            lat: shipment.customer?.coordinates?.lat,
            lng: shipment.customer?.coordinates?.lng,
            type: 'delivery',
          },
          currentLocation: shipment.driver?.currentLocation ? {
            name: 'Current Location',
            address: 'Driver is en route',
            lat: shipment.driver.currentLocation.lat,
            lng: shipment.driver.currentLocation.lng,
          } : undefined,
          driverLocation: shipment.driver?.currentLocation ? {
            name: 'Driver',
            address: 'Driver Location',
            lat: shipment.driver.currentLocation.lat,
            lng: shipment.driver.currentLocation.lng,
          } : undefined,
          status: shipment.status,
          estimatedDelivery: shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery) : undefined,
        };
        
        setTrackingMapData(mapData);
      } else if (response.status === 404) {
        setError('Shipment not found. Please check your shipment ID and try again.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Unable to fetch shipment. Please try again later.');
      }
    } catch (err) {
      console.error('Error fetching shipment:', err);
      setError('An error occurred while fetching your shipment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getDriver = (driverId: string | null | undefined) => {
    if (!driverId) return null;
    
    if (foundShipment?.driver) {
      return foundShipment.driver;
    }
    
    return null;
  };

  const getStatusIcon = (status: string) => {
    const statusMap: Record<string, any> = {
      PENDING: Clock,
      ASSIGNED: Truck,
      PICKUP: MapPin,
      PICKED_UP: CheckCircle2,
      IN_TRANSIT: Navigation,
      DELIVERED: CheckCircle2,
      FAILED: AlertCircle,
      CANCELLED: AlertCircle,
      RETURNED: ArrowBigDownDash,
    };
    return statusMap[status.toUpperCase()] || Clock;
  };

  const getStatusLabel = (status: string) => {
    const labelMap: Record<string, string> = {
      PENDING: 'Order Placed',
      ASSIGNED: 'Driver Assigned',
      PICKUP: 'Ready for Pickup',
      PICKED_UP: 'Picked Up',
      IN_TRANSIT: 'In Transit',
      DELIVERED: 'Delivered',
      FAILED: 'Delivery Failed',
      CANCELLED: 'Cancelled',
      RETURNED: 'Returned',
    };
    return labelMap[status.toUpperCase()] || status;
  };
 

  useEffect(()=>{
    if(id){
      setSearchId(id)
      handleSearch(id)
    }
  },[])

  const driver = foundShipment ? getDriver(foundShipment.driverId) : null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-3">Track Your Order</h1>
          <p className="text-lg text-muted-foreground">
            Enter your shipment ID to track the real-time status of your delivery
          </p>
        </div>

        {/* Search Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Enter Shipment ID (e.g., shipment-1)"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full rounded-full border border-border bg-white pl-12 pr-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <Button
                onClick={handleSearch}
                className="rounded-full"
              >
                Track
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {hasSearched && (
          <>
            {isLoading && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Loader className="mb-4 h-8 w-8 text-accent animate-spin" />
                  <p className="text-lg font-semibold text-foreground">Fetching shipment details...</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Please wait while we retrieve your tracking information
                  </p>
                </CardContent>
              </Card>
            )}

            {error && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
                  <p className="text-lg font-semibold text-foreground">Error</p>
                  <p className="mt-2 text-sm text-muted-foreground">{error}</p>
                  <Button
                    onClick={() => {
                      setSearchId('');
                      setError(null);
                      setHasSearched(false);
                    }}
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}

            {!isLoading && !error && !foundShipment && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MapPinOff className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-lg font-semibold text-foreground">Shipment not found</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Please check your shipment ID and try again
                  </p>
                </CardContent>
              </Card>
            )}

            {foundShipment && trackingMapData && (
              <div className="space-y-6">
                {/* Interactive Tracking Map */}
                {/* <TrackingMap 
                  shipment={trackingMapData}
                  showDetails
                /> */}

                {/* Status Overview */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Current Status</p>
                        <StatusBadge status={foundShipment.status} />
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-2">Shipment ID</p>
                        <p className="text-lg font-bold text-accent">{foundShipment.shipmentNumber || foundShipment.id}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="p-4 rounded-2xl bg-secondary/30">
                        <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Order Date</p>
                        <p className="text-sm font-semibold text-foreground">
                          {new Date(foundShipment.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-secondary/30">
                        <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Total Value</p>
                        <p className="text-2xl font-bold text-accent">
                          RS {foundShipment.totalAmount.toFixed(2)} <span className="text-sm text-black"> {foundShipment.paymentMethod}</span>
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-secondary/30">
                        <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Est. Delivery</p>
                        <p className="text-sm font-semibold text-foreground">
                          {trackingMapData.estimatedDelivery
                            ? new Date(trackingMapData.estimatedDelivery).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'TBD'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Route Map Section */}
                <Card>
                  <CardHeader title="Route Information" />
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Pickup Location */}
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                        <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-1" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-blue-600 uppercase">Pickup</p>
                          <p className="font-semibold text-foreground truncate">
                            {trackingMapData.pickupLocation.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {trackingMapData.pickupLocation.address}
                          </p>
                        </div>
                      </div>

                      {/* Delivery Location */}
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                        <MapPin className="w-5 h-5 text-red-600 shrink-0 mt-1" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-red-600 uppercase">Delivery To</p>
                          <p className="font-semibold text-foreground truncate">
                            {foundShipment.customer.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {trackingMapData.deliveryLocation.address}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Get Directions Button */}
                    {/* <MapDirections
                      origin={trackingMapData.pickupLocation}
                      destination={trackingMapData.deliveryLocation}
                      variant="card"
                    /> */}
                  </CardContent>
                </Card>

                {/* Timeline and Customer Info Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Timeline */}
                <Card>
                  <CardHeader title="Delivery Status Timeline" />
                  <CardContent>
                    <div className="space-y-6">
                      {foundShipment.activities && foundShipment.activities.length > 0 ? (
                        foundShipment.activities.map((activity, index) => {
                          const Icon = getStatusIcon(activity.status);
                          const isCurrent = activity.status === foundShipment.status && !["DELIVERED","CANCELLED","RETURNED","FAILED"].includes(activity?.status?.toUpperCase())
                          
                          return (
                            <div key={activity.id} className="relative">
                              <div className="flex gap-4">
                                {/* Timeline circle and line */}
                                <div className="flex flex-col items-center">
                                  <div
                                    className={`h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all ${
                                      isCurrent
                                        ? 'bg-blue-100 border-blue-300 animate-pulse'
                                        : 'bg-accent border-accent'
                                    }`}
                                  >
                                    <Icon
                                      className={`h-6 w-6 ${
                                        isCurrent
                                          ? 'text-blue-600'
                                          : 'text-accent-foreground'
                                      }`}
                                    />
                                  </div>
                                  {index < foundShipment.activities.length - 1 && (
                                    <div className="w-1 h-12 mt-2 bg-accent" />
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 py-2">
                                  <h4 className="font-semibold text-foreground">
                                    {getStatusLabel(activity.status)}
                                  </h4>
                                  {activity.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {activity.description}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {new Date(activity.createdAt).toLocaleString()}
                                  </p>
                                  {isCurrent && (
                                    <p className="text-sm text-blue-600 font-medium mt-2">
                                      ● Currently in progress
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-muted-foreground text-center py-6">
                          No activity updates yet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Information */}
                <div>
                <Card>
                  <CardHeader title="Recipient Details" />
                  <CardContent className="space-y-4">
                    <div className="flex gap-3">
                      <User className="h-5 w-5 text-accent shrink-0 mt-1" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">Full Name</p>
                        <p className="text-lg font-semibold text-foreground">
                          {foundShipment.customer.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Phone className="h-5 w-5 text-accent shrink-0 mt-1" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">Phone</p>
                        <p className="text-lg font-semibold text-foreground">
                          {foundShipment.customer.phone}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Email</p>
                      <p className="text-foreground break-all">{foundShipment.customer.email}</p>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Delivery Address</p>
                      <div className="flex gap-2">
                        <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                        <div className="text-sm text-foreground">
                          <p className="font-semibold">{foundShipment.customer.address}</p>
                          <p>{foundShipment.customer.city}, {foundShipment.customer.state} {foundShipment.customer.zipCode}</p>
                          <MapLink 
                            location={{
                              name: 'View Address',
                              address: `${foundShipment.customer.address}, ${foundShipment.customer.city}, ${foundShipment.customer.state}`,
                              lat: foundShipment.customer.coordinates?.lat,
                              lng: foundShipment.customer.coordinates?.lng,
                            }}
                            label="View on Map"
                            className="text-blue-600 hover:text-blue-700 text-xs mt-2 inline-flex items-center gap-1"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <br />
                  {/* Order Summary */}
                <Card>
                  <CardHeader title="Order Summary" />
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium text-foreground">
                        Rs. {foundShipment.totalAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span className="font-medium text-accent">
                        Rs. {foundShipment.deliveryFee.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-3 items-center">
                      <span className="font-semibold text-foreground">Total Amount</span>
                      <span className="text-2xl font-bold text-accent">
                        Rs. {(foundShipment.totalAmount + foundShipment.deliveryFee).toFixed(2)}
                      </span>
                    </div>

                    {foundShipment.actualDelivery && (
                      <div className="pt-3 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Delivered</p>
                        <p className="text-sm text-green-600 font-semibold">
                          ✓ {new Date(foundShipment.actualDelivery).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                            </div>
              </div>
                {/* Products */}
                <Card>
                  <CardHeader title={`Shipment Items (${foundShipment.products.length})`} />
                  <CardContent className="space-y-3">
                    {foundShipment.products && foundShipment.products.length > 0 ? (
                      foundShipment.products.map((product: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-2xl border border-border p-4 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex gap-3 items-center flex-1">
                            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                              <Package className="h-5 w-5 text-accent" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-foreground">{product.name}</p>
                              <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">×{product.quantity}</p>
                            <p className="text-sm text-accent">${(product.price * product.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No items information available</p>
                    )}
                  </CardContent>
                </Card>

                {/* Driver Information Section */}
                {(foundShipment.driver || getDriver(foundShipment.driverId)) && (
                  <Card>
                    <CardHeader title="Assigned Driver" />
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex gap-4 items-start">
                          <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                            <Truck className="h-8 w-8 text-accent" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground text-lg">
                              {(foundShipment.driver as any)?.name || (getDriver(foundShipment.driverId) as any)?.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {(foundShipment.driver as any)?.vehicle?.type || (getDriver(foundShipment.driverId) as any)?.vehicle?.type} • {(foundShipment.driver as any)?.vehicle?.licensePlate || (getDriver(foundShipment.driverId) as any)?.vehicle?.licensePlate}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">Rating</p>
                            <p className="text-sm font-semibold text-foreground">⭐ {(foundShipment.driver as any)?.rating || (getDriver(foundShipment.driverId) as any)?.rating}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">Phone</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.location.href = `tel:${(foundShipment.driver as any)?.phone || (getDriver(foundShipment.driverId) as any)?.phone}`}
                              className="text-xs mt-1 h-8"
                            >
                              <Phone className="w-3 h-3 mr-1" />
                              Call
                            </Button>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">Deliveries</p>
                            <p className="text-sm font-semibold text-foreground">
                              {(foundShipment.driver as any)?.totalDeliveries || (getDriver(foundShipment.driverId) as any)?.totalDeliveries}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

              
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
