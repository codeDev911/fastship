/**
 * Distance Calculation Utilities
 * 
 * Provides functions to calculate distance between locations.
 * Currently uses Haversine formula with coordinates.
 * Can be extended with Google Maps API integration.
 */

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationName {
  city: string;
  state: string;
}

/**
 * Haversine formula: Calculate distance between two coordinates in kilometers
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
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
 * City to coordinates mapping (basic - should be moved to database)
 * Format: { "City,State": { latitude, longitude } }
 */
const CITY_COORDINATES: Record<string, Coordinates> = {
  "Karachi,Sindh": { latitude: 24.8607, longitude: 67.0011 },
  "Lahore,Punjab": { latitude: 31.5204, longitude: 74.3587 },
  "Islamabad,Islamabad": { latitude: 33.6844, longitude: 73.0479 },
  "Peshawar,KPK": { latitude: 34.0156, longitude: 71.5584 },
  "Quetta,Balochistan": { latitude: 30.1798, longitude: 66.975 },
  "Faisalabad,Punjab": { latitude: 30.5728, longitude: 72.807 },
  "Multan,Punjab": { latitude: 30.1575, longitude: 71.4454 },
  "Hyderabad,Sindh": { latitude: 25.3782, longitude: 68.3385 },
  "Rawalpindi,Punjab": { latitude: 33.5731, longitude: 73.1898 },
  "Sialkot,Punjab": { latitude: 32.4973, longitude: 74.5301 },
  "Gujranwala,Punjab": { latitude: 32.1814, longitude: 74.1957 },
  "Sargodha,Punjab": { latitude: 32.0789, longitude: 72.6709 },
  "Bahawalpur,Punjab": { latitude: 29.1883, longitude: 71.6934 },
  "Sukkur,Sindh": { latitude: 27.7046, longitude: 68.8707 },
  "Nawabshah,Sindh": { latitude: 26.2207, longitude: 68.4089 },
};

/**
 * Get distance between two cities by name
 * @param pickupCity Pickup city name
 * @param pickupState Pickup state name
 * @param deliveryCity Delivery city name
 * @param deliveryState Delivery state name
 * @returns Distance in kilometers, or null if cities not found
 */
export function calculateDistanceByCities(
  pickupCity: string,
  pickupState: string,
  deliveryCity: string,
  deliveryState: string
): number | null {
  const pickupKey = `${pickupCity},${pickupState}`;
  const deliveryKey = `${deliveryCity},${deliveryState}`;

  const pickupCoords = CITY_COORDINATES[pickupKey];
  const deliveryCoords = CITY_COORDINATES[deliveryKey];

  if (!pickupCoords || !deliveryCoords) {
    return null;
  }

  return calculateHaversineDistance(
    pickupCoords.latitude,
    pickupCoords.longitude,
    deliveryCoords.latitude,
    deliveryCoords.longitude
  );
}

/**
 * Calculate hourly rate for business delivery
 * Used to estimate when business can pickup
 */
export function estimatePickupTime(distance: number): number {
  // Assume business pickup takes 30 min base + 15 min per 10 km
  const hoursToPickup = 0.5 + (distance / 10) * 0.25;
  return Math.ceil(hoursToPickup);
}

/**
 * TODO: Implement Google Maps API integration
 * This will provide more accurate real-world routing distances
 */
export async function calculateDistanceGoogleMaps(
  pickupCity: string,
  deliveryCity: string
): Promise<number | null> {
  // Implementation placeholder
  console.warn(
    "Google Maps API not implemented. Using Haversine fallback."
  );
  return null;
}
