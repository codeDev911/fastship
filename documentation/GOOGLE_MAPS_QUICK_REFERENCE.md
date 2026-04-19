# Google Maps Quick Reference Card

## Quick Start (5 minutes)

### 1. Setup API Key
```bash
# Get key from Google Cloud Console
# Add to .env.local:
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE

# Restart dev server
npm run dev
```

### 2. Import Components
```tsx
import { 
  MapLink, 
  MapDirections, 
  MapPreview, 
  TrackingMap 
} from '@/components/maps';
```

### 3. Use Them!
```tsx
// Show location link
<MapLink location="Central Park, New York" />

// Show directions
<MapDirections
  origin={{ address: 'Start' }}
  destination={{ address: 'End' }}
/>

// Location preview
<MapPreview location="Times Square" width={300} height={200} />

// Track shipment
<TrackingMap shipment={shipmentData} />
```

---

## Component Reference

### MapLink
```tsx
<MapLink
  location={{
    name?: string;
    address: string;
    lat?: number;
    lng?: number;
  } | string}
  label?: string;           // Display text
  showIcon?: boolean;       // Show pin icon
  className?: string;       // Custom style
/>
```

**Use for:** Text links to locations in any content

---

### MapDirections
```tsx
<MapDirections
  origin={{ address: string; name?: string; lat?: number; lng?: number }}
  destination={{ address: string; ... }}
  waypoints?: MapLocation[]         // Optional stops
  mode?: 'driving' | 'walking' | 'bicycling' | 'transit'
  variant?: 'button' | 'card' | 'inline'  // Display style
  size?: 'sm' | 'md' | 'lg'        // Button size
  showLabel?: boolean               // Show text
/>
```

**Variants:**
- `button` - Compact button (default)
- `card` - Rich card with route details
- `inline` - Minimal inline link

**Use for:** Navigation CTAs, route planning

---

### MapPreview
```tsx
<MapPreview
  location={{ address: string; name?: string; lat?: number; lng?: number } | string}
  width={number | string}    // Default: 400
  height={number | string}   // Default: 300
  zoom={number}              // Default: 15
  showMarker={boolean}       // Default: true
  interactive={boolean}      // Click to open
  onClick={() => {}}         // Custom callback
/>
```

**Use for:** Location thumbnails, gallery previews

---

### TrackingMap
```tsx
<TrackingMap
  shipment={{
    shipmentId: string;
    shipmentNumber: string;
    pickupLocation: MapLocation;
    deliveryLocation: MapLocation;
    currentLocation?: MapLocation;
    driverLocation?: MapLocation;
    status: 'pending' | 'assigned' | 'in-transit' | 'delivered' | 'failed';
    estimatedDelivery?: Date;
  }}
  driver?: {
    driverId: string;
    lat: number;
    lng: number;
    timestamp: Date;
  }
  showDetails?: boolean      // Show metadata
  compact?: boolean          // Compact version
/>
```

**Use for:** Shipment tracking, driver status views

---

## Utility Functions

### URL Generation
```tsx
import {
  generateSearchUrl,
  generateDirectionsUrl,
  generatePlaceUrl
} from '@/lib/utils/maps';

// Search
const url = generateSearchUrl('coffee');
const url = generateSearchUrl('pizza', { 
  center: { lat: 40.7128, lng: -74.0060 },
  zoom: 15 
});

// Directions
const url = generateDirectionsUrl({
  origin: { address: 'NYC' },
  destination: { address: 'Boston' },
  waypoints: [{ address: 'Philly' }],
  mode: 'driving'
});

// Place view
const url = generatePlaceUrl({ 
  address: 'Times Square, NYC',
  lat: 40.758,
  lng: -73.9855
});
```

