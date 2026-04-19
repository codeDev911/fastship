'use client';

import React, { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { generateSearchUrl, formatLocationForUrl } from '../../lib/utils/maps';
import type { MapLocation } from '../../lib/types/maps';

interface MapPreviewProps {
  location: MapLocation | string;
  width?: number | string;
  height?: number | string;
  zoom?: number;
  showMarker?: boolean;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

/**
 * MapPreview Component
 * Displays a clickable map preview thumbnail for a location
 * 
 * @example
 * // Basic usage
 * <MapPreview
 *   location={{
 *     address: '1600 Amphitheatre Parkway, Mountain View, CA',
 *     lat: 37.4224764,
 *     lng: -122.0842499
 *   }}
 *   width={400}
 *   height={300}
 * />
 *
 * // Compact preview
 * <MapPreview
 *   location="Central Park, New York"
 *   width={200}
 *   height={200}
 *   zoom={15}
 * />
 *
 * // With click handler
 * <MapPreview
 *   location="San Francisco"
 *   onClick={() => console.log('Map clicked')}
 *   interactive
 * />
 */
export function MapPreview({
  location,
  width = 400,
  height = 300,
  zoom = 15,
  showMarker = true,
  className = '',
  onClick,
  interactive = true,
}: MapPreviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationStr = typeof location === 'string' ? location : location.address;
  const mapUrl = generateSearchUrl(locationStr, { zoom });

  const handleClick = () => {
    setIsLoading(true);
    try {
      if (interactive) {
        window.open(mapUrl, '_blank');
      }
      onClick?.();
    } catch (err) {
      setError('Failed to open map');
    } finally {
      setIsLoading(false);
    }
  };

  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  if (error) {
    return (
      <div
        style={{ width: widthStyle, height: heightStyle }}
        className={`flex items-center justify-center rounded-lg bg-gray-100 ${className}`}
      >
        <div className="text-center">
          <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={!interactive || isLoading}
      style={{ width: widthStyle, height: heightStyle }}
      className={`relative rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden transition-all hover:shadow-lg disabled:cursor-default ${
        interactive ? 'cursor-pointer hover:scale-105' : ''
      } ${className}`}
    >
      {/* Map background with location indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full">
          {/* Decorative grid */}
          <div className="absolute inset-0 opacity-10 bg-gradient-to-b from-blue-400 to-blue-300" />
          
          {/* Center marker */}
          <div className="absolute inset-0 flex items-center justify-center">
            {showMarker && (
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse opacity-20 w-12 h-12" />
                <MapPin className="w-8 h-8 text-red-600 drop-shadow" />
              </div>
            )}
          </div>

          {/* Location text */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <p className="text-xs text-white font-medium truncate">
              {typeof location === 'string' ? location : location.name || location.address}
            </p>
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Click hint */}
      {interactive && !isLoading && (
        <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1">
          <MapPin className="w-4 h-4 text-blue-600" />
        </div>
      )}
    </button>
  );
}

export default MapPreview;
