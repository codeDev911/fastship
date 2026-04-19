/**
 * API Endpoint: GET /api/locations/distance
 * Calculate distance between two locations using coordinates
 * Uses Haversine formula for great-circle distance
 * 
 * Query params:
 * - lat1, lng1: Starting point coordinates (required)
 * - lat2, lng2: Ending point coordinates (required)
 * OR
 * - from: City name (requires reverse geocoding)
 * - to: City name (requires reverse geocoding)
 * 
 * Returns:
 * - 200: Distance in kilometers and coordinates
 * - 400: Missing required parameters
 * - 500: Error calculating distance
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Haversine formula to calculate distance between two points
 * @param lat1 Starting latitude
 * @param lng1 Starting longitude
 * @param lat2 Ending latitude
 * @param lng2 Ending longitude
 * @returns Distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in KM

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;  // Round to 1 decimal place
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Geocode a city name to get coordinates using Nominatim
 */
async function geocodeCity(
  cityName: string,
  country: string = 'PK'
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)},${country}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FastShip-RateCalculator/1.0',
      },
    });

    if (!response.ok) {
      return null;
    }

    const results = await response.json();

    if (results.length > 0) {
      return {
        latitude: parseFloat(results[0].lat),
        longitude: parseFloat(results[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let lat1 = searchParams.get('lat1');
    let lng1 = searchParams.get('lng1');
    let lat2 = searchParams.get('lat2');
    let lng2 = searchParams.get('lng2');
    const fromCity = searchParams.get('from');
    const toCity = searchParams.get('to');

    // If coordinates not provided, try to geocode city names
    if (!lat1 || !lng1) {
      if (!fromCity) {
        return NextResponse.json(
          {
            error:
              'Either provide lat1/lng1 coordinates or a "from" city name',
          },
          { status: 400 }
        );
      }

      const fromCoords = await geocodeCity(fromCity);
      if (!fromCoords) {
        return NextResponse.json(
          { error: `Could not find coordinates for "${fromCity}"` },
          { status: 400 }
        );
      }

      lat1 = fromCoords.latitude.toString();
      lng1 = fromCoords.longitude.toString();
    }

    if (!lat2 || !lng2) {
      if (!toCity) {
        return NextResponse.json(
          { error: 'Either provide lat2/lng2 coordinates or a "to" city name' },
          { status: 400 }
        );
      }

      const toCoords = await geocodeCity(toCity);
      if (!toCoords) {
        return NextResponse.json(
          { error: `Could not find coordinates for "${toCity}"` },
          { status: 400 }
        );
      }

      lat2 = toCoords.latitude.toString();
      lng2 = toCoords.longitude.toString();
    }

    // Validate coordinates
    const latitude1 = parseFloat(lat1);
    const longitude1 = parseFloat(lng1);
    const latitude2 = parseFloat(lat2);
    const longitude2 = parseFloat(lng2);

    if (isNaN(latitude1) || isNaN(longitude1) || isNaN(latitude2) || isNaN(longitude2)) {
      return NextResponse.json(
        { error: 'Invalid coordinates provided' },
        { status: 400 }
      );
    }

    // Calculate distance
    const distance = calculateDistance(latitude1, longitude1, latitude2, longitude2);

    return NextResponse.json({
      from: {
        latitude: latitude1,
        longitude: longitude1,
        city: fromCity,
      },
      to: {
        latitude: latitude2,
        longitude: longitude2,
        city: toCity,
      },
      distance: distance,
      distanceUnit: 'km',
      calculationMethod: 'haversine',
    });
  } catch (error) {
    console.error('[locations/distance GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate distance' },
      { status: 500 }
    );
  }
}
