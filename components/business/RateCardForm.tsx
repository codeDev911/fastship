"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../shared/Button";

// --- Mock UI Components ---
// Replace these with imports from your actual UI library (e.g., shadcn/ui, MUI, or your custom components)
const Card = ({ children }:any) => (
  <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
    {children}
  </div>
);

const CardHeader = ({ title }:any) => (
  <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4">
    <h3 className="font-semibold text-gray-900">{title}</h3>
  </div>
);

const CardContent = ({ children, className }:any) => (
  <div className={className}>{children}</div>
);

  

export default function RateCardForm({rateCard}:any) {
  // 1. Initialize State
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(rateCard||{
    name: "",
    businessId:"",
    description: "",
    baseRate: 0,
    perKmRate: 0,
    minimumDistance: 0,
    maximumDistance: 0,
    minWeight: 0,
    maxWeight: 0,
  });

  // 2. Handle Input Changes
  const handleInputChange = (e:any) => {
    const { name, value } = e.target;
    setFormData((prev:any) => ({
      ...prev,
      [name]: Number(value) || value, // Convert to number if possible
    }));
  };

  useEffect(()=>{
     const user = JSON.parse(localStorage.getItem('user') || '{}');
    const businessId = user?.jobId;
    setFormData({...formData, businessId });
  },[])

  // 3. Handle Form Submission
  const handleSave = async () => {
    setIsSaving(true);
   
    try {
      // Simulate an API request (replace with your actual fetch/axios call)
      await fetch("/api/rate-cards", {
        method: rateCard ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      // Optional: Redirect user or clear form here
    } catch (error) {
      console.error("Failed to save rate card:", error);
      alert("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  

  // 4. Render the UI
  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Rate Card Management</h1>
        <p className="text-sm text-gray-500">Configure your delivery pricing and constraints.</p>
      </div>

      <form onSubmit={(e)=>{
        e.preventDefault()
        handleSave()
      }} className="space-y-6">
        {/* Header Section */}
        <Card>
          <CardHeader title="Create New Card" />
          <CardContent className="space-y-4 p-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Card Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Standard Delivery"
                className="w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of this card..."
                rows={2}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Rates Section */}
        <Card>
          <CardHeader title="Pricing Details" />
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Base Rate
                </label>
                <input
                  type="number"
                  name="baseRate"
                  value={formData.baseRate}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Per KM Rate
                </label>
                <input
                  type="number"
                  name="perKmRate"
                  value={formData.perKmRate}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distance Constraints Section */}
        <Card>
          <CardHeader title="Distance Constraints" />
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Minimum Distance (km)
                </label>
                <input
                  type="number"
                  name="minimumDistance"
                  value={formData.minimumDistance}
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                  className="w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Maximum Distance (km)
                </label>
                <input
                  type="number"
                  name="maximumDistance"
                  value={formData.maximumDistance}
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                  className="w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weight Constraints Section */}
        <Card>
          <CardHeader title="Weight Constraints" />
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Minimum Weight (kg)
                </label>
                <input
                  type="number"
                  name="minWeight"
                  value={formData.minWeight}
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                  className="w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Maximum Weight (kg)
                </label>
                <input
                  type="number"
                  name="maxWeight"
                  value={formData.maxWeight}
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                  className="w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="pt-4">
          <Button onClick={handleSave}  variant="primary" fullWidth isLoading={isSaving}>
            Save Rate Card
          </Button>
        </div>
      </form>
    </div>
  );
}