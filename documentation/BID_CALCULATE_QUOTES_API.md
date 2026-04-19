# Bid Calculate Quotes API - OpenRouteService Integration

## Overview

The `/api/bids/calculate-quotes` endpoint has been **updated to use OpenRouteService** for accurate real-time distance calculations when calculating business quotes for shipments.

## What Changed

### Before
- Used hardcoded city coordinates
- Calculated straight-line distances only
- No travel duration available
- Limited city support (15 cities)

### After
- ✅ Uses OpenRouteService for real road routing
- ✅ Accurate actual distances (not straight-line)
- ✅ Travel duration estimates included
- ✅ Supports 5000+ Pakistani cities
- ✅ Automatic fallback to Haversine if API fails
- ✅ 24-hour caching for performance

---

## API Endpoint

```
GET /api/bids/calculate-quotes?shipmentId=<shipment-id>&limit=10
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `shipmentId` | string | ✅ Yes | ID of the shipment to calculate quotes for |
| `limit` | number | ❌ No | Max number of quotes to return (default: 10, max: 20) |

---

## How It Works

### 1. Fetch Shipment Details
```
GET /api/bids/calculate-quotes?shipmentId=xyz
```

### 2. Calculate Distance
```
calculateDistanceByCities(
  shipment.pickupCity,      // e.g., "Karachi"
  shipment.pickupState,     // e.g., "Sindh"
  shipment.deliveryCity,    // e.g., "Lahore"
  shipment.deliveryState    // e.g., "Punjab"
)
```

Returns:
```typescript
{
  distance: 1287,           // Real road distance in km
  duration: 50400,          // Travel time in seconds (~14 hours)
  method: 'openroute',      // 'openroute' or 'haversine'
  isEstimate: false         // false = real data, true = fallback
}
```

### 3. Find Matching Businesses
```
Uses the calculated distance to find businesses that:
- Operate in the delivery area
- Have service area coverage
- Have active drivers
```

### 4. Calculate & Sort Quotes
```
For each matching business:
1. Calculate base rate + distance charge + weight charge
2. Sort by: (1) Driver availability (2) Rating (3) Price
3. Return top 10 businesses
```

### 5. Return Recommendations
```json
{
  data: [
    {
      id: "biz-1",
      companyName: "FastCourier",
      businessType: "Logistics",
      rating: 4.8,
      baseRate: 500,
      distanceCharge: 1287,
      weightCharge: 250,
      totalRate: 2037,
      distance: 1287,
      estimatedPickupHours: 2,
      driverCount: 5,
      reasonRecommended: "⭐ Excellent ratings"
    }
    // ... more quotes
  ],
  count: 10,
  shipmentDetails: {
    weight: 5,
    distance: "1287",
    duration: 840,                    // 14 hours in minutes
    method: "openroute",              // Real-time routing
    isEstimate: false,                // Using actual GPS routing
    pickupCity: "Karachi",
    deliveryCity: "Lahore"
  }
}
```

---

## Response Details

### shipmentDetails Object

```typescript
{
  weight: number;              // Shipment weight in kg
  distance: string;            // Real road distance (km)
  duration: number;            // Travel time (minutes)
  method: 'openroute' | 'haversine';  // Which method was used
  isEstimate: boolean;         // true = API failed (fallback), false = real data
  pickupCity: string;          // e.g., "Karachi"
  deliveryCity: string;        // e.g., "Lahore"
}
```

### Quote Object

```typescript
{
  id: string;                  // Business ID
  companyName: string;         // Business name
  businessType: string;        // e.g., "Logistics", "Courier"
  rating: number;              // 0-5 star rating
  baseRate: number;            // Base charge (PKR)
  distanceCharge: number;      // Distance × rate per km (PKR)
  weightCharge: number;        // Weight surcharge (PKR)
  totalRate: number;           // Total cost (PKR)
  distance: number;            // Distance in km
  estimatedPickupHours: number;// Hours until pickup
  driverCount: number;         // Active drivers available
  reasonRecommended: string;   // Why we recommend (e.g., "⭐ Excellent ratings")
}
```

---

## Error Handling

### Case 1: Shipment Not Found
```json
{
  "error": "Shipment not found",
  "statusCode": 404
}
```

### Case 2: Cities Not Found
```json
{
  "error": "Could not find Karachi, Sindh or InvalidCity, Punjab",
  "data": [],
  "statusCode": 400
}
```

### Case 3: No Matching Businesses
```json
{
  "data": [],
  "count": 0,
  "message": "No businesses available for this shipment"
}
```

### Case 4: Server Error
```json
{
  "error": "Failed to calculate quotes",
  "statusCode": 500
}
```

---

## Testing

### Using cURL

```bash
curl "http://localhost:3000/api/bids/calculate-quotes?shipmentId=ship-123&limit=5"
```

### Using JavaScript/Fetch

```typescript
const response = await fetch(
  '/api/bids/calculate-quotes?shipmentId=ship-123&limit=10'
);

