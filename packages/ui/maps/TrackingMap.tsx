'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../shared/Card';
import { Badge } from '../shared/Badge';
import { MapPin, Navigation, TrendingUp, Clock, Truck } from 'lucide-react';
import { generateDirectionsUrl } from '../../lib/utils/maps';
import type { ShipmentMapData, DriverLocationUpdate } from '../../lib/types/maps';

interface TrackingMapProps {
  shipment?: ShipmentMapData;
  driver?: DriverLocationUpdate;
  showDetails?: boolean;
  className?: string;
  compact?: boolean;
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    assigned: 'bg-blue-100 text-blue-800',
    'in-transit': 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getStatusIcon = (status: string) => {
  const icons: Record<string, React.ReactNode> = {
    pending: <Clock className="w-4 h-4" />,
    assigned: <Truck className="w-4 h-4" />,
    'in-transit': <Navigation className="w-4 h-4" />,
    delivered: <MapPin className="w-4 h-4" />,
  };
  return icons[status];
};

/**
 * TrackingMap Component
 * Displays shipment and driver tracking information with map preview
 * 
 * @example
 * // Basic shipment tracking
 * <TrackingMap
 *   shipment={{
 *     shipmentId: 'ship-123',
 *     shipmentNumber: 'SHP-001',
 *     pickupLocation: { address: 'Pickup', lat: 40.7128, lng: -74.0060 },
 *     deliveryLocation: { address: 'Delivery', lat: 40.7580, lng: -73.9855 },
 *     status: 'in-transit'
 *   }}
 *   showDetails
 * />
 *
 * // Compact view with driver location
 * <TrackingMap
 *   shipment={shipment}
 *   driver={driverLocation}
 *   compact
 * />
 */
export function TrackingMap({
  shipment,
  driver,
  showDetails = true,
  className = '',
  compact = false,
}: TrackingMapProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  if (!shipment) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8 text-gray-500">
          <MapPin className="w-6 h-6 mr-2" />
          No tracking data available
        </CardContent>
      </Card>
    );
  }

  const directionsUrl = generateDirectionsUrl({
    origin: shipment.pickupLocation,
    destination: shipment.deliveryLocation,
  });

  const formatDistance = (distance: number): string => {
    return distance > 1000 ? `${(distance / 1000).toFixed(1)} km` : `${distance.toFixed(0)} m`;
  };

  if (compact) {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-white overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${className}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-gray-600" />
              <span className="font-semibold text-sm">{shipment.shipmentNumber}</span>
            </div>
            <Badge className={getStatusColor(shipment.status)}>
              <span className="inline-flex items-center gap-1">
                {getStatusIcon(shipment.status)}
                {shipment.status.charAt(0).toUpperCase() + shipment.status.slice(1)}
              </span>
            </Badge>
          </div>

          {isExpanded && (
            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{shipment.pickupLocation.address}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Navigation className="w-3 h-3" />
                <span className="truncate">{shipment.deliveryLocation.address}</span>
              </div>
              {shipment.currentLocation && (
                <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                  <TrendingUp className="w-3 h-3" />
                  Current Location Available
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader
        title={shipment.shipmentNumber}
        action={
          <Badge className={getStatusColor(shipment.status)}>
            <span className="inline-flex items-center gap-1">
              {getStatusIcon(shipment.status)}
              {shipment.status.charAt(0).toUpperCase() + shipment.status.slice(1)}
            </span>
          </Badge>
        }
      />

      <CardContent className="space-y-4">
        {/* Tracking Points */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase">Pickup</p>
              <p className="text-sm font-medium text-gray-700">
                {shipment.pickupLocation.name || shipment.pickupLocation.address}
              </p>
              {shipment.pickupLocation.lat && shipment.pickupLocation.lng && (
                <p className="text-xs text-gray-500">
                  {shipment.pickupLocation.lat.toFixed(4)}, {shipment.pickupLocation.lng.toFixed(4)}
                </p>
              )}
            </div>
          </div>

          {/* Transit line */}
          <div className="ml-4 border-l-2 border-gray-200 pl-4 py-2">
            <div className="flex items-center gap-2">
              {driver && (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-green-600 font-medium">Driver in transit</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 flex-shrink-0">
              <MapPin className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase">Delivery</p>
              <p className="text-sm font-medium text-gray-700">
                {shipment.deliveryLocation.name || shipment.deliveryLocation.address}
              </p>
              {shipment.deliveryLocation.lat && shipment.deliveryLocation.lng && (
                <p className="text-xs text-gray-500">
                  {shipment.deliveryLocation.lat.toFixed(4)}, {shipment.deliveryLocation.lng.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Current Location */}
        {shipment.currentLocation && (
          <div className="rounded-lg bg-blue-50 p-3 border border-blue-100">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-blue-900">Current Location</p>
                <p className="text-sm text-blue-700">
                  {shipment.currentLocation.name || 'En route to delivery'}
                </p>
                {shipment.currentLocation.lat && shipment.currentLocation.lng && (
                  <p className="text-xs text-blue-600">
                    {shipment.currentLocation.lat.toFixed(4)}, {shipment.currentLocation.lng.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Details */}
        {showDetails && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
            {shipment.estimatedDelivery && (
              <div>
                <p className="text-xs text-gray-500">Est. Delivery</p>
                <p className="text-sm font-semibold text-gray-700">
                  {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                </p>
              </div>
            )}
            {driver && (
              <div>
                <p className="text-xs text-gray-500">Driver</p>
                <p className="text-sm font-semibold text-gray-700">{driver.driverId}</p>
              </div>
            )}
          </div>
        )}

        {/* Action */}
        <button
          onClick={() => window.open(directionsUrl, '_blank')}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white py-2 hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Navigation className="w-4 h-4" />
          View Directions
        </button>
      </CardContent>
    </Card>
  );
}

export default TrackingMap;
