'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ServiceArea {
  id: string;
  businessId: string;
  state: string;
  city: string;
  activeDrivers: number;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ServiceAreasManagerProps {
  businessId: string;
}

const STATES = [
  'Sindh', 'Punjab', 'KPK', 'Balochistan', 'Gilgit-Baltistan',
  'AJK', 'FATA', 'Islamabad'
];

const CITIES_BY_STATE: Record<string, string[]> = {
  'Sindh': ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana'],
  'Punjab': ['Lahore', 'Faisalabad', 'Multan', 'Gujranwala', 'Sialkot', 'Rawalpindi'],
  'KPK': ['Peshawar', 'Abbottabad', 'Mardan', 'Swat'],
  'Balochistan': ['Quetta', 'Gwadar'],
  'Gilgit-Baltistan': ['Gilgit', 'Skardu'],
  'AJK': ['Muzaffarabad', 'Rawalakot'],
  'FATA': ['Tirah', 'Waziristan'],
  'Islamabad': ['Islamabad']
};

export function ServiceAreasManager({ businessId }: ServiceAreasManagerProps) {
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    state: '',
    city: '',
    activeDrivers: 0,
    capacity: 10,
  });

  // Fetch service areas
  const fetchServiceAreas = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/business/service-areas?businessId=${businessId}`);
      if (!response.ok) throw new Error('Failed to fetch service areas');
      const data = await response.json();
      setServiceAreas(data.serviceAreas.filter((sa: ServiceArea) => sa.isActive));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch service areas',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceAreas();
  }, [businessId, toast]);


  const closeForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ state: '', city: '', activeDrivers: 0, capacity: 10 });
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({ state: '', city: '', activeDrivers: 0, capacity: 10 });
  };

  const handleEditClick = (area: ServiceArea) => {
    setIsAdding(false);
    setEditingId(area.id);
    setFormData({
      state: area.state,
      city: area.city,
      activeDrivers: area.activeDrivers,
      capacity: area.capacity,
    });
  };

  const handleSave = async () => {
    if (!formData.state || !formData.city) {
      toast({
        title: 'Error',
        description: 'Please select both state and city',
      });
      return;
    }

    setSavingId(editingId || 'new');
    try {
      if (editingId) {
        // Update
        const response = await fetch(`/api/business/service-areas/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update service area');
        }

        await fetchServiceAreas();
        setSuccessMessage('Service area updated successfully');
      } else {
        // Create
        const response = await fetch(`/api/business/service-areas?businessId=${businessId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create service area');
        }

        await fetchServiceAreas();
        setSuccessMessage('Service area added successfully');
      }

      toast({
        title: 'Success',
        description: editingId ? 'Service area updated' : 'Service area added',
      });

      setTimeout(() => setSuccessMessage(''), 3000);
      closeForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service area?')) return;

    setSavingId(id);
    try {
      const response = await fetch(`/api/business/service-areas/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete service area');
      }

      await fetchServiceAreas();
      toast({
        title: 'Success',
        description: 'Service area deleted',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
      });
    } finally {
      setSavingId(null);
    }
  };

  const availableCities = formData.state ? CITIES_BY_STATE[formData.state] || [] : [];

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
          <p className="text-sm font-medium text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Add Button */}
      {!isAdding && !editingId && (
        <button
          onClick={handleAddClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-accent rounded-lg hover:bg-accent/5 transition-colors text-accent font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Service Area
        </button>
      )}

      {/* Form */}
      {(isAdding || editingId) && (
        <div className="p-4 bg-secondary/30 rounded-lg border border-border space-y-4">
          <h3 className="font-semibold text-foreground">
            {editingId ? 'Edit Service Area' : 'New Service Area'}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* State Selector */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                State *
              </label>
              <select
                value={formData.state}
                onChange={(e) => {
                  setFormData({ ...formData, state: e.target.value, city: '' });
                }}
                disabled={savingId !== null}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select State</option>
                {STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* City Selector */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                City *
              </label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                disabled={!formData.state || savingId !== null}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              >
                <option value="">Select City</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Active Drivers */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Active Drivers
              </label>
              <input
                type="number"
                value={formData.activeDrivers}
                onChange={(e) => setFormData({ ...formData, activeDrivers: Math.max(0, Number(e.target.value)) })}
                disabled={savingId !== null}
                min="0"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Capacity *
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Math.max(1, Number(e.target.value)) })}
                disabled={savingId !== null}
                min="1"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={savingId !== null}
              className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {savingId !== null ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
            <button
              onClick={closeForm}
              disabled={savingId !== null}
              className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-secondary/50 disabled:opacity-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader className="h-6 w-6 animate-spin text-accent" />
        </div>
      )}

      {/* Service Areas List */}
      {!isLoading && serviceAreas.length > 0 && (
        <div className="space-y-2">
          {serviceAreas.map((area) => (
            <div
              key={area.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">
                    {area.state}, {area.city}
                  </h4>
                  <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>🚗 Drivers: {area.activeDrivers}</span>
                    <span>📦 Capacity: {area.capacity}</span>
                    <span className={`font-medium ${
                      area.activeDrivers >= area.capacity 
                        ? 'text-orange-600' 
                        : 'text-green-600'
                    }`}>
                      {area.activeDrivers >= area.capacity ? '🔴 At Capacity' : '🟢 Available'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditClick(area)}
                    disabled={savingId !== null}
                    className="p-2 hover:bg-blue-50 rounded-lg text-muted-foreground hover:text-blue-600 transition-colors disabled:opacity-50"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(area.id)}
                    disabled={savingId !== null}
                    className="p-2 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {savingId === area.id ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && serviceAreas.length === 0 && !isAdding && !editingId && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No service areas yet. Click "Add Service Area" to get started.</p>
        </div>
      )}
    </div>
  );
}
