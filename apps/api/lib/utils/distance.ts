/**
 * Distance Calculation Utilities
 * 
 * Provides functions to calculate real-time distance using OpenRouteService.
 * Falls back to Haversine formula if API is unavailable.
 * Uses cities.json for city coordinate lookups.
 * 
 * IMPORTANT: Requires OPENROUTE_API_KEY environment variable
 */


import * as fs from 'fs';
import * as path from 'path';
import {
  getFromPersistentCache,
  saveToPersistentCache,
  cleanupExpiredCache,
} from './persistent-distance-cache';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationName {
  city: string;
  state: string;
}

interface CitiesData {
  results: Array<{
    name: string;
    location: {
      latitude: number;
      longitude: number;
    };
    adminCode?: string;
    population?: number;
  }>;
}

interface DistanceResult {
  distance: number; // in kilometers
  duration: number; // in seconds
  isEstimate: boolean; // true if using fallback method
  method: 'openroute' | 'haversine';
}

// OpenRouteService API configuration
const OPENROUTE_API_KEY = process.env.OPENROUTE_API_KEY || '';
const OPENROUTE_BASE_URL = 'https://api.openrouteservice.org/v2/matrix/driving-car';

// Map state names to adminCodes
const STATE_TO_ADMIN_CODE: Record<string, string[]> = {
  Sindh: ['05'],
  Punjab: ['04'],
  'Khyber Pakhtunkhwa': ['03'],
  Balochistan: ['02'],
  'Azad Kashmir': ['06'],
  'Gilgit-Baltistan': ['07'],
  Islamabad: ['08'],
  'KPK': ['03'], // Alias for Khyber Pakhtunkhwa
};

// In-memory cache for cities data
let cachedCitiesData: CitiesData | null = null;

// Distance cache to avoid redundant API calls (24-hour expiry)
const distanceCache = new Map<
  string,
  { result: DistanceResult; timestamp: number }
>();

const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Load cities data from cities.json with caching
 */
function getCitiesData(): CitiesData {
  if (cachedCitiesData) {
    return cachedCitiesData;
  }
  
  try {
    const citiesFilePath = path.join(process.cwd(), 'lib', 'cities.json');
    const citiesContent = fs.readFileSync(citiesFilePath, 'utf-8');
    cachedCitiesData = JSON.parse(citiesContent);
    return cachedCitiesData as CitiesData;
  } catch (error) {
    console.error('Error loading cities.json:', error);
    throw new Error('Unable to load location data from cities.json');
  }
}

/**
 * Get coordinates for a city within a state
 * @param city City name
 * @param state State/province name
 * @returns Coordinates or null if not found
 */
function getCityCoordinates(city: string, state: string): Coordinates | null {
  try {
    const adminCodes = STATE_TO_ADMIN_CODE[state];
    if (!adminCodes) {
      console.warn(`Unknown state: ${state}`);
      return null;
    }

    const citiesData = getCitiesData();
    
    // Find the city in the loaded data
    const cityData = citiesData.results.find(
      (item) =>
        item.name.toLowerCase() === city.toLowerCase() &&
        adminCodes.includes(item.adminCode || '')
    );

    if (cityData) {
      return {
        latitude: cityData.location.latitude,
        longitude: cityData.location.longitude,
      };
    }

    console.warn(`City not found: ${city}, ${state}`);
    return null;
  } catch (error) {
    console.error('Error getting city coordinates:', error);
    return null;
  }
}

/**
 * Get distance from OpenRouteService API
 * Returns real-time, actual road distance and duration
 * 
 * @param lat1 Pickup latitude
 * @param lon1 Pickup longitude
 * @param lat2 Delivery latitude
 * @param lon2 Delivery longitude
 * @returns DistanceResult with distance in km and duration in seconds, or null if API fails
 */
