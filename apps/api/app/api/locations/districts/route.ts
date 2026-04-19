/**
 * API Endpoint: GET /api/locations/districts
 * Fetch districts for a given state/province from local cities.json
 * 
 * Query params:
 * - state: State/province name (required)
 * 
 * Returns:
 * - 200: Array of districts with coordinates
 * - 400: Missing state parameter or state not found
 * - 500: Error reading districts data
 */

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

interface District {
  name: string;
  latitude: number;
  longitude: number;
  type: string;
  population?: number;
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
  'Khyber Pakhtunkhwa': ['01'],
  Balochistan: ['02'],
  'Azad Kashmir': ['06'],
  'Gilgit-Baltistan': ['07'],
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
        districts: [],
        count: 0,
        error: `State "${state}" not found. Available states: ${Object.keys(STATE_TO_ADMIN_CODE).join(', ')}`,
      });
    }

    // Read cities.json (which contains district-level data too)
    const citiesFilePath = path.join(process.cwd(), 'lib', 'cities.json');
    const citiesContent = fs.readFileSync(citiesFilePath, 'utf-8');
    const citiesData: CitiesData = JSON.parse(citiesContent);

    // Filter and group by district/city to get unique districts
    const districtMap = new Map<string, District>();

    citiesData.results
      .filter((city) => adminCodes.includes(city.adminCode || ''))
      .forEach((city) => {
        // Use city name as district identifier (simplified; could be enhanced with district codes)
        if (!districtMap.has(city.name)) {
          districtMap.set(city.name, {
            name: city.name,
            latitude: city.location.latitude,
            longitude: city.location.longitude,
            type: 'district',
            population: city.population,
          });
        }
      });

    const districts: District[] = Array.from(districtMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return NextResponse.json({
      state,
      districts,
      count: districts.length,
      message: districts.length > 0 ? `Found ${districts.length} districts` : 'No districts found for this state',
    });
  } catch (error) {
    console.error('[locations/districts GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch districts', details: (error as any).message },
      { status: 500 }
    );
  }
}
