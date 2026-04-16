'use client';

import React from 'react';
import { Button } from '@/components/shared/Button';
import { MapPin, Navigation, Clock } from 'lucide-react';
import { generateDirectionsUrl } from '@/lib/utils/maps';
import type { MapDirectionsConfig } from '@/lib/types/maps';

interface MapDirectionsProps {
  origin: MapDirectionsConfig['origin'];
  destination: MapDirectionsConfig['destination'];
  waypoints?: MapDirectionsConfig['waypoints'];
  mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
  showLabel?: boolean;
  variant?: 'button' | 'card' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const modeIcons = {
  driving: '🚗',
  walking: '🚶',
  bicycling: '🚴',
  transit: '🚌',
};

/**
 * MapDirections Component
 * Displays directions between locations with option to open in Google Maps
 * 
 * @example
 * // Button variant (default)
 * <MapDirections
 *   origin={{ address: 'New York' }}
 *   destination={{ address: 'Boston' }}
 *   mode="driving"
 * />
 *
 * // Card variant with waypoints
 * <MapDirections
 *   origin={{ name: 'Start', address: '123 Main St' }}
 *   destination={{ name: 'End', address: '456 Oak Ave' }}
 *   waypoints={[{ address: 'Philadelphia' }]}
 *   variant="card"
 * />
 *
 * // Inline variant for compact display
 * <MapDirections
 *   origin={{ address: 'A' }}
 *   destination={{ address: 'B' }}
 *   variant="inline"
 * />
 */
export function MapDirections({
  origin,
  destination,
  waypoints,
  mode = 'driving',
  showLabel = true,
  variant = 'button',
  size = 'md',
  className = '',
}: MapDirectionsProps) {
  const directionsUrl = generateDirectionsUrl({
    origin,
    destination,
    waypoints,
    mode,
  });

  const originName = origin.name || origin.address;
  const destName = destination.name || destination.address;

  if (variant === 'inline') {
    return (
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700 hover:underline ${className}`}
      >
        <Navigation className="w-3 h-3" />
        <span>Get Directions</span>
      </a>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 flex-shrink-0">
              A
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">From</p>
              <p className="font-medium text-sm truncate">{originName}</p>
            </div>
          </div>

          <div className="ml-4 border-l-2 border-gray-200 pl-4 min-h-12 flex items-center -my-2">
            <span className="text-xs text-gray-400">{modeIcons[mode]}</span>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 flex-shrink-0">
              B
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">To</p>
              <p className="font-medium text-sm truncate">{destName}</p>
            </div>
          </div>

          {waypoints && waypoints.length > 0 && (
            <div className="text-xs text-gray-500">
              +{waypoints.length} {waypoints.length === 1 ? 'stop' : 'stops'}
            </div>
          )}

          <Button
            onClick={() => window.open(directionsUrl, '_blank')}
            className="w-full mt-2"
            size="sm"
          >
            <Navigation className="w-4 h-4" />
            Open Directions
          </Button>
        </div>
      </div>
    );
  }

  // Button variant (default)
  return (
    <Button
      onClick={() => window.open(directionsUrl, '_blank')}
      variant="outline"
      size={size}
      className={className}
    >
      <Navigation className="w-4 h-4" />
      {showLabel && <span>Get Directions</span>}
    </Button>
  );
}

export default MapDirections;
