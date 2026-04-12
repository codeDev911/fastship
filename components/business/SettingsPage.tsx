'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Alert } from '@/components/shared/Alert';
import { Save, Mail, Phone, MapPin, Building } from 'lucide-react';

interface SettingsPageProps {
  isLoading?: boolean;
  onSave?: (data: any) => void;
}

export function SettingsPage({ isLoading = false, onSave }: SettingsPageProps) {
  const [formData, setFormData] = useState({
    businessName: 'FastShip Express',
    email: 'contact@fastship.com',
    phone: '+1-555-0123',
    address: '123 Business St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    deliveryUpdates: true,
    paymentAlerts: true,
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (key: string) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSaveSuccess(true);
    onSave?.({ formData, notifications });
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your business profile and preferences
        </p>
      </div>

      {saveSuccess && (
        <Alert
          type="success"
          title="Settings saved successfully"
          onClose={() => setSaveSuccess(false)}
        />
      )}

      {/* Business Information */}
      <Card>
        <CardHeader title="Business Information" description="Update your business details" />
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Business Name</label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
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

      {/* Notification Preferences */}
      <Card>
        <CardHeader
          title="Notification Preferences"
          description="Choose how you want to receive updates"
        />
        <CardContent className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {key === 'emailNotifications' && 'Get updates via email'}
                  {key === 'smsNotifications' && 'Get updates via SMS'}
                  {key === 'deliveryUpdates' && 'Notifications about deliveries'}
                  {key === 'paymentAlerts' && 'Alerts about payments and transactions'}
                </p>
              </div>
              <button
                onClick={() => handleNotificationChange(key)}
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

      {/* Danger Zone */}
      <Card>
        <CardHeader title="Danger Zone" description="Irreversible actions" />
        <CardContent className="space-y-3">
          <Button variant="destructive" fullWidth>
            Deactivate Business Account
          </Button>
          <p className="text-xs text-muted-foreground">
            This will permanently deactivate your business account and all associated data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
