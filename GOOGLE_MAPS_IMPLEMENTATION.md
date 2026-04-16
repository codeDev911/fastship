# Google Maps Integration Guide

## Overview

FastShip uses Google Maps URLs API for seamless map integration across the application. This guide covers setup, configuration, and usage of the shared map components.

## Quick Setup

### 1. Environment Configuration

Add your Google Maps API key to `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

**Important:** The key must start with `NEXT_PUBLIC_` to be accessible in the browser.

### 2. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps JavaScript API
   - Maps Embed API
   - Maps URLs API
   - Places API (optional, for advanced features)

4. Create an API key:
   - Go to Credentials → Create Credentials → API Key
   - Restrict key to these APIs
   - Set application restrictions to HTTP referrers:
     - `http://localhost:3000/*` (development)
     - `https://your-domain.com/*` (production)

## Architecture

### File Structure

```
lib/
  ├── config/
  │   └── google-maps.ts          # Configuration and constants
  ├── types/
  │   └── maps.ts                 # TypeScript interfaces
  ├── utils/
  │   └── maps.ts                 # Utility functions
  
components/
  └── maps/
      ├── MapLink.tsx             # Clickable map link component
      ├── MapDirections.tsx       # Directions component
      ├── MapPreview.tsx          # Map preview (thumbnail)
      ├── TrackingMap.tsx         # Shipment/Driver tracking
      └── index.ts                # Barrel export
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│           Components (UI Layer)                  │
├─────────────────────────────────────────────────┤
│  MapLink  │ MapDirections │ MapPreview │ Tracking│
└────┬──────────────────────────────────┬──────────┘
     │                                  │
     └─────────────────────────────────┘
              │
     ┌────────▼─────────────┐
     │  Utilities Layer      │
     │  (maps.ts)            │
     │ - URL Generation      │
     │ - Coordinate Utils    │
     │ - Distance Calc       │
     └────────┬──────────────┘
              │
     ┌────────▼─────────────┐
     │  Configuration        │
     │  (google-maps.ts)     │
     │  API Keys, Constants  │
     └───────────────────────┘
              │
     ┌────────▼─────────────┐
     │  Google Maps APIs     │
     │  - Maps URLs API      │
     │  - Embed API          │
     │  - Direction Service  │
     └───────────────────────┘
```

## Components

### 1. MapLink

Renders a clickable link to open a location in Google Maps.

**Basic Usage:**
```tsx
import { MapLink } from '@/components/maps';

export function MyComponent() {
  return (
    <MapLink
      location={{
        name: 'Office',
        address: '1600 Amphitheatre Parkway, Mountain View, CA'
      }}
      label="View Office Location"
    />
  );
}
```

**Props:**
```typescript
interface MapLinkProps {
  location: MapLocation | string;
  label?: string;                    // Displayed text
  showIcon?: boolean;                // Show MapPin icon
  className?: string;                // Custom CSS classes
  target?: '_blank' | '_self';       // Link target
  onClick?: () => void;              // Click callback
}
```

**Examples:**
```tsx
// String address
<MapLink location="Central Park, New York" />

// With custom styling
<MapLink 
  location="123 Main Street"
  className="text-red-600 font-bold"
  showIcon={false}
/>

// With callback
<MapLink 
  location={shipment.pickupLocation}
  onClick={() => analytics.track('map_opened')}
/>
```

---

### 2. MapDirections

Displays directions between locations with multiple variants.

**Basic Usage:**
```tsx
import { MapDirections } from '@/components/maps';

export function ShipmentDetails() {
  return (
    <MapDirections
      origin={{ address: 'Pickup Location' }}
      destination={{ address: 'Delivery Location' }}
      mode="driving"
    />
  );
}
```

**Props:**
```typescript
interface MapDirectionsProps {
  origin: MapLocation;              // Starting location
  destination: MapLocation;         // End location
  waypoints?: MapLocation[];        // Optional stops
  mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
  showLabel?: boolean;              // Show button text
  variant?: 'button' | 'card' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**Variants:**

```tsx
// Button (default)
<MapDirections
  origin={{ address: 'Start' }}
  destination={{ address: 'End' }}
  variant="button"
/>

// Card - Rich display with routing info
<MapDirections
  origin={{ name: 'Warehouse', address: '123 Industrial Blvd' }}
  destination={{ name: 'Customer', address: '456 Main St' }}
  waypoints={[
    { address: 'Checkpoint 1' },
    { address: 'Checkpoint 2' }
  ]}
  variant="card"
/>

// Inline - Compact, for tables/lists
<MapDirections
  origin={{ address: 'A' }}
  destination={{ address: 'B' }}
  variant="inline"
/>
```

---

### 3. MapPreview

Displays a clickable map preview/thumbnail for a location.

**Basic Usage:**
```tsx
import { MapPreview } from '@/components/maps';

