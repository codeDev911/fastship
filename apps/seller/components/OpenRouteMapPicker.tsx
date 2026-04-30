'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMapEvents } from 'react-leaflet';
import { useMemo } from 'react';

interface Point {
  latitude: number;
  longitude: number;
}

interface OpenRouteMapPickerProps {
  center: [number, number];
  pickup?: Point | null;
  delivery?: Point | null;
  routePath?: [number, number][];
  activeSelection: 'pickup' | 'delivery';
  onMapClick: (lat: number, lng: number) => void;
}

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  
  useMapEvents({
    click(event) {
      console.log(event);
      onMapClick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

export default function OpenRouteMapPicker({
  center,
  pickup,
  delivery,
  routePath = [],
  activeSelection,
  onMapClick,
}: OpenRouteMapPickerProps) {
  const pickupIcon = useMemo(
    () =>
      L.divIcon({
        html: '<div style="background:#16a34a;color:#fff;border-radius:999px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.25);">P</div>',
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
    []
  );

  const deliveryIcon = useMemo(
    () =>
      L.divIcon({
        html: '<div style="background:#dc2626;color:#fff;border-radius:999px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.25);">D</div>',
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
    []
  );

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200">
      <MapContainer
        center={center}
        zoom={13}
        style={{ width: '100%', height: '360px' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />

        <ClickHandler onMapClick={onMapClick} />

        {pickup && (
          <Marker position={[pickup.latitude, pickup.longitude]} icon={pickupIcon}>
            <Tooltip direction="top" offset={[0, -12]} permanent>
              Pickup
            </Tooltip>
          </Marker>
        )}

        {delivery && (
          <Marker position={[delivery.latitude, delivery.longitude]} icon={deliveryIcon}>
            <Tooltip direction="top" offset={[0, -12]} permanent>
              Delivery
            </Tooltip>
          </Marker>
        )}

        {routePath.length > 1 && (
          <Polyline positions={routePath} pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.8 }} />
        )}
      </MapContainer>

      <div className="px-4 py-2 bg-slate-50 text-xs text-slate-600">
        Click map to set: <span className="font-semibold uppercase">{activeSelection}</span>
      </div>
    </div>
  );
}
