/**
 * API Endpoint: GET /api/locations/states
 * Fetch all available states/provinces in Pakistan
 * 
 * Returns:
 * - 200: Array of all states
 * - 500: Error reading states data
 */

import { NextResponse } from 'next/server';

const STATES = [
  'Sindh',
  'Punjab',
  'Islamabad',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Azad Kashmir',
  'Gilgit-Baltistan',
];

export async function GET() {
  try {
    return NextResponse.json({
      states: STATES,
      count: STATES.length,
      message: `Found ${STATES.length} states`,
    });
  } catch (error) {
    console.error('[locations/states GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch states', details: (error as any).message },
      { status: 500 }
    );
  }
}
