'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@fastship/ui';
import { Button } from '@fastship/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fastship/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@fastship/ui';
import {
  MapPin,
  Weight,
  Navigation,
  Zap,
  TrendingUp,
  Loader,
  AlertCircle,
  Clock,
  RouteIcon,
} from 'lucide-react';
import { secureFetch } from '@fastship/lib';

// Pakistan states/provinces list (static, won't change)
const STATES = [
  'Sindh',
  'Punjab',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Gilgit-Baltistan',
  'Azad Kashmir',
  'Islamabad',
];

interface City {
  name: string;
  latitude: number;
  longitude: number;
  type: string;
}

interface RateCard {
  id: string;
  name: string;
  baseRate: number;
  perKmRate: number;
  minimumDistance: number;
  maximumDistance: number;
  minWeight: number;
  maxWeight: number;
  weightSurcharge: number;
  business: {
    companyName: string;
    rating: number;
  };
}

interface CalculatedRate {
  rateCard: RateCard;
  baseCharge: number;
  distanceCharge: number;
  weightCharge: number;
  totalCost: number;
  applicable: boolean;
  reason?: string;
}

export default function RateCalculatorPage() {
  const [pickupState, setPickupState] = useState('Sindh');
  const [pickupCity, setPickupCity] = useState('');
  const [deliveryState, setDeliveryState] = useState('Punjab');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [weight, setWeight] = useState<number>(1);
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [calculatedRates, setCalculatedRates] = useState<CalculatedRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [distanceDuration, setDistanceDuration] = useState<number>(0);
  const [distanceMethod, setDistanceMethod] = useState<'openroute' | 'haversine'>('haversine');
  const [isDistanceEstimate, setIsDistanceEstimate] = useState<boolean>(false);
  
  // City loading states
  const [pickupCities, setPickupCities] = useState<City[]>([]);
  const [deliveryCities, setDeliveryCities] = useState<City[]>([]);
  const [loadingPickupCities, setLoadingPickupCities] = useState(false);
  const [loadingDeliveryCities, setLoadingDeliveryCities] = useState(false);
  const [calculatingDistance, setCalculatingDistance] = useState(false);

  // Fetch rate cards on mount
  useEffect(() => {
    const fetchRateCards = async () => {
      try {
        setIsLoading(true);
        const response = await secureFetch(
          '/api/rate-cards?isActive=true&limit=50'
        );

        if (!response.ok) throw new Error('Failed to fetch rate cards');

        const data = await response.json();
        setRateCards(data.data || []);
      } catch (err) {
        console.error('Error fetching rate cards:', err);
        setError('Failed to load rate cards');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRateCards();
  }, []);

  // Fetch cities for pickup state
  useEffect(() => {
    const fetchPickupCities = async () => {
      try {
        setLoadingPickupCities(true);
        const response = await secureFetch(
          `/api/locations/cities?state=${encodeURIComponent(pickupState)}`
        );

        if (!response.ok) throw new Error('Failed to fetch cities');

        const data = await response.json();
        setPickupCities(data.cities || []);
        
        // Set first city as default when state changes
        if (data.cities && data.cities.length > 0) {
          setPickupCity(data.cities[0].name);
        }
      } catch (err) {
        console.error('Error fetching pickup cities:', err);
        setPickupCities([]);
        setPickupCity('');
      } finally {
        setLoadingPickupCities(false);
      }
    };

    fetchPickupCities();
  }, [pickupState]);

  // Fetch cities for delivery state
  useEffect(() => {
    const fetchDeliveryCities = async () => {
      try {
        setLoadingDeliveryCities(true);
        const response = await secureFetch(
          `/api/locations/cities?state=${encodeURIComponent(deliveryState)}`
        );

        if (!response.ok) throw new Error('Failed to fetch cities');

        const data = await response.json();
        setDeliveryCities(data.cities || []);
        
        // Set first city as default when state changes
        if (data.cities && data.cities.length > 0) {
          setDeliveryCity(data.cities[0].name);
        }
      } catch (err) {
        console.error('Error fetching delivery cities:', err);
        setDeliveryCities([]);
        setDeliveryCity('');
      } finally {
        setLoadingDeliveryCities(false);
      }
    };

    fetchDeliveryCities();
  }, [deliveryState]);

 
  // Calculate distance when locations change
  useEffect(() => {
    if (!pickupCity || !deliveryCity || !pickupState || !deliveryState) return;

    const calculateDistance = async () => {
      try {
        setCalculatingDistance(true);
        const response = await secureFetch('/api/distance/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pickupCity,
            pickupState,
            deliveryCity,
            deliveryState,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to calculate distance');
        }

        const data = await response.json();
        const result = data.data;

        if (!result) {
          console.error('Could not calculate distance');
          setDistance(0);
          setDistanceDuration(0);
          setDistanceMethod('haversine');
          setIsDistanceEstimate(false);
          return;
        }

        setDistance(result.distance);
        setDistanceDuration(result.duration);
        setDistanceMethod(result.method);
        setIsDistanceEstimate(result.isEstimate);

        console.log('[rate-calculator] Distance calculated:', {
          distance: result.distance.toFixed(2),
          duration: Math.round(result.duration / 60),
          method: result.method,
          isEstimate: result.isEstimate,
        });
      } catch (err) {
        console.error('Error calculating distance:', err);
        setDistance(0);
        setDistanceDuration(0);
        setDistanceMethod('haversine');
        setIsDistanceEstimate(false);
      } finally {
        setCalculatingDistance(false);
      }
    };

    // Add a small delay to avoid too many API calls while typing
    const timer = setTimeout(calculateDistance, 500);
    return () => clearTimeout(timer);
  }, [pickupCity, pickupState, deliveryCity, deliveryState]);

  // Calculate rates for all rate cards
  useEffect(() => {
    if (rateCards.length === 0) return;

    const calculated: CalculatedRate[] = rateCards.map((card) => {
      // Check if weight is within limits
      if (weight < card.minWeight || weight > card.maxWeight) {
        return {
          rateCard: card,
          baseCharge: 0,
          distanceCharge: 0,
          weightCharge: 0,
          totalCost: 0,
          applicable: false,
          reason: `Weight must be between ${card.minWeight}kg and ${card.maxWeight}kg`,
        };
      }

      // Check if distance is within limits
      if (distance < card.minimumDistance || distance > card.maximumDistance) {
        return {
          rateCard: card,
          baseCharge: 0,
          distanceCharge: 0,
          weightCharge: 0,
          totalCost: 0,
          applicable: false,
          reason: `Distance must be between ${card.minimumDistance}km and ${card.maximumDistance}km`,
        };
      }

      // Calculate charges
      const baseCharge = card.baseRate;
      const distanceCharge = distance * card.perKmRate;
      const weightSurchargeAmount =
        weight > card.minWeight
          ? (weight - card.minWeight) * card.weightSurcharge
          : 0;

      const totalCost = baseCharge + distanceCharge + weightSurchargeAmount;

      return {
        rateCard: card,
        baseCharge,
        distanceCharge,
        weightCharge: weightSurchargeAmount,
        totalCost,
        applicable: true,
      };
    });

    setCalculatedRates(
      calculated.sort((a, b) => a.totalCost - b.totalCost)
    );
  }, [rateCards, weight, distance]);

  const applicableRates = calculatedRates.filter((r) => r.applicable);
  const averageRate =
    applicableRates.length > 0
      ? applicableRates.reduce((sum, r) => sum + r.totalCost, 0) /
        applicableRates.length
      : 0;

  const handleCalculate = () => {
    if (!pickupCity || !deliveryCity || !weight) {
      setError('Please fill in all fields');
      return;
    }
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Rate Calculator
          </h1>
          <p className="text-lg text-muted-foreground">
            Calculate shipping rates based on location, weight, and distance
          </p>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 pt-6">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Input Form */}
        <Card>
          <CardHeader title="Shipping Details" />
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Pickup Location */}
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Pickup Location
                </h3>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    State
                  </label>
                  <Select value={pickupState} onValueChange={setPickupState}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    City
                  </label>
                  <Select value={pickupCity} onValueChange={setPickupCity}>
                    <SelectTrigger className="w-full" disabled={loadingPickupCities}>
                      {loadingPickupCities ? (
                        <div className="flex items-center gap-2">
                          <Loader className="h-4 w-4 animate-spin" />
                          <span>Loading cities...</span>
                        </div>
                      ) : (
                        <SelectValue placeholder="Select a city" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {pickupCities.length > 0 ? (
                        pickupCities.map((city) => (
                          <SelectItem key={`${city.name}-${city.latitude}`} value={city.name}>
                            {city.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No cities found
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Delivery Location */}
              <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-100">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-green-600" />
                  Delivery Location
                </h3>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    State
                  </label>
                  <Select value={deliveryState} onValueChange={setDeliveryState}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    City
                  </label>
                  <Select value={deliveryCity} onValueChange={setDeliveryCity}>
                    <SelectTrigger className="w-full" disabled={loadingDeliveryCities}>
                      {loadingDeliveryCities ? (
                        <div className="flex items-center gap-2">
                          <Loader className="h-4 w-4 animate-spin" />
                          <span>Loading cities...</span>
                        </div>
                      ) : (
                        <SelectValue placeholder="Select a city" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryCities.length > 0 ? (
                        deliveryCities.map((city) => (
                          <SelectItem key={`${city.name}-${city.latitude}`} value={city.name}>
                            {city.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No cities found
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Weight and Distance */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-4 border-t">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Weight className="h-4 w-4" />
                  Weight (kg)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Enter weight in kg"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Zap className="h-4 w-4" />
                  Estimated Distance (km)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={calculatingDistance ? 0 : Math.round(distance * 10) / 10}
                    readOnly
                    className="flex-1 px-4 py-2 border border-border rounded-lg bg-gray-100 focus:outline-none"
                    placeholder="Auto-calculated"
                  />
                  {!calculatingDistance && distance > 0 && (
                    <div className="flex items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-xs">
                        <div className="font-semibold text-blue-900">
                          {distanceMethod === 'openroute' ? '✅ Real' : '⚠️ Est.'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Distance Details */}
                <div className="mt-2 space-y-1">
                  {calculatingDistance ? (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader className="h-3 w-3 animate-spin" />
                      Calculating distance...
                    </p>
                  ) : distance > 0 ? (
                    <>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <RouteIcon className="h-3 w-3" />
                        {distanceMethod === 'openroute' ? 'Real-time routing' : 'Straight-line estimate'}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Est. travel: {Math.round(distanceDuration / 60)} minutes
                      </p>
                      {isDistanceEstimate && (
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Using fallback method (API unavailable)
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Select both locations to calculate</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleCalculate} className="flex-1">
                Calculate Rates
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {calculatedRates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Rate Cards
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {rateCards.length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Applicable Cards
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {applicableRates.length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Cheapest Rate
                  </p>
                  <p className="text-3xl font-bold text-accent">
                    PKR {applicableRates[0]?.totalCost.toFixed(2) || 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Average Rate
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    PKR {averageRate.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Rate Cards Table */}
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-3 py-12">
              <Loader className="h-5 w-5 animate-spin text-accent" />
              <span className="text-muted-foreground">Loading rate cards...</span>
            </CardContent>
          </Card>
        ) : calculatedRates.length > 0 ? (
          <Card>
            <CardHeader title={`Rate Cards (${applicableRates.length} Applicable)`} />
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Rate Card Name</TableHead>
                      <TableHead className="text-right">Base Rate</TableHead>
                      <TableHead className="text-right">Per KM</TableHead>
                      <TableHead className="text-right">Distance Charge</TableHead>
                      <TableHead className="text-right">Weight Surcharge</TableHead>
                      <TableHead className="text-right font-bold text-accent">
                        Total Cost
                      </TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculatedRates.map((rate, idx) => (
                      <TableRow
                        key={idx}
                        className={
                          !rate.applicable ? 'opacity-50 bg-gray-50' : ''
                        }
                      >
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">
                              {rate.rateCard.business.companyName}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <TrendingUp className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs text-muted-foreground">
                                Rating: {rate.rateCard.business.rating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{rate.rateCard.name}</TableCell>
                        <TableCell className="text-right font-medium">
                          PKR {rate.baseCharge.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          PKR {rate.rateCard.perKmRate}/km
                        </TableCell>
                        <TableCell className="text-right">
                          {rate.applicable ? (
                            <span className="font-medium">
                              PKR {rate.distanceCharge.toFixed(2)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {rate.applicable ? (
                            <span className="font-medium">
                              PKR {rate.weightCharge.toFixed(2)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {rate.applicable ? (
                            <span className="font-bold text-lg text-green-600">
                              PKR {rate.totalCost.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-red-600 text-xs">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {rate.applicable ? (
                            <div className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                              ✓ Valid
                            </div>
                          ) : (
                            <div className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                              {rate.reason}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {applicableRates.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    No applicable rate cards found for the selected parameters.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              Select your locations and weight to see available rate cards
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
