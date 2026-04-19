# Migration Guide: Haversine → OpenRouteService

## Summary of Changes

The `calculateDistanceByCities` function has been **upgraded from synchronous to asynchronous** and now uses **OpenRouteService** for real-time distance calculations instead of the outdated Haversine formula.

## Key Changes

| Aspect | Before | After |
|--------|--------|-------|
| **Type** | Synchronous | Async (requires `await`) |
| **Return Type** | `number \| null` | `DistanceResult \| null` |
| **Data Source** | Hardcoded city coordinates | Dynamic cities.json lookup |
| **Distance Method** | Straight-line formula | Real road routing |
| **Additional Data** | None | Duration, method, isEstimate flag |
| **Caching** | None | 24-hour cache built-in |
| **API Required** | No | Yes (OpenRouteService key) |

## Migration Steps

### Step 1: Set Up Environment Variable

Add to `.env.local`:
```bash
OPENROUTE_API_KEY=your_api_key_from_openrouteservice.org
```

### Step 2: Find All Calls to `calculateDistanceByCities`

Search for all usages:
```bash
grep -r "calculateDistanceByCities" --include="*.ts" --include="*.tsx"
```

### Step 3: Update Each Call

#### Example 1: Simple Variable Assignment

**Before:**
```typescript
const distance = calculateDistanceByCities('Karachi', 'Sindh', 'Lahore', 'Punjab');
```

**After:**
```typescript
const result = await calculateDistanceByCities('Karachi', 'Sindh', 'Lahore', 'Punjab');
const distance = result?.distance;
```

#### Example 2: In a Regular Function

**Before:**
```typescript
function calculateShipmentCost(pickup: string, delivery: string) {
  const distance = calculateDistanceByCities(pickup, 'Sindh', delivery, 'Punjab');
  
  if (!distance) return null;
  return distance * 50; // 50 PKR per km
}
```

**After:**
```typescript
async function calculateShipmentCost(pickup: string, delivery: string) {
  const result = await calculateDistanceByCities(pickup, 'Sindh', delivery, 'Punjab');
  
  if (!result) return null;
  return result.distance * 50; // 50 PKR per km
}
```

#### Example 3: In a React Component (useEffect)

**Before:**
```typescript
export function RateCalculator() {
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    const distance = calculateDistanceByCities('Karachi', 'Sindh', 'Lahore', 'Punjab');
    setDistance(distance);
  }, []);

  return <div>{distance} km</div>;
}
```

**After:**
```typescript
export function RateCalculator() {
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    async function fetchDistance() {
      const result = await calculateDistanceByCities('Karachi', 'Sindh', 'Lahore', 'Punjab');
      setDistance(result?.distance ?? null);
    }
    fetchDistance();
  }, []);

  return <div>{distance} km</div>;
}
```

#### Example 4: In an API Route

**Before:**
```typescript
// app/api/shipment/create/route.ts
export async function POST(request: NextRequest) {
  const { pickupCity, deliveryCity } = await request.json();
  
  const distance = calculateDistanceByCities(pickupCity, 'Sindh', deliveryCity, 'Punjab');
  
  if (!distance) {
    return NextResponse.json({ error: 'Invalid cities' }, { status: 400 });
  }

  return NextResponse.json({ distance, cost: distance * 50 });
}
```

**After:**
```typescript
// app/api/shipment/create/route.ts
import { calculateDistanceByCities } from '@/lib/utils/distance';

export async function POST(request: NextRequest) {
  const { pickupCity, deliveryCity } = await request.json();
  
  const result = await calculateDistanceByCities(pickupCity, 'Sindh', deliveryCity, 'Punjab');
  
  if (!result) {
    return NextResponse.json({ error: 'Invalid cities' }, { status: 400 });
  }

  return NextResponse.json({
    distance: result.distance,
    duration: result.duration,
    cost: result.distance * 50,
    method: result.method // 'openroute' or 'haversine'
  });
}
```

#### Example 5: In a Service Class

**Before:**
```typescript
// lib/services/rate.service.ts
export class RateService {
  calculateCost(pickup: string, delivery: string) {
    const distance = calculateDistanceByCities(pickup, 'Sindh', delivery, 'Punjab');
    
    if (!distance) throw new Error('Invalid cities');
    return distance * RATE_PER_KM;
  }
}
```

**After:**
```typescript
// lib/services/rate.service.ts
export class RateService {
  async calculateCost(pickup: string, delivery: string) {
    const result = await calculateDistanceByCities(pickup, 'Sindh', delivery, 'Punjab');
    
    if (!result) throw new Error('Invalid cities');
    return result.distance * RATE_PER_KM;
  }
}
```

### Step 4: Handle the New Response Format

The function now returns a `DistanceResult` object with more information:

```typescript
interface DistanceResult {
  distance: number;        // Actual distance in km
  duration: number;        // Estimated travel time in seconds
  isEstimate: boolean;     // true if using Haversine fallback
  method: 'openroute' | 'haversine'; // Which calculation method was used
}
```

**Example Usage:**
```typescript
const result = await calculateDistanceByCities('Karachi', 'Sindh', 'Lahore', 'Punjab');

if (result) {
  console.log(`${result.distance.toFixed(2)} km`);
  console.log(`~${Math.round(result.duration / 60)} minutes`);
  
  if (result.isEstimate) {
    console.warn('Using approximate distance (OpenRouteService unavailable)');
  }
  
  if (result.method === 'haversine') {
    console.warn('Using fallback method - results less accurate');
  }
}
```

## Files to Update

Search for these patterns in your codebase:

1. **API Routes**: `app/api/**/route.ts`
   - Rate calculation endpoints
   - Distance calculation endpoints
   - Shipment creation endpoints

2. **Services**: `lib/services/**`
   - `rate.service.ts`
   - `shipment.service.ts`
   - `bid.service.ts`

3. **Components**: `components/**`
   - Rate calculator components
   - Shipment form components
   - Distance display components

4. **Pages**: `app/**/page.tsx`
   - Rate calculator page
   - Shipment tracker page

## Testing After Migration

### Manual Testing

```typescript
import { calculateDistanceByCities } from '@/lib/utils/distance';

// Test case 1: Karachi to Lahore
const result1 = await calculateDistanceByCities('Karachi', 'Sindh', 'Lahore', 'Punjab');
console.log(result1); // Should return ~1200-1300 km, method: 'openroute'

// Test case 2: Invalid city
const result2 = await calculateDistanceByCities('InvalidCity', 'Sindh', 'Lahore', 'Punjab');
console.log(result2); // Should return null

// Test case 3: Nearby cities
const result3 = await calculateDistanceByCities('Karachi', 'Sindh', 'Hyderabad', 'Sindh');
console.log(result3); // Should return ~150-200 km within same state
```

### Automated Testing

```typescript
import { calculateDistanceByCities, isOpenRouteServiceConfigured } from '@/lib/utils/distance';

describe('calculateDistanceByCities', () => {
  it('should return null if API key not configured', async () => {
    if (!isOpenRouteServiceConfigured()) {
      // Test what happens with Haversine fallback
      const result = await calculateDistanceByCities('Karachi', 'Sindh', 'Lahore', 'Punjab');
      expect(result?.method).toBe('haversine');
      expect(result?.isEstimate).toBe(true);
    }
  });

  it('should return distance result for valid cities', async () => {
    const result = await calculateDistanceByCities('Karachi', 'Sindh', 'Lahore', 'Punjab');
    
    expect(result).not.toBeNull();
    expect(result?.distance).toBeGreaterThan(0);
    expect(result?.duration).toBeGreaterThan(0);
    expect(['openroute', 'haversine']).toContain(result?.method);
  });

  it('should cache results for subsequent calls', async () => {
    const result1 = await calculateDistanceByCities('Karachi', 'Sindh', 'Lahore', 'Punjab');
    const result2 = await calculateDistanceByCities('Karachi', 'Sindh', 'Lahore', 'Punjab');
    
    expect(result1).toEqual(result2);
  });
});
```

## Rollback Plan

If you need to revert changes:

```typescript
// Create a legacy wrapper during transition period
export async function calculateDistanceByCitiesLegacy(
  pickupCity: string,
  pickupState: string,
  deliveryCity: string,
  deliveryState: string
): Promise<number | null> {
  const result = await calculateDistanceByCities(pickupCity, pickupState, deliveryCity, deliveryState);
  return result?.distance ?? null;
}
```

Then use `calculateDistanceByCitiesLegacy` in places you haven't updated yet.

## Breaking Changes Summary

1. ⚠️ Function is now **async** (requires `await`)
2. ⚠️ Return type changed from `number | null` to `DistanceResult | null`
3. ⚠️ Access distance as `result.distance` instead of direct value
4. ⚠️ **REQUIRES** `OPENROUTE_API_KEY` environment variable (falls back to Haversine if missing)

## Performance Impact

- **Better**: Real-time accurate distances
- **Same**: Response time (~50-200ms, with caching)
- **Additional**: API key setup required

## Cost Implications

- **Free Tier**: 2,500 requests/day (sufficient for small deployment)
- **Scale**: Upgrade OpenRouteService plan as needed (~$99/month for 1M requests)

## Support

See [OPENROUTE_SERVICE_SETUP.md](OPENROUTE_SERVICE_SETUP.md) for detailed configuration and troubleshooting.
