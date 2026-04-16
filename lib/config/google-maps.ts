/**
 * Google Maps Configuration
 * Handles API key and URL generation for Maps URLs API
 */

export const GOOGLE_MAPS_CONFIG = {
  // Get from environment variables
  API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  
  // Maps URLs API endpoints
  BASE_URL: 'https://www.google.com/maps',
  
  // Default map options
  DEFAULT_ZOOM: 15,
  DEFAULT_MAP_TYPE: 'roadmap', // roadmap, satellite, terrain, hybrid
  
  // Search types
  SEARCH_TYPES: {
    SEARCH: 'search',
    DIRECTIONS: 'dir',
    PLACE: 'place',
  },
} as const;

/**
 * Validate that API key is configured
 */
export const validateGoogleMapsConfig = () => {
  if (!GOOGLE_MAPS_CONFIG.API_KEY) {
    console.warn(
      'Google Maps API Key is not configured. ' +
      'Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.'
    );
    return false;
  }
  return true;
};

/**
 * Type definitions for coordinates
 */
export type Coordinates = {
  lat: number;
  lng: number;
};

/**
 * Type definitions for location
 */
export type Location = {
  name?: string;
  address: string;
  lat?: number;
  lng?: number;
};
