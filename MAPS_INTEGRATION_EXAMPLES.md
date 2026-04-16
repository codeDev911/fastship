/**
 * Example Integration Files
 * 
 * These files show how to integrate Google Maps components into your existing pages.
 * Copy the patterns and adapt them to your page structure.
 */

/**
 * EXAMPLE 1: Tracking Page Integration
 * Location: app/track/page.tsx
 * 
 * This shows how to convert the existing track page to use the new map components.
 */

export const trackPageExample = `
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { StatusBadge } from '@/components/shared/Badge';
import { TrackingMap, MapDirections } from '@/components/maps';
import { mockShipments, mockDrivers } from '@/lib/mock-data';
import { MapPin, Phone, Search, Truck } from 'lucide-react';

export default function TrackPage() {
  const [searchId, setSearchId] = useState('');
  const [foundShipment, setFoundShipment] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    setHasSearched(true);
    const shipment = mockShipments.find((s) => s.id.toLowerCase() === searchId.toLowerCase());
    setFoundShipment(shipment || null);
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader title="Track Your Shipment" />
        <CardContent>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter tracking number..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <>
          {!foundShipment ? (
            <Card>
              <CardContent className="text-center py-8 text-gray-500">
                <MapPin className="w-8 h-8 mx-auto mb-2" />
                <p>Shipment not found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Map-based tracking visualization */}
              <TrackingMap
                shipment={{
                  shipmentId: foundShipment.id,
                  shipmentNumber: foundShipment.id,
                  pickupLocation: {
                    name: 'Pickup',
                    address: foundShipment.pickupLocation,
                    lat: foundShipment.pickupLat,
                    lng: foundShipment.pickupLng
                  },
                  deliveryLocation: {
                    name: 'Delivery',
                    address: foundShipment.deliveryLocation,
                    lat: foundShipment.deliveryLat,
                    lng: foundShipment.deliveryLng
                  },
                  currentLocation: foundShipment.currentLocation ? {
                    address: foundShipment.currentLocation,
                    lat: foundShipment.currentLat,
                    lng: foundShipment.currentLng
                  } : undefined,
                  status: foundShipment.status,
                  estimatedDelivery: new Date(foundShipment.estimatedDelivery)
                }}
                showDetails
              />

              {/* Directions quick access */}
              <Card>
                <CardHeader title="Route Information" />
                <CardContent>
                  <MapDirections
                    origin={{
                      address: foundShipment.pickupLocation,
                      lat: foundShipment.pickupLat,
                      lng: foundShipment.pickupLng
                    }}
                    destination={{
                      address: foundShipment.deliveryLocation,
                      lat: foundShipment.deliveryLat,
                      lng: foundShipment.deliveryLng
                    }}
                    mode="driving"
                    variant="card"
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
`;

/**
 * EXAMPLE 2: Business Shipments Page
 * Location: app/business/shipments/page.tsx
 * 
 * Shows management of multiple shipments with map integration
 */

export const businessShipmentsExample = `
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { TrackingMap, MapLink, MapDirections } from '@/components/maps';
import { LineChart, Edit, Trash2 } from 'lucide-react';
import type { ShipmentMapData } from '@/lib/types/maps';

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentMapData[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentMapData | null>(null);

  useEffect(() => {
    const fetchShipments = async () => {
      const res = await fetch('/api/shipments');
      const data = await res.json();
      
      // Transform API response to ShipmentMapData
      const transformedData = data.map((s: any) => ({
        shipmentId: s.id,
        shipmentNumber: s.number,
        pickupLocation: {
          name: s.pickup.name,
          address: s.pickup.address,
          lat: s.pickup.lat,
          lng: s.pickup.lng,
          type: 'pickup'
        },
        deliveryLocation: {
          name: s.delivery.name,
          address: s.delivery.address,
          lat: s.delivery.lat,
          lng: s.delivery.lng,
          type: 'delivery'
        },
        currentLocation: s.currentLocation,
        status: s.status,
        estimatedDelivery: new Date(s.estimatedDelivery)
      }));
      
      setShipments(transformedData);
    };

    fetchShipments();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* List of shipments */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader title={`Shipments (${shipments.length})`} />
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {shipments.map(shipment => (
                <button
                  key={shipment.shipmentId}
                  onClick={() => setSelectedShipment(shipment)}
                  className={\`w-full p-2 text-left rounded-lg border hover:bg-blue-50 \${
                    selectedShipment?.shipmentId === shipment.shipmentId
                      ? 'bg-blue-100 border-blue-300'
                      : ''
                  }\`}
                >
                  <div className="font-semibold text-sm">{shipment.shipmentNumber}</div>
                  <div className="text-xs text-gray-600">{shipment.status}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed view with maps */}
      <div className="lg:col-span-2">
        {selectedShipment ? (
          <div className="space-y-4">
            <TrackingMap
              shipment={selectedShipment}
              showDetails
            />

            <Card>
              <CardHeader title="Quick Actions" />
              <CardContent className="space-y-2">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                  Call Driver
                </button>
                <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
                  View Full Details
                </button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-20 text-gray-500">
              <div className="text-center">
                <LineChart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Select a shipment to view details</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
`;