const data = await response.json();

if (response.ok) {
  console.log('Quotes:', data.data);
  console.log('Distance:', data.shipmentDetails.distance, 'km');
  console.log('Duration:', data.shipmentDetails.duration, 'minutes');
  console.log('Method:', data.shipmentDetails.method); // 'openroute' or 'haversine'
} else {
  console.error('Error:', data.error);
}
```

### Using Postman

1. **Method**: GET
2. **URL**: `http://localhost:3000/api/bids/calculate-quotes`
3. **Params**:
   - `shipmentId` = `ship-123`
   - `limit` = `10`
4. **Send** → View response

---

## Integration Example

### In a React Component

```typescript
'use client';

import { useEffect, useState } from 'react';

export function QuoteCalculator({ shipmentId }: { shipmentId: string }) {
  const [quotes, setQuotes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchQuotes() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/bids/calculate-quotes?shipmentId=${shipmentId}&limit=10`
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.error);
          return;
        }

        setQuotes(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchQuotes();
  }, [shipmentId]);

  if (loading) return <div>Calculating quotes...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!quotes) return null;

  const { data, shipmentDetails } = quotes;

  return (
    <div>
      <h2>Quote Recommendations</h2>

      {/* Distance Details */}
      <div className="bg-blue-50 p-4 rounded">
        <p>
          <strong>Distance:</strong> {shipmentDetails.distance} km
          {shipmentDetails.method === 'openroute' ? ' ✅ (Real routing)' : ' ⚠️ (Estimated)'}
        </p>
        <p>
          <strong>Duration:</strong> ~{shipmentDetails.duration} minutes
        </p>
      </div>

      {/* Quotes List */}
      <div className="mt-4 space-y-3">
        {data.map((quote) => (
          <div key={quote.id} className="border p-4 rounded">
            <h3 className="font-bold">{quote.companyName}</h3>
            <p className="text-sm text-gray-600">{quote.reasonRecommended}</p>
            <p className="mt-2">
              <strong>Total Cost:</strong> PKR {quote.totalRate.toLocaleString()}
            </p>
            <p className="text-sm">
              Base: {quote.baseRate} + Distance: {quote.distanceCharge} + Weight: {quote.weightCharge}
            </p>
            <p className="text-sm text-gray-600">
              {quote.driverCount} drivers available • Pickup in {quote.estimatedPickupHours}h
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Performance Optimization

### Caching
- Distance results are cached for **24 hours**
- Repeated calls for the same route return instantly
- Reduces API charges and improves response time

### Logging
Each calculation logs details for monitoring:
```
[calculate-quotes] Distance calculated: {
  distance: "1287.00",
  method: "openroute",
  duration: 50400,
  isEstimate: false,
  route: "Karachi, Sindh → Lahore, Punjab"
}
```

---

## Important Notes

### 1. Requires OpenRouteService API Key
```bash
# .env.local
OPENROUTE_API_KEY=your_api_key
```

Without it, the API will fall back to Haversine calculations (less accurate).

### 2. Real-Time Pricing
The quotes are calculated based on:
- ✅ **Real road distance** (not straight-line)
- ✅ Business rate cards and rules
- ✅ Current driver availability
- ✅ Service area coverage

### 3. Quote Validity
- Quotes expire in **1 hour**
- Driver availability may change
- Business rates may be subject to change
- Final confirmation required at checkout

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Could not find cities" | Verify shipment has valid pickupCity, pickupState, deliveryCity, deliveryState |
| No matching businesses | Check if delivery city is in any business service area |
| Distance seems wrong | Check `method` field: 'openroute' = accurate, 'haversine' = estimated |
| isEstimate: true | API key not configured or OpenRouteService temporarily unavailable |
| Slow response | Normal first call (100-500ms), subsequent calls cached instantly |

---

## Summary

The `/api/bids/calculate-quotes` endpoint now uses:

1. ✅ **OpenRouteService** for real-time distance routing
2. ✅ **Dynamic city lookups** from cities.json
3. ✅ **Travel duration estimates** for better predictions
4. ✅ **Smart business matching** based on accurate distances
5. ✅ **Quote sorting** by driver availability, rating, and price
6. ✅ **Automatic fallback** if API unavailable

This ensures **accurate pricing** and **better customer experience** with real-time bid recommendations.

---

**Status**: ✅ Integration Complete  
**Version**: 2.0  
**Data Source**: OpenRouteService + cities.json