export function LocationPreview() {
  return (
    <MapPreview
      location={{
        address: '1600 Amphitheatre Parkway, Mountain View, CA',
        lat: 37.4224764,
        lng: -122.0842499
      }}
      width={300}
      height={250}
    />
  );
}
```

**Props:**
```typescript
interface MapPreviewProps {
  location: MapLocation | string;
  width?: number | string;          // Default: 400
  height?: number | string;         // Default: 300
  zoom?: number;                    // Map zoom level
  showMarker?: boolean;             // Show location pin
  className?: string;
  onClick?: () => void;
  interactive?: boolean;            // Click to open in Maps
}
```

**Examples:**
```tsx
// Responsive sizing
<MapPreview
  location="New York, NY"
  width="100%"
  height={400}
/>

// Gallery thumbnail
<MapPreview
  location={shipment.location}
  width={150}
  height={150}
  zoom={17}
/>
```

---

### 4. TrackingMap

Component for displaying real-time shipment or driver tracking.

**Basic Usage:**
```tsx
import { TrackingMap } from '@/components/maps';

export function ShipmentTracking({ shipmentId }) {
  const [shipment] = useState<ShipmentMapData>({
    shipmentId: 'ship-123',
    shipmentNumber: 'SHP-001',
    pickupLocation: { address: '123 Main St', lat: 40.7128, lng: -74.0060 },
    deliveryLocation: { address: '456 Oak Ave', lat: 40.7580, lng: -73.9855 },
    status: 'in-transit',
    estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000),
  });

  return <TrackingMap shipment={shipment} showDetails />;
}
```

**Props:**
```typescript
interface TrackingMapProps {
  shipment?: ShipmentMapData;        // Shipment data
  driver?: DriverLocationUpdate;    // Driver location (optional)
  showDetails?: boolean;            // Show metadata
  className?: string;
  compact?: boolean;                // Compact mode (expandable)
}
```

**Shipment Data Structure:**
```typescript
interface ShipmentMapData {
  shipmentId: string;
  shipmentNumber: string;
  pickupLocation: MapLocation;
  deliveryLocation: MapLocation;
  currentLocation?: MapLocation;    // Real-time location
  driverLocation?: MapLocation;
  status: 'pending' | 'assigned' | 'in-transit' | 'delivered';
  estimatedDelivery?: Date;
}
```

**Examples:**
```tsx
// Full tracking view
<TrackingMap
  shipment={shipmentData}
  driver={driverLocation}
  showDetails
/>

// Compact list item
<TrackingMap
  shipment={shipmentData}
  compact
/>
```

## Utility Functions

All utility functions are available from `@/lib/utils/maps`:

### URL Generation

```tsx
import {
  generateSearchUrl,
  generateDirectionsUrl,
  generatePlaceUrl,
  generateEmbedUrl
} from '@/lib/utils/maps';

// Search for a place
const searchUrl = generateSearchUrl('coffee near me');

// Get directions
const directionsUrl = generateDirectionsUrl({
  origin: { address: 'New York' },
  destination: { address: 'Boston' },
  waypoints: [{ address: 'Philadelphia' }],
  mode: 'driving'
});

// View a place
const placeUrl = generatePlaceUrl({
  address: '1600 Amphitheatre Parkway, Mountain View, CA',
  lat: 37.4224764,
  lng: -122.0842499
});

// Embed in iframe
const embedUrl = generateEmbedUrl('coffee shops');
```

### Coordinate Utils

```tsx
import {
  calculateCoordinateDistance,
  formatCoordinates,
  parseCoordinates
} from '@/lib/utils/maps';

// Calculate distance between two points (in km)
const distance = calculateCoordinateDistance(
  { lat: 40.7128, lng: -74.0060 },  // New York
  { lat: 40.7580, lng: -73.9855 }   // Central Park
);

// Format for display
const formatted = formatCoordinates({ lat: 40.7128, lng: -74.0060 });
// Output: "40.7128, -74.0060"

// Parse string coordinates
const coords = parseCoordinates('40.7128,-74.0060');
// Output: { lat: 40.7128, lng: -74.0060 }
```

## Real-World Examples

### 1. Shipment Details Page

```tsx
'use client';

import { MapDirections, TrackingMap } from '@/components/maps';
import { Card } from '@/components/shared/Card';
import { useEffect, useState } from 'react';

export function ShipmentDetailsPage({ shipmentId }: { shipmentId: string }) {
  const [shipment, setShipment] = useState(null);

  useEffect(() => {
    fetch(`/api/shipments/${shipmentId}`)
      .then(res => res.json())
      .then(setShipment);
  }, [shipmentId]);

  if (!shipment) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Tracking visualization */}
      <TrackingMap shipment={shipment} showDetails />

      {/* Directions */}
      <Card>
        <h3 className="font-semibold mb-4">Route</h3>
        <MapDirections
          origin={shipment.pickupLocation}
          destination={shipment.deliveryLocation}
          variant="card"
        />
      </Card>
    </div>
  );
}
```

### 2. Driver Dashboard with Live Tracking

```tsx
'use client';

import { TrackingMap } from '@/components/maps';
import { useEffect, useState } from 'react';

