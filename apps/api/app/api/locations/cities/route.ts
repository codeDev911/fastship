/**
 * API Endpoint: GET /api/locations/cities
 * Fetch cities for a given state/province from local cities.json
 * 
 * Query params:
 * - state: State/province name (required)
 * 
 * Returns:
 * - 200: Array of cities with coordinates
 * - 400: Missing state parameter or state not found
 * - 500: Error reading cities data
 */

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

interface City {
  name: string;
  latitude: number;
  longitude: number;
  type: string;
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

// Map state names to adminCodes from cities.json
const STATE_TO_ADMIN_CODE: Record<string, string[]> = {
  Sindh: ['05'],
  Punjab: ['04'],
  'Khyber Pakhtunkhwa': ['03'],
  Balochistan: ['02'],
  'Azad Kashmir': ['06'],
  'Gilgit-Baltistan': ['07'],
  Islamabad: ['08'],
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get('state');

    if (!state) {
      return NextResponse.json(
        { error: 'State parameter is required' },
        { status: 400 }
      );
    }

    // Get admin codes for this state
    const adminCodes = STATE_TO_ADMIN_CODE[state];
    if (!adminCodes) {
      return NextResponse.json({
        state,
        cities: [],
        count: 0,
        error: `State "${state}" not found. Available states: ${Object.keys(STATE_TO_ADMIN_CODE).join(', ')}`,
      });
    }

    // Read cities.json
    const citiesFilePath = path.join(process.cwd(), 'lib', 'cities.json');
    const citiesContent = fs.readFileSync(citiesFilePath, 'utf-8');
    const citiesData: CitiesData = JSON.parse(citiesContent);

    // Filter cities by state (adminCode)
    const cities: City[] = citiesData.results
      .filter((city) => adminCodes.includes(city.adminCode || ''))
      .map((city) => ({
        name: city.name,
        latitude: city.location.latitude,
        longitude: city.location.longitude,
        type: 'city',
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
      
    return NextResponse.json({
      state,
      cities,
      count: cities.length,
      message: cities.length > 0 ? `Found ${cities.length} cities` : 'No cities found for this state',
    });
  } catch (error) {
    console.error('[locations/cities GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities', details: (error as any).message },
      { status: 500 }
    );
  }
}
