# Location APIs - Complete Setup Guide

## Overview

This guide documents the location-based APIs that provide states, cities, and districts for the FastShip application. These endpoints use local data from `lib/cities.json` for fast, reliable responses.

## API Endpoints

### 1. GET `/api/locations/states`

Fetch all available states/provinces in Pakistan.

**Query Parameters:** None

**Response:**
```json
{
  "states": ["Sindh", "Punjab", "Khyber Pakhtunkhwa", "Balochistan", "Azad Kashmir", "Gilgit-Baltistan"],
  "count": 6,
  "message": "Found 6 states"
}
```

**Error Handling:**
- 500: Error reading states data

---

### 2. GET `/api/locations/cities`

Fetch cities for a given state.

**Query Parameters:**
- `state` (required): State/province name (e.g., "Sindh", "Punjab")

**Example Request:**
```
GET /api/locations/cities?state=Sindh
```

**Response:**
```json
{
  "state": "Sindh",
  "cities": [
    {
      "name": "Karachi",
      "latitude": 24.8607,
      "longitude": 67.0011,
      "type": "city"
    },
    {
      "name": "Hyderabad",
      "latitude": 25.3960,
      "longitude": 68.4753,
      "type": "city"
    }
  ],
  "count": 2,
  "message": "Found 2 cities"
}
```

**Error Handling:**
- 400: Missing `state` parameter
- 500: Error reading cities data

---

### 3. GET `/api/locations/districts`

Fetch districts for a given state.

**Query Parameters:**
- `state` (required): State/province name

**Example Request:**
```
GET /api/locations/districts?state=Sindh
```

**Response:**
```json
{
  "state": "Sindh",
  "districts": [
    {
      "name": "Karachi",
      "latitude": 24.8607,
      "longitude": 67.0011,
      "type": "district",
      "population": 16000000
    }
  ],
  "count": 1,
  "message": "Found 1 districts"
}
```

**Error Handling:**
- 400: Missing `state` parameter
- 500: Error reading districts data

---

## Data Source

All location data is stored in `lib/cities.json` with this structure:

```typescript
interface City {
  location: {
    latitude: number;
    longitude: number;
  };
  cityId: number;
  name: string;
  adminCode: string;      // State code: "01"-"07"
  population?: number;
  objectId?: string;
}
```

### Admin Code Mapping

| Admin Code | State                 |
|-----------|----------------------|
| 01        | Khyber Pakhtunkhwa   |
| 02        | Balochistan          |
| 04        | Punjab               |
| 05        | Sindh                |
| 06        | Azad Kashmir         |
| 07        | Gilgit-Baltistan     |

---

## Implementation Details

### State Lookup Mapping

The endpoints use a `STATE_TO_ADMIN_CODE` mapping to filter locations:

```typescript
const STATE_TO_ADMIN_CODE: Record<string, string[]> = {
  Sindh: ['05'],
  Punjab: ['04'],
  'Khyber Pakhtunkhwa': ['01'],
  Balochistan: ['02'],
  'Azad Kashmir': ['06'],
  'Gilgit-Baltistan': ['07'],
};
```

### Features

✅ **File-based storage** - No external API calls, instant responses  
✅ **Cached data** - Cities.json loaded once and reused  
✅ **Sorted results** - Cities/districts returned in alphabetical order  
✅ **Coordinates included** - Latitude/longitude for mapping  
✅ **Error handling** - Clear error messages for missing parameters  

---

## Frontend Integration

### Using in React Components

```typescript
// Fetch states
const fetchStates = async () => {
  const res = await fetch('/api/locations/states');
  const data = await res.json();
  setStates(data.states);
};

// Fetch cities for a state
const fetchCities = async (state: string) => {
  const res = await fetch(`/api/locations/cities?state=${encodeURIComponent(state)}`);
  const data = await res.json();
  setCities(data.cities);
};

// Fetch districts for a state
const fetchDistricts = async (state: string) => {
  const res = await fetch(`/api/locations/districts?state=${encodeURIComponent(state)}`);
  const data = await res.json();
  setDistricts(data.districts);
};
```

### Creating a Custom Hook