export function DriverDashboard() {
  const [shipments, setShipments] = useState([]);
  const [activeShipment, setActiveShipment] = useState(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch('/api/driver/shipments');
      const data = await res.json();
      setShipments(data);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main tracking view */}
      <div className="lg:col-span-2">
        {activeShipment && (
          <TrackingMap shipment={activeShipment} showDetails />
        )}
      </div>

      {/* Shipment list */}
      <div className="space-y-2">
        {shipments.map(shipment => (
          <button
            key={shipment.id}
            onClick={() => setActiveShipment(shipment)}
            className="w-full text-left p-3 rounded-lg border hover:bg-gray-50"
          >
            <TrackingMap shipment={shipment} compact />
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 3. Order List with Quick Map Links

```tsx
'use client';

import { MapLink, MapDirections } from '@/components/maps';
import { Card } from '@/components/shared/Card';

export function OrdersList({ orders }) {
  return (
    <div className="space-y-4">
      {orders.map(order => (
        <Card key={order.id} className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">{order.orderNumber}</h4>
            <div className="text-sm text-gray-600 space-y-1 mt-2">
              <div>
                From: <MapLink location={order.pickupLocation} />
              </div>
              <div>
                To: <MapLink location={order.deliveryLocation} />
              </div>
            </div>
          </div>

          <MapDirections
            origin={order.pickupLocation}
            destination={order.deliveryLocation}
            variant="button"
          />
        </Card>
      ))}
    </div>
  );
}
```

## Styling & Customization

### Using Tailwind Classes

All components accept `className` prop for custom styling:

```tsx
<MapLink
  location="Central Park"
  className="text-lg font-bold text-green-600 hover:text-green-800"
/>

<MapPreview
  location="Times Square"
  className="rounded-2xl shadow-lg"
/>
```

### Responsive Sizing

```tsx
<MapPreview
  location={location}
  width="100%"
  height={400}
  className="responsive-map"
/>
```

## Best Practices

### 1. Error Handling

```tsx
import { validateGoogleMapsConfig } from '@/lib/config/google-maps';

// On app initialization
if (!validateGoogleMapsConfig()) {
  console.error('Google Maps not configured');
  // Show fallback UI or disable map features
}
```

### 2. Performance

- Use `MapLink` for simple location links (minimal JavaScript)
- Use `MapPreview` for thumbnails (lazy load if many)
- Debounce real-time location updates in tracking maps

```tsx
// Example: Debounce tracking updates
const [trackingUpdates, setTrackingUpdates] = useState([]);

useEffect(() => {
  const timer = setTimeout(() => {
    // Process updates
  }, 1000);
  return () => clearTimeout(timer);
}, [trackingUpdates]);
```

### 3. Accessibility

- Always include meaningful location names
- Use semantic HTML structure (components handle this)
- Add `aria-label` for icon-only buttons

```tsx
<MapLink
  location="Office"
  label="View office on Google Maps"
  aria-label="Open office location in Google Maps"
/>
```

### 4. Data Organization

Keep location data consistent:

```tsx
const shipmentLocation: MapLocation = {
  name: 'Customer Address',           // Human-readable name
  address: '123 Main St, City, ST',  // Full address
  lat: 40.7128,                       // Coordinates
  lng: -74.0060,
  type: 'delivery'                    // Category
};
```

## Troubleshooting

### API Key Issues

**Problem:** "Google Maps API Key not configured"

**Solution:**
```env
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
```

Then restart the dev server.

### Components Not Appearing

**Problem:** Components render but don't show maps

**Check:**
1. API key is valid and has correct restrictions
2. Required APIs are enabled in Cloud Console
3. No console errors

### Rate Limiting

**Problem:** Too many requests to Google Maps

**Solution:**
- Implement request debouncing
- Cache location queries
- Use localStorage for frequently accessed locations

```tsx
const getCachedLocation = (address: string) => {
  const key = `location_${address}`;
  const cached = localStorage.getItem(key);
  return cached ? JSON.parse(cached) : null;
};
```

## Migration Guide

### From Previous Implementation (if any)

The new implementation follows these principles:
- **URLs API First**: Use shareable URLs instead of embedded maps when possible
- **Server-Side Safe**: No client-side API restrictions needed
- **Lightweight**: Minimal JavaScript overhead
- **Composable**: Small, focused components

Update existing code:
```tsx
// Old: Custom map component
<CustomMapComponent location={location} />

// New: Use appropriate shared component
<MapLink location={location} />       // Just a link
<MapPreview location={location} />    // Preview thumbnail
<TrackingMap shipment={shipment} />   // Full tracking view
```

## Support & Documentation

For more information:
- [Google Maps URLs API Docs](https://developers.google.com/maps/documentation/urls/get-started)
- [Google Maps Embed API](https://developers.google.com/maps/documentation/embed)
- [Google Cloud Console](https://console.cloud.google.com/)

## Future Enhancements

Potential improvements for future versions:
- [ ] Embed API integration for interactive maps
- [ ] Real-time polyline tracking
- [ ] Advanced route optimization
- [ ] Geofencing functionality
- [ ] Location autocomplete with Places API
- [ ] Heat map view for multi-location data
