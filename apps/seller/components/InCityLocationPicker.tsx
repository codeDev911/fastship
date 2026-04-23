'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Loader2, AlertCircle, Route } from 'lucide-react';
import { Button } from '@fastship/ui';
import { parseAddress, secureFetch } from '@fastship/lib';

const OpenRouteMapPicker = dynamic(() => import('./OpenRouteMapPicker'), {
    ssr: false,
});

interface Location {
    name: string;
    latitude: number;
    longitude: number;
    address: string;
    state: string;
    city: string;
    zipCode: number | null
}

interface InCityLocationPickerProps {
    city: string;
    state: string;
    onLocationsSelected: (pickup: Location, delivery: Location, distance: number) => void;
    onCancel?: () => void;
    initialPickupLocation?: Location | null;
    initialDeliveryLocation?: Location | null;
    initialDistance?: number | null;
}

/**
 * InCityLocationPicker Component
 * Allows selection of pickup and delivery locations within the same city
 * Calculates distance between locations and displays on map
 */
export function InCityLocationPicker({
    city,
    state,
    onLocationsSelected,
    onCancel,
    initialPickupLocation,
    initialDeliveryLocation,
    initialDistance,
}: InCityLocationPickerProps) {
    const [mapCenter] = useState<[number, number]>([34.015, 71.525]);
    const [activeSelection, setActiveSelection] = useState<'pickup' | 'delivery'>('pickup');
    const [pickupLocation, setPickupLocation] = useState<Partial<Location>>(
        initialPickupLocation || {
            address: '',
            state: "",
            city: "",
            zipCode: null,
            latitude: undefined,
            longitude: undefined,
        }
    );

    const [deliveryLocation, setDeliveryLocation] = useState<Partial<Location>>(
        initialDeliveryLocation || {
            address: '',
            state: "",
            city: "",
            zipCode: null,
            latitude: undefined,
            longitude: undefined,
        }
    );

    const [distance, setDistance] = useState<number | null>(initialDistance || null);
    const [duration, setDuration] = useState<number | null>(null);
    const [routePath, setRoutePath] = useState<[number, number][]>([]);
    const [loadingDistance, setLoadingDistance] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
        try {
            const response = await secureFetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
                {
                    headers: { Accept: 'application/json' },
                }
            );

            if (!response.ok) {
                return `${city}, ${state}`;
            }

            const data = await response.json();
            return data.display_name || `${city}, ${state}`;
        } catch {
            return `${city}, ${state}`;
        }
    };

    const fetchOpenRouteDistance = async (
        pickupLat: number,
        pickupLng: number,
        deliveryLat: number,
        deliveryLng: number
    ) => {
        setLoadingDistance(true);
        setError(null);
        try {
            const response = await secureFetch('/api/locations/in-city-distance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pickupLatitude: pickupLat,
                    pickupLongitude: pickupLng,
                    deliveryLatitude: deliveryLat,
                    deliveryLongitude: deliveryLng,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Unable to fetch route distance from OpenRoute');
            }

            setDistance(result.data.distance);
            setDuration(result.data.duration);
            setRoutePath(result.data.routePath || []);
        } catch (err: any) {
            setDistance(null);
            setDuration(null);
            setRoutePath([]);
            setError(err.message || 'Failed to calculate OpenRoute distance');
        } finally {
            setLoadingDistance(false);
        }
    };

    useEffect(() => {
        if (
            pickupLocation.latitude !== undefined &&
            pickupLocation.longitude !== undefined &&
            deliveryLocation.latitude !== undefined &&
            deliveryLocation.longitude !== undefined
        ) {
            fetchOpenRouteDistance(
                pickupLocation.latitude,
                pickupLocation.longitude,
                deliveryLocation.latitude,
                deliveryLocation.longitude
            );
        }
    }, [pickupLocation.latitude, pickupLocation.longitude, deliveryLocation.latitude, deliveryLocation.longitude]);




    const handleMapClick = async (lat: number, lng: number) => {
        const address = await reverseGeocode(lat, lng);
        if (activeSelection === 'pickup') {
            const parsed = parseAddress(address);
            setPickupLocation((prev) => ({
                ...prev,
                latitude: lat,
                longitude: lng,
                ...parsed,
            }));
            setActiveSelection('delivery');
        } else {
            const parsed = parseAddress(address);
            setDeliveryLocation((prev) => ({
                ...prev,
                latitude: lat,
                longitude: lng,
                ...parsed,
            }));
            setActiveSelection('pickup');
        }
        setError(null);
    };

    const handlePickupChange = (field: keyof Location, value: any) => {
        setPickupLocation((prev) => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleDeliveryChange = (field: keyof Location, value: any) => {
        setDeliveryLocation((prev) => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleConfirm = async () => {
        setError(null);

        // Validate locations
        if (!pickupLocation.city || !pickupLocation.city || !pickupLocation.address) {
            setError('Please enter pickup location');
            return;
        }
        if (!deliveryLocation.city || !deliveryLocation.city || !deliveryLocation.address) {
            setError('Please enter delivery location');
            return;
        }
        if (pickupLocation.latitude === undefined || pickupLocation.longitude === undefined) {
            setError('Invalid pickup coordinates');
            return;
        }
        if (deliveryLocation.latitude === undefined || deliveryLocation.longitude === undefined) {
            setError('Invalid delivery coordinates');
            return;
        }
        if (distance === null || distance === 0) {
            setError('Distance not found! Please select different locations');
            return;
        }

        setLoading(true);
        try {
            onLocationsSelected(
                pickupLocation as Location,
                deliveryLocation as Location,
                distance
            );
        } catch (err) {
            setError('Failed to confirm locations. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = 'w-full bg-white rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 outline-none focus:border-red-500 transition-all placeholder:text-slate-400';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-slate-800 mb-2">Select In-City Locations</h2>
                    <p className="text-sm text-slate-500">
                        Choose pickup and delivery locations in {city}, {state}
                    </p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                <div className="mb-6">
                    <h3 className="text-xs uppercase tracking-widest text-red-600 font-bold mb-3">Interactive Map</h3>
                    <OpenRouteMapPicker
                        center={mapCenter}
                        pickup={
                            pickupLocation.latitude !== undefined && pickupLocation.longitude !== undefined
                                ? { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude }
                                : null
                        }
                        delivery={
                            deliveryLocation.latitude !== undefined && deliveryLocation.longitude !== undefined
                                ? { latitude: deliveryLocation.latitude, longitude: deliveryLocation.longitude }
                                : null
                        }
                        routePath={routePath}
                        activeSelection={activeSelection}
                        onMapClick={handleMapClick}
                    />
                    <div className="flex items-center gap-2 mt-3">
                        <button
                            type="button"
                            onClick={() => setActiveSelection('pickup')}
                            className={`px-3 py-1 text-xs rounded-full border ${activeSelection === 'pickup'
                                ? 'bg-green-50 border-green-300 text-green-700'
                                : 'bg-white border-slate-300 text-slate-600'
                                }`}
                        >
                            Next Click: Pickup
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSelection('delivery')}
                            className={`px-3 py-1 text-xs rounded-full border ${activeSelection === 'delivery'
                                ? 'bg-red-50 border-red-300 text-red-700'
                                : 'bg-white border-slate-300 text-slate-600'
                                }`}
                        >
                            Next Click: Delivery
                        </button>
                    </div>
                </div>

                {/* Pickup Location Section */}
                <div className="mb-8">
                    <h3 className="text-xs uppercase tracking-widest text-red-600 font-bold mb-4">Pickup Location</h3>
                    <div className="space-y-4">

                        <div>
                            <label className="block text-xs text-slate-400 mb-2 ml-2">Address</label>
                            <input
                                type="text"
                                placeholder="e.g., Main Street, Near Mosque"
                                value={pickupLocation.address || ''}
                                onChange={(e) => handlePickupChange('address', e.target.value)}
                                className={inputStyle}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-2 ml-2">City</label>
                                <input
                                    type="string"
                                    placeholder="City"
                                    value={pickupLocation.city || ''}
                                    onChange={(e) => handlePickupChange('city', e.target.value)}
                                    className={inputStyle}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-2 ml-2">State</label>
                                <input
                                    type="string"
                                    placeholder="State"
                                    value={pickupLocation.state || ''}
                                    onChange={(e) => handlePickupChange('state', e.target.value)}
                                    className={inputStyle}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-2 ml-2">Latitude</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    placeholder="34.1526"
                                    value={pickupLocation.latitude || ''}
                                    onChange={(e) => handlePickupChange('latitude', parseFloat(e.target.value))}
                                    className={inputStyle}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-2 ml-2">Longitude</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    placeholder="71.5249"
                                    value={pickupLocation.longitude || ''}
                                    onChange={(e) => handlePickupChange('longitude', parseFloat(e.target.value))}
                                    className={inputStyle}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delivery Location Section */}
                <div className="mb-8">
                    <h3 className="text-xs uppercase tracking-widest text-red-600 font-bold mb-4">Delivery Location</h3>
                    <div className="space-y-4">

                        <div>
                            <label className="block text-xs text-slate-400 mb-2 ml-2">Address</label>
                            <input
                                type="text"
                                placeholder="e.g., Central Market, Near Bank"
                                value={deliveryLocation.address || ''}
                                onChange={(e) => handleDeliveryChange('address', e.target.value)}
                                className={inputStyle}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-2 ml-2">City</label>
                                <input
                                    type="string"
                                    placeholder="City"
                                    value={deliveryLocation.city || ''}
                                    onChange={(e) => handleDeliveryChange('city', e.target.value)}
                                    className={inputStyle}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-2 ml-2">State</label>
                                <input
                                    type="string"
                                    placeholder="State"
                                    value={deliveryLocation.state || ''}
                                    onChange={(e) => handleDeliveryChange('state', e.target.value)}
                                    className={inputStyle}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-2 ml-2">Latitude</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    placeholder="34.1420"
                                    value={deliveryLocation.latitude || ''}
                                    onChange={(e) => handleDeliveryChange('latitude', parseFloat(e.target.value))}
                                    className={inputStyle}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-2 ml-2">Longitude</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    placeholder="71.5451"
                                    value={deliveryLocation.longitude || ''}
                                    onChange={(e) => handleDeliveryChange('longitude', parseFloat(e.target.value))}
                                    className={inputStyle}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Distance Display */}
                {distance !== null && (
                    <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Route className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="text-sm text-blue-900 font-medium">OpenRoute Road Distance</p>
                                <p className="text-2xl font-bold text-blue-600">{distance.toFixed(2)} km</p>
                                {duration !== null && (
                                    <p className="text-xs text-blue-700 mt-1">Estimated duration: {duration} min</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t border-slate-200">
                    {onCancel && (
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={onCancel}
                            disabled={loading}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        size="lg"
                        onClick={handleConfirm}
                        disabled={loading || loadingDistance || distance === null || distance === 0}
                        className="flex-1 flex items-center justify-center gap-2"
                    >
                        {(loading || loadingDistance) && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Confirming...' : loadingDistance ? 'Fetching Route...' : 'Confirm Locations'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default InCityLocationPicker;
