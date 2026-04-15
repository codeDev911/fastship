'use client';

import React, { useState, useEffect } from 'react';
import { RateCard } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface RateCardFormProps {
  rateCard?: RateCard;
  businessId: string;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

const STATES = [
  'Sindh', 'Punjab', 'KPK', 'Balochistan', 'Gilgit-Baltistan', 
  'AJK', 'FATA', 'Islamabad'
];

export function RateCardFormNew({
  rateCard,
  businessId,
  onSubmit,
  isLoading = false,
}: RateCardFormProps) {
  const [formData, setFormData] = useState({
    name: rateCard?.name || '',
    description: rateCard?.description || '',
    baseRate: rateCard?.baseRate || 0,
    minimumDistance: rateCard?.minimumDistance || 0,
    maximumDistance: rateCard?.maximumDistance || 0,
    perKmRate: rateCard?.perKmRate || 0,
    maxWeight: rateCard?.maxWeight || 0,
    minWeight: rateCard?.minWeight || 0,
    weightSurcharge: rateCard?.weightSurcharge || 0,
    serviceStates: rateCard?.serviceStates || [],
    isActive: rateCard?.isActive ?? true,
  });

  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    setSuccessMessage('');
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? Number(value) : value,
    }));
  };

  const toggleState = (state: string) => {
    setSuccessMessage('');
    setFormData(prev => ({
      ...prev,
      serviceStates: prev.serviceStates.includes(state)
        ? prev.serviceStates.filter(s => s !== state)
        : [...prev.serviceStates, state],
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.baseRate <= 0) {
      newErrors.baseRate = 'Base rate must be greater than 0';
    }

    if (formData.minimumDistance < 0) {
      newErrors.minimumDistance = 'Min distance cannot be negative';
    }

    if (formData.maximumDistance <= formData.minimumDistance) {
      newErrors.maximumDistance = 'Max distance must be greater than min distance';
    }

    if (formData.maxWeight <= formData.minWeight) {
      newErrors.maxWeight = 'Max weight must be greater than base weight';
    }

    if (formData.perKmRate < 0) {
      newErrors.perKmRate = 'Per KM rate cannot be negative';
    }

    if (formData.weightSurcharge < 0) {
      newErrors.weightSurcharge = 'Weight surcharge cannot be negative';
    }

    if (formData.serviceStates.length === 0) {
      newErrors.serviceStates = 'Select at least one state';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ ...formData, businessId });
      setSuccessMessage(rateCard ? 'Rate card updated successfully' : 'Rate card created successfully');
      toast({
        title: 'Success',
        description: rateCard ? 'Rate card updated successfully' : 'Rate card created successfully',
        type: 'success',
      });
    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to save rate card';
      toast({
        title: 'Error',
        description: errorMsg,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-sm font-medium text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Basic Information Section */}
      <div className="border-b pb-6">
        <h3 className="text-base font-semibold text-foreground mb-4">Basic Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Rate Card Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Standard Delivery"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
              errors.name 
                ? 'border-red-300 focus:ring-red-200' 
                : 'border-border focus:ring-accent'
            }`}
            disabled={isLoading || saving}
          />
          {errors.name && (
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-xs text-red-600">{errors.name}</p>
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-foreground mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe this rate card and its features..."
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            rows={3}
            disabled={isLoading || saving}
          />
        </div>
      </div>

      {/* Pricing Section */}
      <div className="border-b pb-6">
        <h3 className="text-base font-semibold text-foreground mb-4">Pricing</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Base Rate (PKR) *
            </label>
            <input
              type="number"
              name="baseRate"
              value={formData.baseRate}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.01"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                errors.baseRate 
                  ? 'border-red-300 focus:ring-red-200' 
                  : 'border-border focus:ring-accent'
              }`}
              disabled={isLoading || saving}
            />
            {errors.baseRate && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-xs text-red-600">{errors.baseRate}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Per KM Rate (PKR) *
            </label>
            <input
              type="number"
              name="perKmRate"
              value={formData.perKmRate}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.01"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                errors.perKmRate 
                  ? 'border-red-300 focus:ring-red-200' 
                  : 'border-border focus:ring-accent'
              }`}
              disabled={isLoading || saving}
            />
            {errors.perKmRate && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-xs text-red-600">{errors.perKmRate}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-foreground mb-1">
            Weight Surcharge (PKR/kg)
          </label>
          <input
            type="number"
            name="weightSurcharge"
            value={formData.weightSurcharge}
            onChange={handleChange}
            placeholder="0"
            min="0"
            step="0.01"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
              errors.weightSurcharge 
                ? 'border-red-300 focus:ring-red-200' 
                : 'border-border focus:ring-accent'
            }`}
            disabled={isLoading || saving}
          />
          {errors.weightSurcharge && (
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-xs text-red-600">{errors.weightSurcharge}</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Additional charge per kg over base weight</p>
        </div>
      </div>

      {/* Weight & Distance Section */}
      <div className="border-b pb-6">
        <h3 className="text-base font-semibold text-foreground mb-4">Weight & Distance Limits</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Base Weight (kg) *
            </label>
            <input
              type="number"
              name="minWeight"
              value={formData.minWeight}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              disabled={isLoading || saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Max Weight (kg) *
            </label>
            <input
              type="number"
              name="maxWeight"
              value={formData.maxWeight}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.1"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                errors.maxWeight 
                  ? 'border-red-300 focus:ring-red-200' 
                  : 'border-border focus:ring-accent'
              }`}
              disabled={isLoading || saving}
            />
            {errors.maxWeight && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-xs text-red-600">{errors.maxWeight}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Min Distance (km) *
            </label>
            <input
              type="number"
              name="minimumDistance"
              value={formData.minimumDistance}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.1"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                errors.minimumDistance 
                  ? 'border-red-300 focus:ring-red-200' 
                  : 'border-border focus:ring-accent'
              }`}
              disabled={isLoading || saving}
            />
            {errors.minimumDistance && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-xs text-red-600">{errors.minimumDistance}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Max Distance (km) *
            </label>
            <input
              type="number"
              name="maximumDistance"
              value={formData.maximumDistance}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.1"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                errors.maximumDistance 
                  ? 'border-red-300 focus:ring-red-200' 
                  : 'border-border focus:ring-accent'
              }`}
              disabled={isLoading || saving}
            />
            {errors.maximumDistance && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-xs text-red-600">{errors.maximumDistance}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Areas Section */}
      <div className="border-b pb-6">
        <h3 className="text-base font-semibold text-foreground mb-4">Service States *</h3>
        <p className="text-sm text-muted-foreground mb-3">Select all states where this rate card applies:</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATES.map(state => (
            <button
              key={state}
              type="button"
              onClick={() => toggleState(state)}
              className={`px-3 py-2 rounded-lg border-2 font-medium transition-all ${
                formData.serviceStates.includes(state)
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-background text-foreground hover:bg-secondary/50'
              }`}
              disabled={isLoading || saving}
            >
              {state}
            </button>
          ))}
        </div>

        {errors.serviceStates && (
          <div className="flex items-center gap-1 mt-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-xs text-red-600">{errors.serviceStates}</p>
          </div>
        )}

        {formData.serviceStates.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Serving {formData.serviceStates.length} state{formData.serviceStates.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Status Section */}
      <div className="pb-6">
        <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="rounded border-border w-4 h-4 cursor-pointer"
            disabled={isLoading || saving}
          />
          <label htmlFor="isActive" className="text-sm font-medium text-foreground cursor-pointer flex-1">
            Make this rate card active
          </label>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            formData.isActive 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {formData.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || saving}
        className="w-full px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-base flex items-center justify-center gap-2"
      >
        {saving || isLoading ? (
          <>
            <Loader className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          rateCard ? 'Update Rate Card' : 'Create Rate Card'
        )}
      </button>
    </form>
  );
}
