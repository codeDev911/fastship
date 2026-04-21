'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '../shared/Card';
import { Button } from '../shared/Button';
import { Alert } from '../shared/Alert';
import { Save, Mail, Phone, MapPin, Building, AlertCircle, Loader } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { ServiceAreasManager } from '../business/ServiceAreasManager';
import { secureFetch } from '@fastship/lib';

interface SettingsPageProps {
  isLoading?: boolean;
  onSave?: (data: any) => void;
}

export function SettingsPage({ isLoading: externalLoading = false, onSave }: SettingsPageProps) {
  const [userId, setUserId] = useState<string>('');
  const [businessId, setBusinessId] = useState<string>('');
  const [formData, setFormData] = useState({
    companyName: '',
    businessType: '',
    operatingRegion: '',
    commissionRate: 10,
    insuranceProvider: '',
    insuranceNumber: '',
    bankAccount: '',
    bankName: '',
    accountHolder: '',
    isActive: true,
  });

  const [userData, setUserData] = useState({
    email: '',
    name: '',
    phone: '',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    deliveryUpdates: true,
    paymentAlerts: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const { toast } = useToast();

  // Fetch business settings on mount
  useEffect(() => {
    const fetchBusinessSettings = async () => {
      try {
        setIsLoading(true);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const uid = user?.id || user?.userId;
        
        if (!uid) {
          setSaveError('User not found');
          setIsLoading(false);
          return;
        }

        setUserId(uid);

        const response = await secureFetch(`/api/business/settings?userId=${uid}`);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch business settings');
        }

        const data = await response.json();
        setBusinessId(data.business.id);
        setFormData({
          companyName: data.business.companyName || '',
          businessType: data.business.businessType || '',
          operatingRegion: data.business.operatingRegion || '',
          commissionRate: data.business.commissionRate || 10,
          insuranceProvider: data.business.insuranceProvider || '',
          insuranceNumber: data.business.insuranceNumber || '',
          bankAccount: data.business.bankAccount || '',
          bankName: data.business.bankName || '',
          accountHolder: data.business.accountHolder || '',
          isActive: data.business.isActive ?? true,
        });

        if (data.business.user) {
          setUserData({
            email: data.business.user.email || '',
            name: data.business.user.name || '',
            phone: data.business.user.phone || '',
          });
        }
      } catch (error: any) {
        console.error('Error fetching business settings:', error);
        setSaveError(error.message || 'Failed to fetch business settings');
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch business settings',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessSettings();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    setSaveError('');
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? Number(value) : value,
    }));
  };

  const handleNotificationChange = (key: string) => {
    setNotifications((prev) => ({ 
      ...prev, 
      [key as keyof typeof prev]: !prev[key as keyof typeof prev]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.businessType.trim()) {
      newErrors.businessType = 'Business type is required';
    }

    if (!formData.operatingRegion.trim()) {
      newErrors.operatingRegion = 'Operating region is required';
    }

    if (formData.commissionRate < 0 || formData.commissionRate > 100) {
      newErrors.commissionRate = 'Commission rate must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    setSaveError('');
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await secureFetch(`/api/business/settings?userId=${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update business settings');
      }

      setSaveSuccess(true);
      toast({
        title: 'Success',
        description: 'Business settings updated successfully',
      });
      
      onSave?.({ formData, notifications });
      
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to update business settings';
      setSaveError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your business profile and preferences
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 bg-secondary/20 rounded-lg">
          <Loader className="h-6 w-6 animate-spin text-accent" />
          <span className="ml-3 text-muted-foreground">Loading settings...</span>
        </div>
      )}

      {saveError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm font-medium text-red-800">{saveError}</p>
        </div>
      )}

      {saveSuccess && (
        <Alert
          type="success"
          title="Settings saved successfully"
          onClose={() => setSaveSuccess(false)}
        />
      )}

      {!isLoading && (
        <>
          {/* Business Information */}
          <Card>
            <CardHeader title="Business Information" description="Update your business details" />
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Enter your company name"
                  disabled={isSaving}
                  className={`mt-2 w-full rounded-full border bg-white px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                    errors.companyName ? 'border-red-300 focus:ring-red-200' : 'border-border focus:ring-accent'
                  }`}
                />
                {errors.companyName && (
                  <p className="text-xs text-red-600 mt-1">{errors.companyName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Business Type *
                  </label>
                  <input
                    type="text"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    placeholder="e.g., Courier, Logistics"
                    disabled={isSaving}
                    className={`mt-2 w-full rounded-full border bg-white px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                      errors.businessType ? 'border-red-300 focus:ring-red-200' : 'border-border focus:ring-accent'
                    }`}
                  />
                  {errors.businessType && (
                    <p className="text-xs text-red-600 mt-1">{errors.businessType}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Operating Region *
                  </label>
                  <input
                    type="text"
                    name="operatingRegion"
                    value={formData.operatingRegion}
                    onChange={handleInputChange}
                    placeholder="e.g., Karachi, Lahore"
                    disabled={isSaving}
                    className={`mt-2 w-full rounded-full border bg-white px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                      errors.operatingRegion ? 'border-red-300 focus:ring-red-200' : 'border-border focus:ring-accent'
                    }`}
                  />
                  {errors.operatingRegion && (
                    <p className="text-xs text-red-600 mt-1">{errors.operatingRegion}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  Commission Rate (%) *
                </label>
                <input
                  type="number"
                  name="commissionRate"
                  value={formData.commissionRate}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.1"
                  disabled={isSaving}
                  className={`mt-2 w-full rounded-full border bg-white px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                    errors.commissionRate ? 'border-red-300 focus:ring-red-200' : 'border-border focus:ring-accent'
                  }`}
                />
                {errors.commissionRate && (
                  <p className="text-xs text-red-600 mt-1">{errors.commissionRate}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Applied to all transactions</p>
              </div>
            </CardContent>
          </Card>

          {/* User Information */}
          <Card>
            <CardHeader title="User Information" description="Associated account details (read-only)" />
            <CardContent className="space-y-4">
              <div>
                <label className="flex text-sm font-medium text-foreground items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </label>
                <p className="mt-2 px-4 py-2 bg-secondary/30 rounded-full text-foreground">
                  {userData.email}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex text-sm font-medium text-foreground items-center gap-2">
                    <Building className="h-4 w-4" /> Name
                  </label>
                  <p className="mt-2 px-4 py-2 bg-secondary/30 rounded-full text-foreground">
                    {userData.name}
                  </p>
                </div>
                <div>
                  <label className="flex text-sm font-medium text-foreground items-center gap-2">
                    <Phone className="h-4 w-4" /> Phone
                  </label>
                  <p className="mt-2 px-4 py-2 bg-secondary/30 rounded-full text-foreground">
                    {userData.phone}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insurance Information */}
          <Card>
            <CardHeader title="Insurance Information" description="Optional insurance details" />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Insurance Provider
                  </label>
                  <input
                    type="text"
                    name="insuranceProvider"
                    value={formData.insuranceProvider}
                    onChange={handleInputChange}
                    placeholder="e.g., XYZ Insurance"
                    disabled={isSaving}
                    className="mt-2 w-full rounded-full border border-border bg-white px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Insurance Number
                  </label>
                  <input
                    type="text"
                    name="insuranceNumber"
                    value={formData.insuranceNumber}
                    onChange={handleInputChange}
                    placeholder="Policy number"
                    disabled={isSaving}
                    className="mt-2 w-full rounded-full border border-border bg-white px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Information */}
          <Card>
            <CardHeader title="Bank Information" description="For settlements and payments" />
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Bank Account
                </label>
                <input
                  type="text"
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleInputChange}
                  placeholder="Account number"
                  disabled={isSaving}
                  className="mt-2 w-full rounded-full border border-border bg-white px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder="e.g., HBL"
                    disabled={isSaving}
                    className="mt-2 w-full rounded-full border border-border bg-white px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Account Holder
                  </label>
                  <input
                    type="text"
                    name="accountHolder"
                    value={formData.accountHolder}
                    onChange={handleInputChange}
                    placeholder="Name on account"
                    disabled={isSaving}
                    className="mt-2 w-full rounded-full border border-border bg-white px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            </CardContent>
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
                    disabled={isSaving}
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
          </Card>

          {/* Service Areas */}
          <Card>
            <CardHeader
              title="Service Areas"
              description="Manage your operational regions and driver capacity"
            />
            <CardContent>
              <ServiceAreasManager businessId={businessId} />
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={isSaving}
              icon={<Save className="h-4 w-4" />}
              fullWidth
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>

          {/* Status */}
          <Card>
            <CardHeader title="Account Status" description="Current business status" />
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Current Status</p>
                  <p className="text-sm text-muted-foreground">
                    Your business account is currently {formData.isActive ? 'active' : 'inactive'}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-full font-semibold text-sm ${
                  formData.isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {formData.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
