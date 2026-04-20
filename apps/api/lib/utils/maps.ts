/**
 * Google Maps URLs API Utilities
 * Generates shareable URLs for various map operations
 * Based on: https://developers.google.com/maps/documentation/urls/get-started
 */

import { GOOGLE_MAPS_CONFIG, type Location, type Coordinates } from '../config/google-maps';
import { MapLocation, MapDirectionsConfig } from '../types/index';

/**
 * Format location for URL encoding
 * Accepts address, coordinates, or place ID
 */
export const formatLocationForUrl = (location: Location | MapLocation | string | Coordinates): string => {
  if (typeof location === 'string') {
    return encodeURIComponent(location);
  }

  if ('lat' in location && 'lng' in location) {
    // Coordinates format: lat,lng
    return `${location.lat},${location.lng}`;
  }

  if ('address' in location) {
    // Location object with address
    return encodeURIComponent(location.address);
  }

  return '';
};

/**
 * Generate Google Maps search URL
 * @example
 * // Search for a place
 * const url = generateSearchUrl('coffee near me');
 * // Search with coordinates
 * const url = generateSearchUrl('restaurants', { lat: 40.7128, lng: -74.0060 });
 */
export const generateSearchUrl = (
  query: string,
  options?: {
    center?: Coordinates;
    zoom?: number;
    mapType?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid';
  }
): string => {
  const params = new URLSearchParams();
  params.append('api', '1');
  params.append('query', query);

  if (options?.center) {
    params.append('center', `${options.center.lat},${options.center.lng}`);
  }

  if (options?.zoom) {
    params.append('zoom', options.zoom.toString());
  }

  return `${GOOGLE_MAPS_CONFIG.BASE_URL}/search/?${params.toString()}`;
};

/**
 * Generate Google Maps directions URL
 * @example
 * // Simple directions
 * const url = generateDirectionsUrl({
 *   origin: { address: '1600 Amphitheatre Parkway, Mountain View, CA' },
 *   destination: { address: 'Central Park, New York' }
 * });
 *
 * // Directions with waypoints
 * const url = generateDirectionsUrl({
 *   origin: { address: 'New York' },
 *   destination: { address: 'Boston' },
 *   waypoints: [{ address: 'Philadelphia' }],
 *   mode: 'driving'
 * });
 */
export const generateDirectionsUrl = (config: MapDirectionsConfig): string => {
  const params = new URLSearchParams();
  params.append('api', '1');
  params.append('origin', formatLocationForUrl(config.origin));
  params.append('destination', formatLocationForUrl(config.destination));

  if (config.waypoints && config.waypoints.length > 0) {
    const waypointStrs = config.waypoints.map(w => 
      w.lat && w.lng ? `${w.lat},${w.lng}` : formatLocationForUrl(w)
    );
    params.append('waypoints', waypointStrs.join('|'));
  }

  if (config.mode) {
    params.append('travelmode', config.mode.toUpperCase());
  }

  if (config.alternatives !== undefined) {
    params.append('alternatives', config.alternatives ? 'true' : 'false');
  }

  return `${GOOGLE_MAPS_CONFIG.BASE_URL}/dir/?${params.toString()}`;
};

/**
 * Generate Google Maps place/view URL
 * @example
 * // View a place by coordinates
 * const url = generatePlaceUrl({ lat: 40.7128, lng: -74.0060 });
 *
 * // View a place by address
 * const url = generatePlaceUrl({ address: 'Statue of Liberty' });
 */
export const generatePlaceUrl = (
  location: Location | MapLocation | Coordinates | string,
  options?: {
    zoom?: number;
    mapType?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid';
  }
): string => {
  const params = new URLSearchParams();
  params.append('api', '1');

  if (typeof location === 'string') {
    params.append('query', location);
  } else if ('lat' in location && 'lng' in location) {
    params.append('query', `${location.lat},${location.lng}`);
  } else if ('address' in location) {
    params.append('query', location.address);
  }

  if (options?.zoom) {
    params.append('zoom', options.zoom.toString());
  }

  return `${GOOGLE_MAPS_CONFIG.BASE_URL}/search/?${params.toString()}`;
};

/**
 * Generate Google Maps embed URL for iframe
 * Useful for embedding maps in your application
 * @example
 * // Embed a search result
 * const url = generateEmbedUrl('coffee', { width: 600, height: 450 });
 *
 * // Embed location with directions
 * const url = generateEmbedUrl('1600 Amphitheatre Parkway Mountain View CA', {
 *   mode: 'place',
 *   width: 800,
 *   height: 600
 * });
 */
export const generateEmbedUrl = (
  query: string,
  options?: {
    mode?: 'place' | 'view' | 'directions';
    center?: Coordinates;
    zoom?: number;
    width?: number;
    height?: number;
    mapType?: string;
  }
): string => {
  const params = new URLSearchParams();
  params.append('q', query);

  if (options?.zoom) {
    params.append('z', options.zoom.toString());
  }

  if (options?.mapType) {
    params.append('t', options.mapType);
  }

  // Note: Embed URLs don't support API key in Maps URLs API
  // For embedding with API key, use Google Maps Embed API instead
  return `${GOOGLE_MAPS_CONFIG.BASE_URL}/embed/v1/place?key=${GOOGLE_MAPS_CONFIG.API_KEY}&${params.toString()}`;
};

/**
 * Generate comma-separated waypoint string for multiple locations
 * Useful for batch direction URLs
 */
export const generateWaypointString = (locations: (MapLocation | Location)[]): string => {
  return locations
    .map(loc => formatLocationForUrl(loc))
    .join('|');
};

/**
 * Create a shareable URL for a route
 * Combines origin, destination, and waypoints into a single sharable URL
 */
export const createShareableRouteUrl = (config: MapDirectionsConfig): string => {
  return generateDirectionsUrl(config);
};

/**
 * Parse coordinates from various string formats
 * @example
 * parseCoordinates('40.7128,-74.0060') // { lat: 40.7128, lng: -74.0060 }
 */
export const parseCoordinates = (coordString: string): Coordinates | null => {
  const match = coordString.match(/^([-\d.]+),\s*([-\d.]+)$/);
  if (!match) return null;

  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);

  if (isNaN(lat) || isNaN(lng)) return null;

  return { lat, lng };
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export const calculateCoordinateDistance = (
  coord1: Coordinates,
  coord2: Coordinates
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (coords: Coordinates, decimals: number = 4): string => {
  return `${coords.lat.toFixed(decimals)}, ${coords.lng.toFixed(decimals)}`;
};

/**
 * Get map type parameter from value
 */
export const getMapTypeId = (
  mapType: 'roadmap' | 'satellite' | 'terrain' | 'hybrid' = 'roadmap'
): string => {
  const mapTypes: Record<string, string> = {
    roadmap: 'roadmap',
    satellite: 'satellite',
    terrain: 'terrain',
    hybrid: 'hybrid',
  };
  return mapTypes[mapType] || 'roadmap';
};
