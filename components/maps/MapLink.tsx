'use client';

import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { generatePlaceUrl } from '@/lib/utils/maps';
import type { MapLocation } from '@/lib/types/maps';

interface MapLinkProps {
  location: MapLocation | string;
  label?: string;
  showIcon?: boolean;
  className?: string;
  target?: '_blank' | '_self';
  onClick?: () => void;
}

/**
 * MapLink Component
 * Renders a clickable link that opens Google Maps for a location
 * 
 * @example
 * // Basic usage with location object
 * <MapLink 
 *   location={{
 *     name: 'Office',
 *     address: '1600 Amphitheatre Parkway, Mountain View, CA'
 *   }}
 *   label="View on Maps"
 * />
 *
 * // With string address
 * <MapLink location="Central Park, New York" />
 *
 * // Custom styling
 * <MapLink 
 *   location="Times Square"
 *   className="text-blue-600 hover:underline"
 *   showIcon
 * />
 */
export function MapLink({
  location,
  label,
  showIcon = true,
  className = 'inline-flex items-center gap-2 text-blue-500 hover:text-blue-700 hover:underline transition-colors',
  target = '_blank',
  onClick,
}: MapLinkProps) {
  const displayLabel = label ||
    (typeof location === 'string' ? location : location.name || location.address);
  
  const mapUrl = generatePlaceUrl(location);

  return (
    <a
      href={mapUrl}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className={className}
      onClick={onClick}
    >
      {showIcon && <MapPin className="w-4 h-4" />}
      <span className="truncate">{displayLabel}</span>
      {target === '_blank' && <ExternalLink className="w-3 h-3" />}
    </a>
  );
}

export default MapLink;
