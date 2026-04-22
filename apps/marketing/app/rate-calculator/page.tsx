'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@fastship/ui';
import { Button } from '@fastship/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@fastship/ui';
import { Input } from '@fastship/ui';
import { Label } from '@fastship/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@fastship/ui';
import { MapPin, Weight, Navigation, Zap, Loader, AlertCircle } from 'lucide-react';
import { secureFetch } from '@fastship/lib';

const STATES = ['Sindh', 'Punjab', 'Khyber Pakhtunkhwa', 'Balochistan', 'Gilgit-Baltistan', 'Azad Kashmir', 'Islamabad'];

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
  const [pickupCities, setPickupCities] = useState<City[]>([]);
  const [deliveryCities, setDeliveryCities] = useState<City[]>([]);
  const [calculatedRates, setCalculatedRates] = useState<CalculatedRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number>(0);

  useEffect(() => {
    fetchCities(pickupState, 'pickup');
  }, [pickupState]);

  useEffect(() => {
    fetchCities(deliveryState, 'delivery');
  }, [deliveryState]);

  const fetchCities = async (state: string, type: 'pickup' | 'delivery') => {
    try {
      const response = await secureFetch(`/api/location/cities?state=${state}`);
      if (response.ok) {
        const data = await response.json();
        if (type === 'pickup') setPickupCities(data.cities || []);
        else setDeliveryCities(data.cities || []);
      }
    } catch (err) {
      console.error('Error fetching cities:', err);
    }
  };

  const calculateRates = async () => {
    if (!pickupCity || !deliveryCity || weight < 1) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await secureFetch('/api/rate/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupCity,
          deliveryCity,
          weight,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setCalculatedRates(data.rates || []);
        setDistance(data.distance || 0);
      } else {
        setError(data.error || 'Failed to calculate rates');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Rate Calculator</h1>
          <p className="text-lg text-muted-foreground">Get quotes from multiple delivery providers</p>
        </div>

        {/* Calculator Card */}
        <Card className="p-8 mb-8 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
            {/* Pickup */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" />
                Pickup State
              </Label>
              <Select value={pickupState} onValueChange={setPickupState}>
                <SelectTrigger>
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

            {/* Pickup City */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Pickup City</Label>
              <Select value={pickupCity} onValueChange={setPickupCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {pickupCities.map((city) => (
                    <SelectItem key={city.name} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Delivery */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Navigation className="h-4 w-4 text-accent" />
                Delivery State
              </Label>
              <Select value={deliveryState} onValueChange={setDeliveryState}>
                <SelectTrigger>
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

            {/* Delivery City */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Delivery City</Label>
              <Select value={deliveryCity} onValueChange={setDeliveryCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {deliveryCities.map((city) => (
                    <SelectItem key={city.name} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Weight className="h-4 w-4 text-accent" />
                Weight (kg)
              </Label>
              <Input
                type="number"
                min="1"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 1)}
                placeholder="1"
              />
            </div>
          </div>

          <Button
            variant="primary"
            fullWidth
            onClick={calculateRates}
            disabled={isLoading}
            className="mt-6 h-10"
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Get Quotes
              </>
            )}
          </Button>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-8 bg-red-50 border border-red-200">
            <div className="flex gap-3 items-start">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          </Card>
        )}

        {/* Distance Info */}
        {distance > 0 && (
          <Card className="p-4 mb-8 bg-accent/5 border border-accent/20">
            <p className="text-sm text-foreground">
              <strong>Distance:</strong> {distance.toFixed(1)} km
            </p>
          </Card>
        )}

        {/* Results Table */}
        {calculatedRates.length > 0 && (
          <Card className="border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/30 border-b border-border">
                    <TableHead className="font-semibold">Provider</TableHead>
                    <TableHead className="text-right font-semibold">Base Charge</TableHead>
                    <TableHead className="text-right font-semibold">Distance Charge</TableHead>
                    <TableHead className="text-right font-semibold">Weight Charge</TableHead>
                    <TableHead className="text-right font-semibold">Total Cost</TableHead>
                    <TableHead className="text-right font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculatedRates.map((rate) => (
                    <TableRow key={rate.rateCard.id} className="border-b border-border hover:bg-secondary/20">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground">{rate.rateCard.business.companyName}</p>
                          <p className="text-xs text-muted-foreground">Rating: {rate.rateCard.business.rating}/5</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">₹{rate.baseCharge.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{rate.distanceCharge.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{rate.weightCharge.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold text-accent">₹{rate.totalCost.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {calculatedRates.length === 0 && !isLoading && !error && (
          <Card className="p-12 text-center border border-border">
            <Zap className="h-12 w-12 text-accent/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Calculate rates to see available quotes</p>
          </Card>
        )}
      </div>
    </div>
  );
}
