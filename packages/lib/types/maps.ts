/**
 * Google Maps related types and interfaces
 */

export interface MapLocation {
  id?: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  type?: 'pickup' | 'delivery' | 'checkpoint';
  status?: 'pending' | 'completed' | 'current';
}

export interface MapMarkerConfig {
  location: MapLocation;
  color?: string;
  size?: 'tiny' | 'mid' | 'small';
  label?: string;
}

export interface MapDirectionsConfig {
  origin: MapLocation;
  destination: MapLocation;
  waypoints?: MapLocation[];
  mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
  alternatives?: boolean;
}

export interface MapPreviewConfig {
  center?: MapLocation;
  locations?: MapLocation[];
  zoom?: number;
  mapType?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid';
  width?: number;
  height?: number;
}

export interface ShipmentMapData {
  shipmentId: string;
  shipmentNumber: string;
  pickupLocation: MapLocation;
  deliveryLocation: MapLocation;
  currentLocation?: MapLocation;
  driverLocation?: MapLocation;
  status: string;
  estimatedDelivery?: Date;
}

export interface DriverLocationUpdate {
  driverId: string;
  lat: number;
  lng: number;
  timestamp: Date;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

export interface TrackingMapConfig {
  shipments?: ShipmentMapData[];
  drivers?: DriverLocationUpdate[];
  showTrail?: boolean;
  autoCenter?: boolean;
  interactive?: boolean;
}