/**
 * EXAMPLE 3: Driver Dashboard
 * Location: app/driver/orders/page.tsx
 * 
 * Real-time tracking for driver with active orders
 */

export const driverDashboardExample = `
'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { TrackingMap, MapDirections } from '@/components/maps';
import { Button } from '@/components/shared/Button';
import { CheckCircle2, Navigation } from 'lucide-react';
import type { ShipmentMapData } from '@/lib/types/maps';

export default function DriverOrdersPage() {
  const [activeOrder, setActiveOrder] = useState<ShipmentMapData | null>(null);
  const [allOrders, setAllOrders] = useState<ShipmentMapData[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get driver's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log('Location error:', error)
      );
    }
  }, []);

  // Fetch assigned orders
  useEffect(() => {
    const fetchOrders = async () => {
      const res = await fetch('/api/driver/orders');
      const data = await res.json();
      // Transform to ShipmentMapData...
      setAllOrders(data);
      if (data.length > 0) setActiveOrder(data[0]);
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleCompleteOrder = async () => {
    if (activeOrder) {
      await fetch(\`/api/driver/orders/\${activeOrder.shipmentId}/complete\`, {
        method: 'POST'
      });
      // Refresh orders...
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main tracking view */}
        <div className="lg:col-span-2">
          {activeOrder ? (
            <div className="space-y-4">
              <TrackingMap
                shipment={activeOrder}
                driver={location ? { 
                  driverId: 'self',
                  lat: location.lat,
                  lng: location.lng,
                  timestamp: new Date()
                } : undefined}
                showDetails
              />

              <Card>
                <CardHeader title="Route to Delivery" />
                <CardContent>
                  <MapDirections
                    origin={location ? {
                      address: 'Current Location',
                      lat: location.lat,
                      lng: location.lng
                    } : activeOrder.pickupLocation}
                    destination={activeOrder.deliveryLocation}
                    variant="card"
                  />
                </CardContent>
              </Card>

              <Button 
                onClick={handleCompleteOrder}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark as Delivered
              </Button>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">No active orders</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Orders list */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader title="My Orders" />
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allOrders.map(order => (
                  <button
                    key={order.shipmentId}
                    onClick={() => setActiveOrder(order)}
                    className={`w-full p-3 text-left rounded-lg border transition-all \${
                      activeOrder?.shipmentId === order.shipmentId
                        ? 'bg-blue-50 border-blue-300'
                        : 'hover:bg-gray-50'
                    }\`}
                  >
                    <div className="font-semibold text-sm">{order.shipmentNumber}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      To: {order.deliveryLocation.address}
                    </div>
                    <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      Get Navigation
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
`;

/**
 * EXAMPLE 4: Seller Bidding with Locations
 * Location: app/seller/bidding/page.tsx
 * 
 * Shows shipments available for bidding with location information
 */

export const sellerBiddingExample = `
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { MapLink, MapPreview, MapDirections } from '@/components/maps';
import { Button } from '@/components/shared/Button';
import { Package, MapPin, DollarSign } from 'lucide-react';

export default function BiddingPage() {
  const [shipments, setShipments] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchShipments = async () => {
      const res = await fetch('/api/shipments/available');
      const data = await res.json();
      setShipments(data);
    };

    fetchShipments();
  }, []);

  const filteredShipments = shipments.filter(s =>
    filter === 'all' || s.status === filter
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {['all', 'pending', 'assigned'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={\`px-4 py-2 rounded-lg font-medium transition-colors \${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }\`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredShipments.map(shipment => (
          <Card key={shipment.id}>
            <CardHeader 
              title={shipment.shipmentNumber}
              action={<span className="text-sm font-semibold text-green-600">\$${shipment.weight * 0.5}</span>}
            />
            <CardContent className="space-y-4">
              {/* Map preview */}
              <MapPreview
                location={shipment.pickupLocation}
                width="100%"
                height={200}
                className="rounded-lg"
              />

              {/* Location details */}
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">From</p>
                  <MapLink
                    location={{
                      address: shipment.pickupLocation,
                    }}
                    showIcon
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">To</p>
                  <MapLink
                    location={{
                      address: shipment.deliveryLocation,
                    }}
                    showIcon
                  />
                </div>
              </div>

              {/* Shipment details */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Weight</p>
                  <p className="font-semibold">{shipment.weight} kg</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Est. Distance</p>
                  <p className="font-semibold">{shipment.distance} km</p>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  View Full Details
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700">
                  Place Bid
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
`;

export default function ExamplesGuide() {
  return (
    <div>
      <h1>Google Maps Integration Examples</h1>
      <p>See the code snippets above for complete integration examples.</p>
    </div>
  );
}