### Coordinate Utils
```tsx
import {
  calculateCoordinateDistance,
  formatCoordinates,
  parseCoordinates
} from '@/lib/utils/maps';

// Distance in km
const km = calculateCoordinateDistance(
  { lat: 40.7128, lng: -74.0060 },
  { lat: 40.7580, lng: -73.9855 }
);

// Format for display
const str = formatCoordinates({ lat: 40.7128, lng: -74.0060 });
// "40.7128, -74.0060"

// Parse string
const coords = parseCoordinates('40.7128,-74.0060');
// { lat: 40.7128, lng: -74.0060 }
```

---

## Common Patterns

### Display Location with Link
```tsx
<div>
  <h4>Pickup Location</h4>
  <MapLink location={shipment.pickupLocation} />
</div>
```

### Show Directions Button
```tsx
<MapDirections
  origin={shipment.pickupLocation}
  destination={shipment.deliveryLocation}
  variant="button"
/>
```

### Track Shipment
```tsx
<TrackingMap 
  shipment={shipmentData}
  driver={currentDriverLocation}
  showDetails
/>
```

### List Locations in Table
```tsx
<table>
  <tbody>
    {shipments.map(s => (
      <tr key={s.id}>
        <td>
          <MapLink location={s.pickupLocation} />
        </td>
        <td>
          <MapLink location={s.deliveryLocation} />
        </td>
        <td>
          <MapDirections
            origin={s.pickupLocation}
            destination={s.deliveryLocation}
            variant="inline"
          />
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### Responsive Preview
```tsx
<MapPreview
  location={location}
  width="100%"
  height={300}
  className="rounded-lg shadow-lg"
/>
```

---

## Type Definitions

### MapLocation
```typescript
interface MapLocation {
  id?: string;
  name?: string;           // Human-readable name
  address: string;         // Full address
  lat?: number;           // Latitude
  lng?: number;           // Longitude
  type?: 'pickup' | 'delivery' | 'checkpoint';
  status?: 'pending' | 'completed' | 'current';
}
```

### Coordinates
```typescript
type Coordinates = {
  lat: number;
  lng: number;
};
```

---

## Styling

### TailwindCSS Classes
```tsx
// All components accept className
<MapLink 
  location="NYC" 
  className="text-blue-600 font-bold hover:text-blue-800"
/>

<MapPreview
  location="Location"
  className="rounded-2xl shadow-lg border-2 border-blue-500"
/>
```

### Custom Styles
```tsx
<MapDirections
  origin={{ address: 'A' }}
  destination={{ address: 'B' }}
  className="w-full max-w-md"
  size="lg"
/>
```

---

## Validation

### Check if Configured
```tsx
import { validateGoogleMapsConfig } from '@/lib/config/google-maps';

if (!validateGoogleMapsConfig()) {
  console.warn('Google Maps not configured');
  // Show fallback UI
}
```

---

## Environment Setup

### Development
```bash
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD...
```

### Production (Vercel)
1. Project Settings → Environment Variables
2. Add: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
3. Redeploy

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "API Key not configured" | Add to `.env.local` and restart |
| Links not working | Check API key is valid in Cloud Console |
| Requests blocked | Verify HTTP referrer restrictions match domain |
| Maps not loading | Ensure API is enabled in Cloud Console |

---

## Documentation Files

- **Quick Start:** This file (QUICK_REFERENCE.md)
- **Full Guide:** `GOOGLE_MAPS_IMPLEMENTATION.md`
- **Setup:** `GOOGLE_MAPS_API_SETUP.md`
- **Examples:** `MAPS_INTEGRATION_EXAMPLES.md`
- **Summary:** `GOOGLE_MAPS_SUMMARY.md`

---

## API Cost

| API | Cost | Usage |
|-----|------|-------|
| Maps URLs | FREE | Links (unlimited) |
| Embed API | FREE* | Embeds (14k/day free) |
| JavaScript | $0.007/1k | Interactive maps |
| Places | $0.017/1k | Autocomplete |

*: Free tier, then $0.007 per load

---

## Support

- **Google Docs:** https://developers.google.com/maps/documentation/urls
- **Cloud Console:** https://console.cloud.google.com/
- **FastShip Docs:** See documentation files

---

**Version:** 1.0 | **Updated:** April 2026
