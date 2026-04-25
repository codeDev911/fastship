'use client';

import React, { useState, useEffect } from 'react';
import { SellerLayout } from '../../../components/SellerLayout';
import { Button } from '@fastship/ui';
import { Card, CardHeader, CardContent } from '@fastship/ui';
import { Alert } from '@fastship/ui';
import { Save, MapPin, AlertCircle, Loader, Trash2, Building2, CreditCard } from 'lucide-react';
import { useToast } from '@fastship/hooks';
import { CurrencySettings } from '@fastship/lib';
import dynamic from 'next/dynamic';
import { secureFetch } from '@fastship/lib';

const WarehouseLocationPicker = dynamic(() => import('../../../components/WarehouseLocationPicker'), {
    ssr: false,
});

interface WarehouseLocation {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  phone:string;
  longitude: number;
}

export default function SellerSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSaveSection, setActiveSaveSection] = useState<string>('');
  const [sellerId, setSellerId] = useState<string>('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const { toast } = useToast();

  // Company Information
  const [companyData, setCompanyData] = useState({
    companyName: '',
    businessType: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    taxId: '',
  });

  // Banking Information
  const [bankingData, setBankingData] = useState({
    bankAccount: '',
    bankName: '',
    accountHolder: '',
  });

  const [warehouseData, setWarehouseData] = useState({
    warehouseName: '',
    warehouseAddress: '',
    warehouseCity: '',
    warehouseState: '',
    warehouseZipCode: '',
    warehousePhone: "",
  });

  const [location, setLocation] = useState<WarehouseLocation | null>(null);

  // Fetch seller data on mount
  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        setIsLoading(true);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const sellerId =  user?.jobId;
        setSellerId(user.jobId);
        
        if (!sellerId) {
          setSaveError('User not found');
          setIsLoading(false);
          return;
        }

        const response = await secureFetch(`/api/sellers/${sellerId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch seller data');
        }

        const data = await response.json();
        const seller = data?.data;
        
        // Load company data
        setCompanyData({
          companyName: seller?.companyName || '',
          businessType: seller?.businessType || '',
          address: seller?.address || '',
          city: seller?.city || '',
          state: seller?.state || '',
          zipCode: seller?.zipCode || '',
          taxId: seller?.taxId || '',
        });

        // Load banking data
        setBankingData({
          bankAccount: seller?.bankAccount || '',
          bankName: seller?.bankName || '',
          accountHolder: seller?.accountHolder || '',
        });

        // Load warehouse data if it exists
        if (seller?.warehouseAddress) {
          setWarehouseData({
            warehouseName: seller?.warehouseName || '',
            warehouseAddress: seller?.warehouseAddress || '',
            warehouseCity: seller?.warehouseCity || '',
            warehouseState: seller?.warehouseState || '',
            warehouseZipCode: seller?.warehouseZipCode || '',
            warehousePhone: seller?.warehousePhone || '',
          });

          setLocation({
            name: seller.warehouseName || 'Warehouse',
            address: seller?.warehouseAddress,
            city: seller?.warehouseCity,
            state: seller?.warehouseState,
            zipCode: seller?.warehouseZipCode,
            latitude: seller?.warehouseLatitude,
            longitude: seller?.warehouseLongitude,
            phone: seller?.warehousePhone
          });
        }
      } catch (error: any) {
        console.error('Error fetching seller data:', error);
        setSaveError(error.message || 'Failed to fetch seller data');
        toast({
          title: 'Error',
          description: error.message || 'Failed to load seller data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSellerData();
  }, [toast]);

  const handleLocationSelected = (selectedLocation: WarehouseLocation) => {
    setLocation(selectedLocation);
    setWarehouseData({
      warehouseName: selectedLocation?.name,
      warehouseAddress: selectedLocation?.address,
      warehouseCity: selectedLocation?.city,
      warehouseState: selectedLocation?.state,
      warehouseZipCode: selectedLocation?.zipCode,
      warehousePhone : selectedLocation?.phone,
    });
    setShowLocationPicker(false);
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({ ...prev, [name]: value }));
  };

  const handleBankingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBankingData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveCompanyInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    setIsSaving(true);
    setActiveSaveSection('company');
    setSaveError('');
    setSaveSuccess('');

    try {
      const response = await secureFetch(`/api/sellers/${user.jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyData.companyName,
          businessType: companyData.businessType,
          address: companyData.address,
          city: companyData.city,
          state: companyData.state,
          zipCode: companyData.zipCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save company information');
      }


      setSaveSuccess('company');
      toast({
        title: 'Success',
        description: 'Company information saved successfully',
      });

      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error saving company info:', error);
      setSaveError(error.message || 'Failed to save company information');
      toast({
        title: 'Error',
        description: error.message || 'Failed to save company information',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setActiveSaveSection('');
    }
  };

  const handleSaveBankingInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    setIsSaving(true);
    setActiveSaveSection('banking');
    setSaveError('');
    setSaveSuccess('');

    try {
      const response = await secureFetch(`/api/sellers/${user.jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankAccount: bankingData.bankAccount,
          bankName: bankingData.bankName,
          accountHolder: bankingData.accountHolder,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save banking information');
      }

      setSaveSuccess('banking');
      toast({
        title: 'Success',
        description: 'Banking information saved successfully',
      });

      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error saving banking info:', error);
      setSaveError(error.message || 'Failed to save banking information');
      toast({
        title: 'Error',
        description: error.message || 'Failed to save banking information',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setActiveSaveSection('');
    }
  };

  const handleClearWarehouse = () => {
    if (confirm('Are you sure you want to remove the warehouse location?')) {
      setLocation(null);
      setWarehouseData({
        warehouseName: '',
        warehouseAddress: '',
        warehouseCity: '',
        warehouseState: '',
        warehousePhone:"",
        warehouseZipCode: '',
      });
    }
  };

  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!location || !location.latitude || !location.longitude) {
      setSaveError('Please select a warehouse location on the map');
      return;
    }

    setIsSaving(true);
    setActiveSaveSection('warehouse');
    setSaveError('');
    setSaveSuccess('');

    try {
      const response = await secureFetch(`/api/sellers/${user.jobId}/warehouse`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouseName: location.name,
          warehouseAddress: location.address,
          warehouseCity: location.city,
          warehouseState: location.state,
          warehouseZipCode: location.zipCode,
          warehouseLatitude: location.latitude,
          warehouseLongitude: location.longitude,
          warehousePhone:location.phone
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save warehouse location');
      }

      setSaveSuccess('warehouse');
      toast({
        title: 'Success',
        description: 'Warehouse location saved successfully',
      });

      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error saving warehouse location:', error);
      setSaveError(error.message || 'Failed to save warehouse location');
      toast({
        title: 'Error',
        description: error.message || 'Failed to save warehouse location',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setActiveSaveSection('');
    }
  };

  const inputStyle = "w-full bg-white rounded-full border border-slate-300 px-6 py-3 text-sm text-slate-700 outline-none focus:border-red-500 transition-all placeholder:text-slate-500";

  return (
    <SellerLayout currentPage="settings" walletBalance={0} currency="PKR">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl text-slate-800 font-semibold">Settings</h1>
          <p className="text-sm text-slate-500">Manage your company, banking, and warehouse information</p>
        </header>

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center min-h-96">
              <div className="flex flex-col items-center gap-4">
                <Loader className="w-8 h-8 animate-spin text-red-600" />
                <p className="text-slate-600">Loading settings...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Global Error */}
            {saveError && (
              <Alert title="Error occurred" type='error'>
                <AlertCircle className="w-4 h-4" />
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{saveError}</p>
                </div>
              </Alert>
            )}

            {/* Company Information Card */}
            <Card>
              <CardHeader className='flex flex-col'>
                <div className="flex gap-2">
                  <Building2 className="w-5 h-5 text-red-600" />
                  <h2 className="text-xl font-semibold text-slate-900">Company Information</h2>
                </div>
                <p className="text-sm text-slate-500 mt-2">
                  Update your company details and business information
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {saveSuccess === 'company' && (
                  <Alert title="Success" type="success">
                    <div>
                      <p className="font-medium">Success</p>
                      <p className="text-sm">Company information saved successfully</p>
                    </div>
                  </Alert>
                )}

                <form onSubmit={handleSaveCompanyInfo} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
                      <input
                        type="text"
                        name="companyName"
                        value={companyData.companyName}
                        onChange={handleCompanyChange}
                        className={inputStyle}
                        placeholder="Your company name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Business Type</label>
                      <select
                        name="businessType"
                        value={companyData.businessType}
                        onChange={handleCompanyChange}
                        className={inputStyle}
                      >
                        <option value="">Select business type</option>
                        <option value="eCommerce">eCommerce</option>
                        <option value="Retail">Retail</option>
                        <option value="Wholesale">Wholesale</option>
                        <option value="Services">Services</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={companyData.address}
                        onChange={handleCompanyChange}
                        className={inputStyle}
                        placeholder="Business address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={companyData.city}
                        onChange={handleCompanyChange}
                        className={inputStyle}
                        placeholder="City"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                      <input
                        type="text"
                        name="state"
                        value={companyData.state}
                        onChange={handleCompanyChange}
                        className={inputStyle}
                        placeholder="State"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Zip Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={companyData.zipCode}
                        onChange={handleCompanyChange}
                        className={inputStyle}
                        placeholder="Zip code"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tax ID</label>
                    <input
                      type="text"
                      name="taxId"
                      value={companyData.taxId}
                      disabled
                      className={inputStyle + " bg-slate-100 cursor-not-allowed"}
                      placeholder="Tax ID (cannot be changed)"
                    />
                    <p className="text-xs text-slate-500 mt-1">Tax ID is locked after verification</p>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full md:w-auto rounded-full"
                      disabled={isSaving && activeSaveSection === 'company'}
                    >
                      {isSaving && activeSaveSection === 'company' ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Company Info
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Banking Information Card */}
            <Card>
              <CardHeader className='flex flex-col'>
                <div className="flex gap-2">
                  <CreditCard className="w-5 h-5 text-red-600" />
                  <h2 className="text-xl font-semibold text-slate-900">Banking Information</h2>
                </div>
                <p className="text-sm text-slate-500 mt-2">
                  Add your banking details for payments and settlements
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {saveSuccess === 'banking' && (
                  <Alert title="Success" type="success">
                    <div>
                      <p className="font-medium">Success</p>
                      <p className="text-sm">Banking information saved successfully</p>
                    </div>
                  </Alert>
                )}

                <form onSubmit={handleSaveBankingInfo} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-900">
                      <span className="font-medium">Note:</span> Your banking information is encrypted and used only for settlements and payouts. We follow PCI compliance standards.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Bank Name</label>
                      <input
                        type="text"
                        name="bankName"
                        value={bankingData.bankName}
                        onChange={handleBankingChange}
                        className={inputStyle}
                        placeholder="e.g., HBL, UBL, MCB"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Account Holder Name</label>
                      <input
                        type="text"
                        name="accountHolder"
                        value={bankingData.accountHolder}
                        onChange={handleBankingChange}
                        className={inputStyle}
                        placeholder="Account holder name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Account Number</label>
                    <input
                      type="password"
                      name="bankAccount"
                      value={bankingData.bankAccount}
                      onChange={handleBankingChange}
                      className={inputStyle}
                      placeholder="Your bank account number (password field)"
                    />
                    <p className="text-xs text-slate-500 mt-1">Account number is displayed as password for security</p>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full md:w-auto rounded-full"
                      disabled={isSaving && activeSaveSection === 'banking'}
                    >
                      {isSaving && activeSaveSection === 'banking' ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Banking Info
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Warehouse Location Card */}
            <Card>
              <CardHeader className='flex flex-col'>
                <div className="flex gap-2">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <h2 className="text-xl font-semibold text-slate-900">Warehouse Location</h2>
                </div>
                <p className="text-sm text-slate-500 mt-2">
                  Set your warehouse location. This will be used as the pickup location for new shipments.
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {saveSuccess === 'warehouse' && (
                  <Alert title="Success" type="success">
                    <div>
                      <p className="font-medium">Success</p>
                      <p className="text-sm">Warehouse location saved successfully</p>
                    </div>
                  </Alert>
                )}

                <form onSubmit={handleSaveWarehouse} className="space-y-6">
                  {/* Current Warehouse Status */}
                  {location ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-900 mb-3">Current Warehouse Location</p>
                      <div className="space-y-2 text-sm text-blue-800">
                        <p><span className="font-medium">Name:</span> {location.name}</p>
                        <p><span className="font-medium">Phone:</span> {location.phone}</p>
                        <p><span className="font-medium">Address:</span> {location.address}</p>
                        <p><span className="font-medium">City:</span> {location.city}</p>
                        <p><span className="font-medium">State:</span> {location.state}</p>
                        <p><span className="font-medium">Zip Code:</span> {location.zipCode}</p>
                        <p className="text-xs text-blue-700 mt-2">
                          Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        No warehouse location set yet. Click the button below to add one.
                      </p>
                    </div>
                  )}

                  {/* Location Picker Modal */}
                  {showLocationPicker && (
                    <div className="border-t border-slate-200 pt-6">
                      <WarehouseLocationPicker
                        onLocationSelected={handleLocationSelected}
                        onCancel={() => setShowLocationPicker(false)}
                        initialLocation={location}
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    {!showLocationPicker ? (
                      <>
                        <Button
                          type="button"
                          onClick={() => setShowLocationPicker(true)}
                          variant="outline"
                          className="flex-1 rounded-full"
                          disabled={isSaving && activeSaveSection === 'warehouse'}
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          {location ? 'Update Location' : 'Set Location'}
                        </Button>
                        {location && (
                          <>
                            <Button
                              type="submit"
                              variant="primary"
                              className="flex-1 rounded-full"
                              disabled={isSaving && activeSaveSection === 'warehouse'}
                            >
                              {isSaving && activeSaveSection === 'warehouse' ? (
                                <>
                                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4 mr-2" />
                                  Save Warehouse
                                </>
                              )}
                            </Button>
                            <Button
                              type="button"
                              onClick={handleClearWarehouse}
                              variant="destructive"
                              className="rounded-full"
                              disabled={isSaving && activeSaveSection === 'warehouse'}
                            >
                              <Trash2 className="w-4 h-4 text-white" />
                            </Button>
                          </>
                        )}
                      </>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => setShowLocationPicker(false)}
                        variant="secondary"
                        className="w-full rounded-full"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Currency Preferences */}
            <CurrencySettings
              userType="seller"
              compact={false}
            />
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
