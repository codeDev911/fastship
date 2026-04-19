'use client';

import { useState, useEffect } from 'react';

/**
 * Interface for location data (city/district)
 */
export interface Location {
  name: string;
  latitude: number;
  longitude: number;
  type: 'city' | 'district';
  population?: number;
}

/**
 * Response types from location APIs
 */
interface StatesResponse {
  states: string[];
  count: number;
  message: string;
}

interface LocationsResponse {
  state: string;
  cities?: Location[];
  districts?: Location[];
  count: number;
  message: string;
  error?: string;
}

interface UseLocationsReturn {
  states: string[];
  cities: Location[];
  districts: Location[];
  loading: boolean;
  error: string | null;
  fetchStates: () => Promise<void>;
  fetchCities: (state: string) => Promise<void>;
  fetchDistricts: (state: string) => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for managing location data
 * Provides access to states, cities, and districts for Pakistan
 *
 * @example
 * const { states, cities, fetchCities } = useLocations();
 *
 * useEffect(() => {
 *   if (states.length === 0) {
 *     // States are auto-fetched on mount
 *   }
 * }, [states]);
 *
 * const handleStateChange = (state: string) => {
 *   fetchCities(state);
 * };
 */
export function useLocations(): UseLocationsReturn {
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all available states
   */
  const fetchStates = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/locations/states');
      if (!res.ok) {
        throw new Error(`Failed to fetch states: ${res.statusText}`);
      }

      const data: StatesResponse = await res.json();
      setStates(data.states);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('fetchStates error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch cities for a specific state
   * @param state - State name (e.g., "Sindh", "Punjab")
   */
  const fetchCities = async (state: string) => {
    if (!state) {
      setError('State parameter is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/locations/cities?state=${encodeURIComponent(state)}`
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch cities: ${res.statusText}`);
      }

      const data: LocationsResponse = await res.json();
      setCities(data.cities || []);

      if (data.error) {
        console.warn('API warning:', data.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('fetchCities error:', err);
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch districts for a specific state
   * @param state - State name (e.g., "Sindh", "Punjab")
   */
  const fetchDistricts = async (state: string) => {
    if (!state) {
      setError('State parameter is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/locations/districts?state=${encodeURIComponent(state)}`
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch districts: ${res.statusText}`);
      }

      const data: LocationsResponse = await res.json();
      setDistricts(data.districts || []);

      if (data.error) {
        console.warn('API warning:', data.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('fetchDistricts error:', err);
      setDistricts([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset all location data
   */
  const reset = () => {
    setCities([]);
    setDistricts([]);
    setError(null);
  };

  /**
   * Auto-fetch states on mount
   */
  useEffect(() => {
    fetchStates();
  }, []);

  return {
    states,
    cities,
    districts,
    loading,
    error,
    fetchStates,
    fetchCities,
    fetchDistricts,
    reset,
  };
}

/**
 * Custom hook for location dropdown state management
 * Simplifies two-step selection (state -> city/district)
 *
 * @example
 * const { selectedState, selectedCity, stateOptions, cityOptions, handleStateChange, handleCityChange } = useLocationSelect();
 */
export function useLocationSelect() {
  const { states, cities, fetchCities, loading } = useLocations();
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedCity('');
    if (state) {
      fetchCities(state);
    }
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
  };

  return {
    states,
    stateOptions: states.map((state) => ({ label: state, value: state })),
    selectedState,
    setSelectedState,
    cities,
    cityOptions: cities.map((city) => ({ label: city.name, value: city.name, ...city })),
    selectedCity,
    setSelectedCity,
    loading,
    handleStateChange,
    handleCityChange,
  };
}