```typescript
// hooks/useLocations.ts
import { useState, useEffect } from 'react';

interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
}

export function useLocations() {
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<LocationData[]>([]);
  const [districts, setDistricts] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/locations/states');
      const data = await res.json();
      setStates(data.states);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async (state: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/locations/cities?state=${encodeURIComponent(state)}`);
      const data = await res.json();
      setCities(data.cities || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async (state: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/locations/districts?state=${encodeURIComponent(state)}`);
      const data = await res.json();
      setDistricts(data.districts || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  return {
    states,
    cities,
    districts,
    loading,
    error,
    fetchCities,
    fetchDistricts,
  };
}
```

### Usage in Components

```typescript
'use client';

import { useLocations } from '@/hooks/useLocations';

export function AddressForm() {
  const { states, cities, loading, fetchCities } = useLocations();
  const [selectedState, setSelectedState] = useState('');

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    fetchCities(state);
  };

  return (
    <div>
      <select onChange={(e) => handleStateChange(e.target.value)}>
        <option>Select State</option>
        {states.map((state) => (
          <option key={state} value={state}>
            {state}
          </option>
        ))}
      </select>

      {loading && <p>Loading cities...</p>}

      <select disabled={loading}>
        <option>Select City</option>
        {cities.map((city) => (
          <option key={city.name} value={city.name}>
            {city.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

---

## Testing the APIs

### Using cURL

```bash
# Test states endpoint
curl http://localhost:3000/api/locations/states

# Test cities for Sindh
curl "http://localhost:3000/api/locations/cities?state=Sindh"

# Test districts for Punjab
curl "http://localhost:3000/api/locations/districts?state=Punjab"
```

### Using Postman

1. **Create GET request** to `http://localhost:3000/api/locations/states`
2. **Create GET request** with query param `state=Sindh` to `http://localhost:3000/api/locations/cities`
3. **Create GET request** with query param `state=Punjab` to `http://localhost:3000/api/locations/districts`

---

## Performance Considerations

- **File I/O**: Cities.json is read synchronously in each request. Consider caching this in-memory for production environments.
- **Response Time**: Typical response time < 50ms due to local file storage.
- **Scalability**: Currently supports up to Poland cities/locations; if data grows significantly, consider database storage.

### Performance Optimization (Future)

```typescript
// In-memory cache for production
let cachedCitiesData: CitiesData | null = null;

function getCitiesData() {
  if (!cachedCitiesData) {
    const citiesFilePath = path.join(process.cwd(), 'lib', 'cities.json');
    const content = fs.readFileSync(citiesFilePath, 'utf-8');
    cachedCitiesData = JSON.parse(content);
  }
  return cachedCitiesData;
}
```

---

## Migration Path

If in future you need to migrate to a database:

1. Create a `locations` table in Prisma schema
2. Update endpoints to query from database instead of JSON file
3. Create a migration script to import cities.json data
4. No frontend code changes required (API response format remains same)

---

## Troubleshooting

### Issue: State not found

**Solution:** Verify the state name matches exactly. Use the `/api/locations/states` endpoint to get valid state names.

### Issue: Empty cities/districts list

**Possible causes:**
- Admin code mapping doesn't match cities.json data
- State name is incorrect

**Solution:** Check cities.json to verify adminCode values are correct.

### Issue: `ENOENT: no such file or directory` Error

**Solution:** Ensure `lib/cities.json` exists with proper data.

---

## Files Structure

```
app/api/locations/
  ├── states/
  │   └── route.ts           # GET /api/locations/states
  ├── cities/
  │   └── route.ts           # GET /api/locations/cities?state=...
  └── districts/
      └── route.ts           # GET /api/locations/districts?state=...

lib/
  ├── cities.json            # Location data source
  └── LOCATION_API_GUIDE.md  # This file
```

---

## Version History

- **v1.0** (Current) - Initial setup with file-based location data
- Future: Database migration, caching layer, geographic search

---

## Support

For questions or issues with the location APIs:
1. Check `/lib/cities.json` structure
2. Verify state names in admin code mapping
3. Review error logs in server console
4. Check browser network tab for API response