async function getOpenRouteServiceDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Promise<DistanceResult | null> {
  try {
    if (!OPENROUTE_API_KEY) {
      console.warn(
        'OPENROUTE_API_KEY not configured. Falling back to Haversine calculation.'
      );
      return null;
    }

    const response = await fetch(OPENROUTE_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': OPENROUTE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locations: [
          [lon1, lat1], // [longitude, latitude] for OpenRouteService
          [lon2, lat2],
        ],
        metrics: ['distance', 'duration'],
        units: 'km',
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(
        `OpenRouteService API error (${response.status}): ${error}`
      );
      return null;
    }

    const data = await response.json();

    // Extract distance (in meters) and duration (in seconds) from matrix response
    // Matrix response returns array of distances between all location pairs
    const distanceKm = data.distances[0][1]  ; // Convert meters to km
    const durationSeconds = data.durations[0][1]; // Already in seconds
 
    return {
      distance: distanceKm,
      duration: durationSeconds,
      isEstimate: false,
      method: 'openroute',
    };
  } catch (error) {
    console.error('Error fetching from OpenRouteService:', error);
    return null;
  }
}

/**
 * Get cached distance result or fetch new one
 */
function getCachedOrFetchDistance(
  cacheKey: string,
  fetchFn: () => Promise<DistanceResult>
): Promise<DistanceResult> {
  const cached = distanceCache.get(cacheKey);

  // Return cached result if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY_MS) {
    return Promise.resolve(cached.result);
  }

  // Fetch new result and cache it
  return fetchFn().then((result) => {
    distanceCache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  });
}

/**
 * Haversine formula: Calculate straight-line distance between two coordinates in kilometers
 * DEPRECATED: Only used as fallback when OpenRouteService is unavailable
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


/**
 * Get distance between two cities by name
 * Uses OpenRouteService for accurate real-time distances
 * Falls back to Haversine if API unavailable
 * 
 * @param pickupCity Pickup city name
 * @param pickupState Pickup state name
 * @param deliveryCity Delivery city name
 * @param deliveryState Delivery state name
 * @returns DistanceResult with accurate distance and duration, or null if cities not found
 */
export async function calculateDistanceByCities(
  pickupCity: string,
  pickupState: string,
  deliveryCity: string,
  deliveryState: string
): Promise<DistanceResult | null> {
  // 1. Check persistent cache first (30-day expiry)
  const persistentCacheEntry = getFromPersistentCache(
    pickupCity,
    pickupState,
    deliveryCity,
    deliveryState
  );

  if (persistentCacheEntry) {
    
    return {
      distance: persistentCacheEntry.distance,
      duration: persistentCacheEntry.duration,
      isEstimate: persistentCacheEntry.method === 'haversine',
      method: persistentCacheEntry.method,
    };
  }

  // Get coordinates from cities.json
  const pickupCoords = getCityCoordinates(pickupCity, pickupState);
  const deliveryCoords = getCityCoordinates(deliveryCity, deliveryState);

  if (!pickupCoords || !deliveryCoords) {
    console.warn(
      `Unable to find coordinates for ${pickupCity}, ${pickupState} or ${deliveryCity}, ${deliveryState}`
    );
    return null;
  }
 
  // Create cache key
  const cacheKey = `${pickupCity}_${pickupState}__${deliveryCity}_${deliveryState}`;
  
  try {
    // 2. Check in-memory cache and/or fetch from API
    const result = await getCachedOrFetchDistance(cacheKey, async () => {
      const openrouteResult = await getOpenRouteServiceDistance(
        pickupCoords.latitude,
        pickupCoords.longitude,
        deliveryCoords.latitude,
        deliveryCoords.longitude
      );

      // If OpenRouteService returns data, use it and save to persistent cache
      if (openrouteResult) {
        saveToPersistentCache(
          pickupCity,
          pickupState,
          deliveryCity,
          deliveryState,
          openrouteResult.distance,
          openrouteResult.duration,
          openrouteResult.method
        );
        
        return openrouteResult;
      }

      // Fall back to Haversine if API unavailable
      console.warn(
        `OpenRouteService unavailable or API key not configured. Using Haversine formula as fallback.`
      );
      const haversineDistance = calculateHaversineDistance(
        pickupCoords.latitude,
        pickupCoords.longitude,
        deliveryCoords.latitude,
        deliveryCoords.longitude
      );

      const haversineResult = {
        distance: haversineDistance,
        duration: 0,
        isEstimate: true,
        method: 'haversine' as const,
      };

      // Save Haversine result to persistent cache as well
      saveToPersistentCache(
        pickupCity,
        pickupState,
        deliveryCity,
        deliveryState,
        haversineResult.distance,
        haversineResult.duration,
        haversineResult.method
      );

      return haversineResult;
    });

    return result;
  } catch (error) {
    console.error('Error calculating distance:', error);
    // Last resort: use Haversine
    const haversineDistance = calculateHaversineDistance(
      pickupCoords.latitude,
      pickupCoords.longitude,
      deliveryCoords.latitude,
      deliveryCoords.longitude
    );

    return {
      distance: haversineDistance,
      duration: 0,
      isEstimate: true,
      method: 'haversine',
    };
  }
}

