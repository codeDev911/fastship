# OpenRouteService Integration Guide

## Overview

FastShip now uses **OpenRouteService** for accurate, real-time distance calculations instead of straight-line Haversine formulas. This ensures proper pricing and delivery time estimates based on actual road routes.

## Why OpenRouteService?

- **Accuracy**: Real road distances, not just coordinate-to-coordinate lines
- **Reliability**: Professional routing engine for Pakistan
- **Real-time**: Current route conditions and traffic
- **Duration Data**: Provides estimated travel time
- **Fallback**: Automatically falls back to Haversine if API is unavailable

## Setup Instructions

### 1. Get OpenRouteService API Key

1. Visit [OpenRouteService](https://openrouteservice.org/)
2. Sign up for a free account
3. Generate an API key from your dashboard
4. Choose appropriate plan (free tier includes 2,500 requests/day)

### 2. Configure Environment Variable

Add your API key to `.env.local`:

```bash
# .env.local
OPENROUTE_API_KEY=your_api_key_here
```

Or in your hosting platform's environment variables:
- **Vercel**: Settings → Environment Variables
- **Railway**: Variables section
- **Docker**: Add to `.env` file

### 3. Verify Configuration

```typescript
import { isOpenRouteServiceConfigured } from '@/lib/utils/distance';

// Check if API is configured
if (isOpenRouteServiceConfigured()) {
  console.log('✅ OpenRouteService is configured');
} else {
  console.log('⚠️ OpenRouteService not configured - using Haversine fallback');
}
```

## API Usage

### Calculate Distance by City Names

```typescript
import { calculateDistanceByCities } from '@/lib/utils/distance';

// This is now async!
const result = await calculateDistanceByCities(
  'Karachi',
  'Sindh',
  'Lahore',
  'Punjab'
);

if (result) {
  console.log(`Distance: ${result.distance} km`);
  console.log(`Duration: ${result.duration} seconds`);
  console.log(`Method: ${result.method}`); // 'openroute' or 'haversine'
  console.log(`Is Estimate: ${result.isEstimate}`); // true if fallback
}
```

### Calculate Distance by Coordinates

```typescript
import { calculateDistanceByCoordinates } from '@/lib/utils/distance';

const result = await calculateDistanceByCoordinates(
  24.8607,  // Pickup latitude
  67.0011,  // Pickup longitude
  31.5204,  // Delivery latitude
  74.3587   // Delivery longitude
);

console.log(result.distance); // Real-time distance in km
```

### Response Format

```typescript
interface DistanceResult {
  distance: number;        // Distance in kilometers
  duration: number;        // Estimated duration in seconds
  isEstimate: boolean;     // true if using Haversine fallback
  method: 'openroute' | 'haversine'; // Which method was used
}
```

## Caching

OpenRouteService results are cached for **24 hours** to:
- Reduce API calls and costs
- Improve response time
- Handle repeated route queries

### Clear Cache (Admin Function)

```typescript
import { clearDistanceCache } from '@/lib/utils/distance';

// Clear all cached distances
clearDistanceCache();
```

### Check Cache Stats

```typescript
import { getDistanceCacheStats } from '@/lib/utils/distance';

const stats = getDistanceCacheStats();
console.log(`Cached routes: ${stats.cacheSize}`);
console.log(`Average cache age: ${stats.averageAge / 1000 / 60} minutes`);
```

## Important: Update Existing Code

Since `calculateDistanceByCities` is now **async**, you need to update all calls:

### Before (Old Code)
```typescript
const distance = calculateDistanceByCities('Karachi', 'Sindh', 'Lahore', 'Punjab');
// Returns: number | null
```

### After (New Code)
```typescript
const result = await calculateDistanceByCities('Karachi', 'Sindh', 'Lahore', 'Punjab');
// Returns: DistanceResult | null
const distance = result?.distance;
```

## Updating Rate Calculator Component

If you're using the rate calculator, update it to handle async:

```typescript
'use client';

import { calculateDistanceByCities } from '@/lib/utils/distance';
import { useEffect, useState } from 'react';

export function RateCalculator() {
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async (pickupCity: string, deliveryCity: string) => {
    setLoading(true);
    try {
      const result = await calculateDistanceByCities(
        pickupCity,
        'Sindh',
        deliveryCity,
        'Punjab'
      );
      setDistance(result?.distance ?? null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading && <p>Calculating distance...</p>}
      {distance && <p>Distance: {distance.toFixed(2)} km</p>}
    </div>
  );
}
```

## API Endpoint Integration

If you have an API endpoint that calculates distances:

```typescript
// app/api/distance/route.ts

import { calculateDistanceByCities } from '@/lib/utils/distance';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { pickupCity, pickupState, deliveryCity, deliveryState } = await request.json();

    const result = await calculateDistanceByCities(
      pickupCity,
      pickupState,
      deliveryCity,
      deliveryState
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Cities not found' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as any).message },
      { status: 500 }
    );
  }
}
```

## Cost Estimation

### Free Plan (openrouteservice.org)
- **Requests/Day**: 2,500
- **Cost**: Free
- **Suitable for**: Development, testing, small deployments

### For Production

If you exceed free tier:
1. Upgrade OpenRouteService plan
2. Or use commercial alternatives:
   - Google Maps Distance Matrix API
   - OSRM (self-hosted)
   - Mapbox

**Cost Example**:
- 2,500 requests/day × 30 days = 75,000/month
- OpenRouteService free tier: Included in free tier
- Larger scale: Consider commercial plan (~$99/month for 1M requests)

## Debugging

### Check if API is Configured

```typescript
import { isOpenRouteServiceConfigured } from '@/lib/utils/distance';

if (!isOpenRouteServiceConfigured()) {
  console.warn('⚠️ OPENROUTE_API_KEY not set - falling back to Haversine');
}
```

### Monitor API Response

The function logs errors and warnings:

```
// When API key is missing
warn: OPENROUTE_API_KEY not configured. Falling back to Haversine calculation.

// When API is unavailable
error: OpenRouteService API error (429): Rate limit exceeded

// Fallback in use
warn: OpenRouteService unavailable or API key not configured. Using Haversine formula as fallback.
```

### Test in Development

```bash
# .env.local for testing
OPENROUTE_API_KEY=your_test_key_here
```

## Fallback Behavior

If OpenRouteService is unavailable:
1. Function logs a warning
2. Falls back to Haversine formula
3. Returns `isEstimate: true` to indicate approximation
4. Result is still usable but less accurate

**Example Response with Fallback**:
```json
{
  "distance": 240.5,
  "duration": 0,
  "isEstimate": true,
  "method": "haversine"
}
```

## Files Modified

- `lib/utils/distance.ts` - Core distance calculation engine
- Add `OPENROUTE_API_KEY` to your `.env.local`

## Next Steps

1. ✅ Get OpenRouteService API key
2. ✅ Add `OPENROUTE_API_KEY` to `.env.local`
3. ✅ Update any code calling `calculateDistanceByCities` to use `await`
4. ✅ Test with different city pairs
5. ✅ Monitor cache stats periodically

## Support

### Common Issues

**"OPENROUTE_API_KEY not configured"**
- Set the environment variable in `.env.local` or your platform
- Restart your development server after setting env vars

**"Rate limit exceeded"**
- You've exceeded your plan limit
- Upgrade your OpenRouteService plan
- Or implement request queuing

**"Distance seems incorrect"**
- Verify the city names match exactly
- Check that state/province names are correct
- Review the `method` in response (should be 'openroute', not 'haversine')

### Pakistan Coverage

OpenRouteService provides excellent coverage for:
- ✅ All major highways
- ✅ All cities and towns
- ✅ Rural routes
- ✅ Border regions

## Version History

- **v2.0** (Current) - OpenRouteService integration with caching
- **v1.0** - Haversine formula with hardcoded city coordinates
