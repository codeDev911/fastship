'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Loader2, AlertCircle, Search } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { parseAddress } from '@/lib/config/parse-address';

const OpenRouteMapPicker = dynamic(() => import('@/components/seller/OpenRouteMapPicker'), {
    ssr: false,
});

interface Location {
    name: string;
    latitude: number;
    longitude: number;
    address: string;
    state: string;
    city: string;
    zipCode: string;
    phone:string;
}

interface WarehouseLocationPickerProps {
    onLocationSelected: (location: Location) => void;
    onCancel?: () => void;
    initialLocation?: Location | null;
}

/**
 * WarehouseLocationPicker Component
 * Allows selection of a single warehouse location from the map
 */
export function WarehouseLocationPicker({
    onLocationSelected,
    onCancel,
    initialLocation,
}: WarehouseLocationPickerProps) {
    const [mapCenter, setMapCenter] = useState<[number, number]>([31.5204, 74.3587]); // Lahore as default
    const [warehouseLocation, setWarehouseLocation] = useState<Partial<Location>>(
        initialLocation || {
            name: 'Warehouse',
            address: '',
            state: "",
            city: "",
            zipCode: "",
            latitude: undefined,
            longitude: undefined,
            phone:""
        }
    );

    const [warehouseName, setWarehouseName] = useState(initialLocation?.name || 'Warehouse');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [states, setStates] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [selectedState, setSelectedState] = useState(initialLocation?.state || '');
    const [selectedCity, setSelectedCity] = useState(initialLocation?.city || '');

    // Fetch states on mount
    useEffect(() => {
        const fetchStates = async () => {
            try {
                const response = await fetch('/api/locations/states');
                const data = await response.json();
                if (data.states) {
                    setStates(data.states);
                    if (!selectedState && data.states.length > 0) {
                        setSelectedState(data.states[0]);
                    }
                }
            } catch (error) {
                console.error('Error fetching states:', error);
            }
        };
        fetchStates();
    }, []);

    // Fetch cities when state changes
    useEffect(() => {
        if (!selectedState) return;

        const fetchCities = async () => {
            try {
                const response = await fetch(
                    `/api/locations/cities?state=${encodeURIComponent(selectedState)}`
                );
                const data = await response.json();
                const cityNames = data.cities?.map((c: any) => c.name) || [];
                setCities(cityNames);
                
                if (!selectedCity && cityNames.length > 0) {
                    setSelectedCity(cityNames[0]);
                    // Update map center to the first city
                    const cityData = data.cities?.[0];
                    if (cityData?.latitude && cityData?.longitude) {
                        setMapCenter([cityData.latitude, cityData.longitude]);
                    }
                }
            } catch (error) {
                console.error('Error fetching cities:', error);
            }
        };
        fetchCities();
    }, [selectedState]);

    // Update map center when city changes
    useEffect(() => {
        if (!selectedCity || !selectedState) return;

        const fetchCityCoords = async () => {
            try {
                const response = await fetch(
                    `/api/locations/cities?state=${encodeURIComponent(selectedState)}`
                );
                const data = await response.json();
                const city = data.cities?.find((c: any) => c.name === selectedCity);
                if (city?.latitude && city?.longitude) {
                    setMapCenter([city.latitude, city.longitude]);
                }
            } catch (error) {
                console.error('Error fetching city coordinates:', error);
            }
        };
        fetchCityCoords();
    }, [selectedCity, selectedState]);

    const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
                {
                    headers: { Accept: 'application/json' },
                }
            );

            if (!response.ok) {
                return `${selectedCity}, ${selectedState}`;
            }

            const data = await response.json();
            return data.display_name || `${selectedCity}, ${selectedState}`;
        } catch {
            return `${selectedCity}, ${selectedState}`;
        }
    };

    const handleMapClick = async (lat: number, lng: number) => {
        setLoading(true);
        setError(null);

        try {
            const res = await reverseGeocode(lat, lng);
            let add = parseAddress(res)
            
            setWarehouseLocation({
                name: warehouseName,
                latitude: lat,
                longitude: lng,
                address: add.address,
                state: add.state,
                city: add.city,
                zipCode: add.zipCode,
            });
            setSelectedState(add.state);
            setSelectedCity(add.city);
        } catch (err) {
            setError('Failed to get address for selected location');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        if (!warehouseLocation.latitude || !warehouseLocation.longitude) {
            setError('Please click on the map to select a warehouse location');
            return;
        }

        if (!warehouseLocation.address) {
            setError('Could not determine address for selected location');
            return;
        }

        const location: Location = {
            name: warehouseName,
            latitude: warehouseLocation.latitude,
            longitude: warehouseLocation.longitude,
            address: warehouseLocation.address,
            state: selectedState,
            city: selectedCity,
            zipCode: warehouseLocation.zipCode || '',
            phone: warehouseLocation.phone || '',
        };

        

        onLocationSelected(location);
    };

    return (
        <div className="space-y-6 bg-slate-50 p-6 rounded-lg border border-slate-200">
            <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Warehouse Location</h3>
                <p className="text-sm text-slate-600 mb-6">
                    Choose your warehouse location from the map. Click on the map to set the exact position.
                </p>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Location Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-slate-400 mb-2 ml-4">Warehouse Name</label>
                    <input
                        type="text"
                        value={warehouseName}
                        onChange={(e) => setWarehouseName(e.target.value)}
                        placeholder="Main Warehouse"
                        className="w-full bg-white rounded-full border border-slate-300 px-6 py-3 text-sm text-slate-700 outline-none focus:border-red-500 transition-all placeholder:text-slate-500"
                    />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                    <label className="block text-xs text-slate-400 mb-2 ml-4">Zip Code</label>
                    <input
                        type="text"
                        value={warehouseLocation.zipCode || ''}
                        onChange={(e) => setWarehouseLocation(prev => ({ ...prev, zipCode: e.target.value }))}
                        placeholder="Postal Code"
                        className="w-full bg-white rounded-full border border-slate-300 px-6 py-3 text-sm text-slate-700 outline-none focus:border-red-500 transition-all placeholder:text-slate-500"
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-400 mb-2 ml-4">Phone</label>
                    <input
                        type="text"
                        value={warehouseLocation.phone || ''}
                        onChange={(e) => setWarehouseLocation(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Phone number"
                        className="w-full bg-white rounded-full border border-slate-300 px-6 py-3 text-sm text-slate-700 outline-none focus:border-red-500 transition-all placeholder:text-slate-500"
                    />
                </div>
                </div>
            </div>

            {/* State and City Selection */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-slate-400 mb-2 ml-4">State</label>
                    <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full bg-white rounded-full border border-slate-300 px-6 py-3 text-sm text-slate-700 outline-none focus:border-red-500 transition-all cursor-pointer"
                    >
                        <option value="">Select State</option>
                        {states.map((state) => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-slate-400 mb-2 ml-4">City</label>
                    <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full bg-white rounded-full border border-slate-300 px-6 py-3 text-sm text-slate-700 outline-none focus:border-red-500 transition-all cursor-pointer"
                    >
                        <option value="">Select City</option>
                        {cities.map((city) => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Address Display */}
            {warehouseLocation.address && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-medium text-blue-900 mb-1">Selected Address:</p>
                    <p className="text-sm text-blue-800">{warehouseLocation.address}</p>
                </div>
            )}

            {/* Map */}
            <div>
                <label className="block text-xs text-slate-400 mb-3 ml-4">Click on the map to set location</label>
                <OpenRouteMapPicker
                    center={mapCenter}
                    pickup={warehouseLocation.latitude && warehouseLocation.longitude ? 
                        { latitude: warehouseLocation.latitude, longitude: warehouseLocation.longitude } 
                        : null
                    }
                    activeSelection="pickup"
                    onMapClick={handleMapClick}
                />
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Getting address details...
                </div>
            )}

            {/* Coordinates Display */}
            {warehouseLocation.latitude && warehouseLocation.longitude && (
                <div className="p-3 bg-slate-100 rounded-lg">
                    <p className="text-xs font-medium text-slate-700">Coordinates:</p>
                    <p className="text-xs text-slate-600">
                        {warehouseLocation.latitude.toFixed(6)}, {warehouseLocation.longitude.toFixed(6)}
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
                <Button
                    onClick={handleConfirm}
                    variant="primary"
                    className="flex-1 rounded-full"
                    disabled={loading || !warehouseLocation.latitude || !warehouseLocation.longitude}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <MapPin className="w-4 h-4 mr-2" />
                            Confirm Location
                        </>
                    )}
                </Button>
                {onCancel && (
                    <Button
                        onClick={onCancel}
                        variant="secondary"
                        className="flex-1 rounded-full"
                    >
                        Cancel
                    </Button>
                )}
            </div>
        </div>
    );
}

export default WarehouseLocationPicker;
