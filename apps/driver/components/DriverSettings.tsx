'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@fastship/ui';
import { Button } from '@fastship/ui';
import { Alert } from '@fastship/ui';
import { Save, Mail, Phone, Lock, MapPin, Truck } from 'lucide-react';
import { CurrencySettings } from '@fastship/lib';

interface DriverSettingsProps {
  isLoading?: boolean;
  onSave?: (data: any) => void;
}

export function DriverSettings({ isLoading = false, onSave }: DriverSettingsProps) {
  const [formData, setFormData] = useState({
    name: 'Sarah Miller',
    email: 'sarah@example.com',
    phone: '+1-555-0101',
    address: '456 Driver St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    licenseNumber: 'DL123456',
    vehicleType: 'Van',
    licensePlate: 'NY-1234',
    vehicleColor: 'White',
  });

  const [preferences, setPreferences] = useState({
    allowNotifications: true,
    emailReceipts: true,
    smsAlerts: false,
    dataCollection: true,
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePreferenceChange = (key: string) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSaveSuccess(true);
    onSave?.({ formData, preferences });
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile and account preferences
        </p>
      </div>

      {saveSuccess && (
        <Alert
          type="success"
          title="Settings saved successfully"
          onClose={() => setSaveSuccess(false)}
        />
      )}

      {/* Personal Information */}
      <Card>
        <CardHeader title="Personal Information" description="Update your profile details" />
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-2 w-full rounded-full border border-border bg-white px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-full border border-border bg-white px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" /> Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-full border border-border bg-white px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="mt-2 w-full rounded-full border border-border bg-white px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-full border border-border bg-white px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-full border border-border bg-white px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">ZIP Code</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-full border border-border bg-white px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isLoading}
            icon={<Save className="h-4 w-4" />}
            fullWidth
          >
            Save Changes
          </Button>
        </CardFooter>
      </Card>

      {/* License & Vehicle Information */}
      <Card>
        <CardHeader
          title="License & Vehicle Information"
          description="Keep your driving license and vehicle details up to date"
        />
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Driver License Number</label>
            <input
              type="text"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleInputChange}
              className="mt-2 w-full rounded-full border border-border bg-white px-4 py-2 font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground flex items-center gap-2">
                <Truck className="h-4 w-4" /> Vehicle Type
              </label>
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-full border border-border bg-white px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option>Car</option>
                <option>Van</option>
                <option>Truck</option>
                <option>Motorcycle</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">License Plate</label>
              <input
                type="text"
                name="licensePlate"
                value={formData.licensePlate}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-full border border-border bg-white px-4 py-2 font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Vehicle Color</label>
            <input
              type="text"
              name="vehicleColor"
              value={formData.vehicleColor}
              onChange={handleInputChange}
              className="mt-2 w-full rounded-full border border-border bg-white px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isLoading}
            icon={<Save className="h-4 w-4" />}
            fullWidth
          >
            Save Changes
          </Button>
        </CardFooter>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader title="Notification Preferences" />
        <CardContent className="space-y-4">
          {Object.entries(preferences).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {key === 'allowNotifications' && 'Enable all notifications'}
                  {key === 'emailReceipts' && 'Receive email receipts for deliveries'}
                  {key === 'smsAlerts' && 'Get SMS alerts for important updates'}
                  {key === 'dataCollection' && 'Allow usage data collection for improvements'}
                </p>
              </div>
              <button
                onClick={() => handlePreferenceChange(key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-accent' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isLoading}
            icon={<Save className="h-4 w-4" />}
            fullWidth
          >
            Save Preferences
          </Button>
        </CardFooter>
      </Card>

      {/* Currency Preferences */}
      <CurrencySettings
        userType="driver"
        compact={false}
      />

      {/* Account Security */}
      <Card>
        <CardHeader title="Account Security" />
        <CardContent className="space-y-3">
          <Button variant="outline" fullWidth icon={<Lock className="h-4 w-4" />}>
            Change Password
          </Button>
          <Button variant="outline" fullWidth>
            Enable Two-Factor Authentication
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
