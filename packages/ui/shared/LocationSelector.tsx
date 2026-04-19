'use client';

import { useLocationSelect } from '../../hooks/useLocations';

/**
 * Example component showing how to use the location APIs
 * Demonstrates state -> city -> district selection flow
 */
export function LocationSelector() {
  const {
    states,
    stateOptions,
    selectedState,
    cities,
    cityOptions,
    selectedCity,
    loading,
    handleStateChange,
    handleCityChange,
  } = useLocationSelect();

  return (
    <div className="space-y-4 p-4">
      <div>
        <label htmlFor="state" className="block text-sm font-medium mb-2">
          State/Province
        </label>
        <select
          id="state"
          value={selectedState}
          onChange={(e) => handleStateChange(e.target.value)}
          disabled={states.length === 0}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="">Select a state...</option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      {selectedState && (
        <div>
          <label htmlFor="city" className="block text-sm font-medium mb-2">
            City
          </label>
          {loading ? (
            <div className="p-2 text-gray-500">Loading cities...</div>
          ) : cities.length > 0 ? (
            <select
              id="city"
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select a city...</option>
              {cities.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name}
                  {city.population && ` (${city.population.toLocaleString()})`}
                </option>
              ))}
            </select>
          ) : (
            <div className="p-2 text-gray-500">No cities found for this state</div>
          )}
        </div>
      )}

      {selectedCity && (
        <div className="p-3 bg-blue-50 rounded-md">
          <p className="text-sm font-medium">
            Selected: {selectedCity}, {selectedState}
          </p>
          {cities.find((c) => c.name === selectedCity) && (
            <div className="text-xs text-gray-600 mt-1 space-y-1">
              <p>
                Coordinates:{' '}
                {cities.find((c) => c.name === selectedCity)?.latitude.toFixed(4)},{' '}
                {cities.find((c) => c.name === selectedCity)?.longitude.toFixed(4)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Alternative implementation using the raw useLocations hook
 * More flexible but requires more code
 */
export function LocationSelectorAdvanced() {
  const {
    states,
    cities,
    loading,
    error,
    fetchCities,
  } = useLocations();

  const handleStateChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const state = e.target.value;
    if (state) {
      await fetchCities(state);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-700">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <label htmlFor="state-advanced" className="block text-sm font-medium mb-2">
          State/Province
        </label>
        <select
          id="state-advanced"
          onChange={handleStateChange}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="">Select a state...</option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}

      {cities.length > 0 && (
        <div>
          <label htmlFor="city-advanced" className="block text-sm font-medium mb-2">
            City ({cities.length} available)
          </label>
          <select className="w-full px-3 py-2 border rounded-md">
            <option value="">Select a city...</option>
            {cities.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