/**
 * Calculate distance between two coordinates directly
 * Uses OpenRouteService for real-time distance
 * 
 * @param lat1 Pickup latitude
 * @param lon1 Pickup longitude
 * @param lat2 Delivery latitude
 * @param lon2 Delivery longitude
 * @returns DistanceResult with accurate distance and duration
 */
export async function calculateDistanceByCoordinates(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Promise<DistanceResult> {
  try {
    // Try OpenRouteService first
    const openrouteResult = await getOpenRouteServiceDistance(lat1, lon1, lat2, lon2);

    if (openrouteResult) {
      return openrouteResult;
    }

    // Fallback to Haversine
    const distance = calculateHaversineDistance(lat1, lon1, lat2, lon2);
    return {
      distance,
      duration: 0,
      isEstimate: true,
      method: 'haversine',
    };
  } catch (error) {
    console.error('Error calculating distance by coordinates:', error);
    const distance = calculateHaversineDistance(lat1, lon1, lat2, lon2);
    return {
      distance,
      duration: 0,
      isEstimate: true,
      method: 'haversine',
    };
  }
}

/**
 * Calculate hourly rate for business delivery
 * Used to estimate when business can pickup
 * @param distance Distance in kilometers
 * @returns Estimated time in hours
 */
export function estimatePickupTime(distance: number): number {
  // Assume business pickup takes 30 min base + 15 min per 10 km
  const hoursToPickup = 0.5 + (distance / 10) * 0.25;
  return Math.ceil(hoursToPickup);
}

/**
 * Clear the distance cache (useful for testing or admin functions)
 */
export function clearDistanceCache(): void {
  distanceCache.clear();
  console.log('Distance cache cleared');
}

/**
 * Get cache statistics
 */
export function getDistanceCacheStats(): {
  cacheSize: number;
  expiryMs: number;
  averageAge: number;
} {
  let totalAge = 0;
  let validCount = 0;

  distanceCache.forEach(({ timestamp }) => {
    const age = Date.now() - timestamp;
    if (age < CACHE_EXPIRY_MS) {
      totalAge += age;
      validCount += 1;
    }
  });

  return {
    cacheSize: distanceCache.size,
    expiryMs: CACHE_EXPIRY_MS,
    averageAge: validCount > 0 ? totalAge / validCount : 0,
  };
}

/**
 * Validate OpenRouteService configuration
 * @returns true if API key is configured
 */
export function isOpenRouteServiceConfigured(): boolean {
  return !!OPENROUTE_API_KEY;
}

/**
 * ================== PERSISTENT CACHE UTILITIES ==================
 * Manage disk-based distance cache
 */

/**
 * Cleanup expired entries from persistent cache (runs on app startup)
 */
export function initializePersistentCache(): void {
  cleanupExpiredCache();
  console.log('[distance] Persistent cache initialized and cleaned');
}

/**
 * Export persistent cache stats
 */
export { getPersistentCacheStats } from './persistent-distance-cache';

/**
 * Clear persistent cache (admin function)
 */
export { clearPersistentCache } from './persistent-distance-cache';
