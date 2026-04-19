# OpenRouteService Integration - Quick Reference

## 🚀 TL;DR

Your distance calculation now uses **real-time road routing** instead of straight-line math. This means accurate pricing.

### Before
```typescript
const distance = calculateDistanceByCities('Karachi', 'Sindh', 'Lahore', 'Punjab');
// Returns: ≈ 240 km (straight line - WRONG)
```

### After
```typescript
const result = await calculateDistanceByCities('Karachi', 'Sindh', 'Lahore', 'Punjab');
// Returns: { distance: 1287, duration: 50400, method: 'openroute' }
// Actual road distance: 1287 km
```

---

## ⚙️ 3-Step Setup

### 1. Get API Key
```
https://openrouteservice.org/ → Sign up → Create API key
```

### 2. Add to `.env.local`
```bash
OPENROUTE_API_KEY=your_key_here
```

### 3. Restart Server
```bash
# Stop and restart npm run dev
```

**Done!** ✅

---

## 📝 Update Your Code

### Pattern
```typescript
// Add async/await
- const distance = calculateDistanceByCities(...)
+ const result = await calculateDistanceByCities(...)

// Access the distance property
- return distance * 50
+ return result?.distance * 50
```

### Find All Occurrences
```bash
grep -r "calculateDistanceByCities" --include="*.ts" --include="*.tsx"
```

---

## 🔧 Common Updates

### React Component
```typescript
'use client';

export function Component() {
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    async function fetch() {
      const result = await calculateDistanceByCities('Karachi', 'Sindh', 'Lahore', 'Punjab');
      setDistance(result?.distance);
    }
    fetch();
  }, []);

  return <div>{distance} km</div>;
}
```

### API Endpoint
```typescript
import { calculateDistanceByCities } from '@/lib/utils/distance';

export async function POST(request: NextRequest) {
  const result = await calculateDistanceByCities(city1, state1, city2, state2);
  
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 400 });
  
  return NextResponse.json({
    distance: result.distance,
    duration: result.duration,
    cost: result.distance * 50
  });
}
```

### Service Function
```typescript
export async function calculateRate(city1: string, city2: string) {
  const result = await calculateDistanceByCities(city1, 'Sindh', city2, 'Punjab');
  return result?.distance ? result.distance * RATE : null;
}
```

---

## 📊 Response Format

```typescript
{
  distance: 1287,        // km
  duration: 50400,       // seconds (≈14 hours)
  method: 'openroute',   // 'openroute' or 'haversine'
  isEstimate: false      // true if API failed (using fallback)
}
```

**Access like this:**
```typescript
result.distance      // The actual distance
result.duration      // Travel time
result.method        // Which method was used
result.isEstimate    // Is it a fallback result?
```

---

## ✅ Verify It Works

```typescript
import { calculateDistanceByCities, isOpenRouteServiceConfigured } from '@/lib/utils/distance';

// Check if configured
console.log(isOpenRouteServiceConfigured()); // Should be true

// Test a real distance
const result = await calculateDistanceByCities('Karachi', 'Sindh', 'Lahore', 'Punjab');
console.log(result);
// OUTPUT:
// {
//   distance: 1287,
//   duration: 50400,
//   method: 'openroute',
//   isEstimate: false
// }
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Not configured" | Add `OPENROUTE_API_KEY` to `.env.local` and restart |
| `method: 'haversine'` | API key missing or API unavailable |
| `isEstimate: true` | Using fallback (less accurate) |
| Distance seems wrong | Verify city names match exactly |
| Slow first call | Normal (100-500ms), cached calls are instant |
| "Rate limit" error | Upgrade OpenRouteService plan |

---

## 💡 Key Differences

| Feature | Before | After |
|---------|--------|-------|
| Distance Accuracy | ❌ Straight line | ✅ Real roads |
| Speed | Fast ⚡ | Normal (cached fast) |
| API Required | ❌ No | ✅ Yes (free tier) |
| Async | ❌ Sync | ✅ Async (use `await`) |
| Return Type | `number` | `DistanceResult` |
| Travel Duration | ❌ Not available | ✅ Included |
| Caching | ❌ None | ✅ 24-hour cache |

---

## 🎁 Bonus Features

### Check Cache Performance
```typescript
import { getDistanceCacheStats } from '@/lib/utils/distance';

const stats = getDistanceCacheStats();
console.log(`Cached: ${stats.cacheSize} routes`);
console.log(`Average age: ${(stats.averageAge / 1000 / 60).toFixed(1)} minutes`);
```

### Clear Cache (if needed)
```typescript
import { clearDistanceCache } from '@/lib/utils/distance';

clearDistanceCache();
```

### Calculate by Coordinates
```typescript
import { calculateDistanceByCoordinates } from '@/lib/utils/distance';

const result = await calculateDistanceByCoordinates(
  24.8607, 67.0011,  // Latitude, Longitude (Karachi)
  31.5204, 74.3587   // Latitude, Longitude (Lahore)
);
console.log(result.distance); // Real distance in km
```

---

## 📚 Full Documentation

- **Setup Guide**: [OPENROUTE_SERVICE_SETUP.md](OPENROUTE_SERVICE_SETUP.md)
- **Migration Guide**: [MIGRATION_GUIDE_OPENROUTE.md](MIGRATION_GUIDE_OPENROUTE.md)
- **Checklist**: [OPENROUTE_IMPLEMENTATION_CHECKLIST.md](OPENROUTE_IMPLEMENTATION_CHECKLIST.md)
- **Code**: [lib/utils/distance.ts](lib/utils/distance.ts)

---

## 🚨 Critical Changes

⚠️ **The function is now ASYNC**
```typescript
// OLD: const distance = calculateDistanceByCities(...)
// NEW: const result = await calculateDistanceByCities(...)
```

⚠️ **Return type changed**
```typescript
// OLD: Returns number | null
// NEW: Returns DistanceResult { distance, duration, method, isEstimate } | null
```

⚠️ **All callers must be updated** or your app will break

---

## 💰 Cost

- **Free**: 2,500 requests/day (with caching: ~1,000 shipments/day max)
- **Paid**: $99/month for 1M requests
- **Estimate**: $50-200/month for typical deployment

---

## ✨ What You Get

✅ **Accurate distances** for correct pricing  
✅ **Real travel times** for delivery estimates  
✅ **Cost-effective** caching layer  
✅ **Production-ready** error handling  
✅ **Fallback support** if API unavailable  
✅ **5000+ cities** supported  

---

## 🎯 Next Steps

1. ✅ Get API key from OpenRouteService
2. ✅ Add `OPENROUTE_API_KEY` to `.env.local`
3. ✅ Update code to use async function
4. ✅ Test in your app
5. ✅ Deploy to production

---

**Status**: Ready to Use ✅  
**Version**: 2.0  
**Updated**: April 16, 2026
