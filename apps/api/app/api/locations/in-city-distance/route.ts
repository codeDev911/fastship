import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/locations/in-city-distance
 * Calculate real road distance between two coordinates using OpenRouteService
 * 
 * Request body:
 * {
 *   pickupLatitude: number,
 *   pickupLongitude: number,
 *   deliveryLatitude: number,
 *   deliveryLongitude: number
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   distance: number (in km),
 *   data: { distance, duration: estimated (in minutes) }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      pickupLatitude,
      pickupLongitude,
      deliveryLatitude,
      deliveryLongitude,
    } = body;

    // Validate required fields
    if (
      pickupLatitude === undefined ||
      pickupLongitude === undefined ||
      deliveryLatitude === undefined ||
      deliveryLongitude === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: pickupLatitude, pickupLongitude, deliveryLatitude, deliveryLongitude',
        },
        { status: 400 }
      );
    }

    // Validate coordinates are valid numbers
    const lat1 = parseFloat(pickupLatitude);
    const lon1 = parseFloat(pickupLongitude);
    const lat2 = parseFloat(deliveryLatitude);
    const lon2 = parseFloat(deliveryLongitude);

    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid coordinates. Latitude and longitude must be valid numbers.',
        },
        { status: 400 }
      );
    }

    // Validate latitude range [-90, 90] and longitude range [-180, 180]
    if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid latitude. Must be between -90 and 90.',
        },
        { status: 400 }
      );
    }

    if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid longitude. Must be between -180 and 180.',
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'OpenRouteService API key is not configured',
        },
        { status: 503 }
      );
    }

    const orsResponse = await fetch(
      'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
      {
        method: 'POST',
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: [
            [lon1, lat1],
            [lon2, lat2],
          ],
          instructions: false,
        }),
      }
    );

    if (!orsResponse.ok) {
      const details = await orsResponse.text();
      return NextResponse.json(
        {
          success: false,
          error: `OpenRouteService failed: ${details}`,
        },
        { status: 502 }
      );
    }

    const orsData = await orsResponse.json();
    const feature = orsData?.features?.[0];
    const summary = feature?.properties?.summary;

    if (!summary || !feature?.geometry?.coordinates) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid route data returned from OpenRouteService',
        },
        { status: 502 }
      );
    }

    const distanceKm = Number(summary.distance) / 1000;
    const durationMinutes = Math.ceil(Number(summary.duration) / 60);
    const routePath: [number, number][] = feature.geometry.coordinates.map(
      (point: [number, number]) => [point[1], point[0]]
    );

    return NextResponse.json({
      success: true,
      data: {
        distance: parseFloat(distanceKm.toFixed(2)),
        duration: durationMinutes,
        unit: 'km',
        routePath,
      },
    });
  } catch (error: any) {
    console.error('[in-city-distance] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to calculate distance',
      },
      { status: 500 }
    );
  }
}
