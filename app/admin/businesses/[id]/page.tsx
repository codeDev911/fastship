'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import {
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  Building2,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Star,
  Shield,
  Truck,
  CreditCard,
  BarChart3,
} from 'lucide-react';
import { da } from 'date-fns/locale';

interface BusinessDetail {
  id: string;
  user: {
    name: string;
    email: string;
    phone: string;
    createdAt: string;
  };
  companyName: string;
  businessType: string;
  operatingRegion: string;
  commissionRate: number;
  insuranceProvider?: string;
  insuranceNumber?: string;
  bankAccount?: string;
  bankName?: string;
  accountHolder?: string;
  rating: number;
  isActive: boolean;
  createdAt: string;
  wallet?: {
    balance: number;
    totalEarnings: number;
    totalWithdrawals: number;
  };
  drivers: Array<{
    id: string;
    driverId: string;
    driver: {
      id: string;
      user: {
        name: string;
      };
    };
    shipmentCount: number;
  }>;
  rateCards: Array<{
    id: string;
    name: string;
    description?: string;
    baseRate: number;
    perKmRate: number;
    minimumDistance: number;
    maximumDistance: number;
    minWeight: number;
    maxWeight: number;
    weightSurcharge: number;
    serviceStates: string[];
    inCityDelivery: boolean;
    serviceCities: string[];
    isActive: boolean;
    createdAt: string;
  }>;
  settlements: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.id as string;

  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'drivers' | 'ratecards' | 'financial'>('overview');
  const [selectedRateCard, setSelectedRateCard] = useState<BusinessDetail['rateCards'][0] | null>(null);
  const [isRateCardModalOpen, setIsRateCardModalOpen] = useState(false);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/businesses/${businessId}`);
        if (response.ok) {
          const { data } = await response.json();
          setBusiness(data);
        } else {
          setError('Failed to fetch business details');
        }
      } catch (err) {
        console.error('Error fetching business:', err);
        setError('Failed to load business details');
      } finally {
        setIsLoading(false);
      }
    };

    if (businessId) {
      fetchBusiness();
    }
  }, [businessId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Businesses
        </button>
        <div className="flex justify-center py-12">
          <AlertCircle className="w-8 h-8 animate-spin text-red-600" />
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Businesses
        </button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-red-600" />
            <p className="text-lg font-semibold text-slate-900">{error || 'Business not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalShipments = business.driverAssignments?.length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Businesses
        </button>
        <div className="flex gap-2">
          <Button
            variant={business.isActive ? 'outline' : 'primary'}
            className="text-sm"
            onClick={() => {}}
          >
            {business.isActive ? 'Active' : 'Inactive'}
          </Button>
        </div>
      </div>

      {/* Business Info Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{business.companyName}</h1>
              <p className="text-slate-500 mt-1">Business ID: {business.id}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold text-slate-900">{business.rating?.toFixed(1)}</span>
              </div>
              <p className="text-sm text-slate-500">Rating</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Active Drivers</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{business.drivers.length}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Total Shipments</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalShipments}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Commission Rate</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{business.commissionRate}%</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Wallet Balance</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                Rs {(business.wallet?.balance || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Company Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Business Information */}
          <Card>
            <CardHeader title="Business Information" />
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Business Type</p>
                <p className="text-sm text-slate-900">{business.businessType}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Operating Region</p>
                <p className="text-sm text-slate-900">{business.operatingRegion}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Business services</p>
                <div className="space-x-1">
                    {business?.serviceAreas?.map((i:any,ind:any)=>(
                        <p className="text-xs text-slate-900">{ind+1}. {i.city}, {i.state} - {i.activeDrivers} - {new Date(i.createdAt).toLocaleDateString("en-US",{
                            day:"numeric",
                            month:"numeric",
                            year:"numeric",
                        })}</p>
                    ))}</div>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs font-medium text-slate-500 uppercase">Account Status</p>
                <p className={`text-sm font-medium mt-1 ${
                  business.isActive ? 'text-green-600' : 'text-slate-600'
                }`}>
                  {business.isActive ? '✓ Active' : '✗ Inactive'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader title="Contact Information" />
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Email</p>
                  <p className="text-sm text-slate-900">{business.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Phone</p>
                  <p className="text-sm text-slate-900">{business.user.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Contact Person</p>
                  <p className="text-sm text-slate-900">{business.user.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Information */}
          <Card>
            <CardHeader title="Bank Information" />
            <CardContent className="space-y-4">
              {business.bankAccount ? (
                <>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Bank Name</p>
                    <p className="text-sm text-slate-900">{business.bankName || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Account Holder</p>
                    <p className="text-sm text-slate-900">{business.accountHolder || 'Not provided'}</p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-xs font-medium text-slate-500 uppercase">Account Number</p>
                    <p className="text-sm text-slate-900 font-mono">****{business.bankAccount.slice(-4)}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">No bank information provided</p>
              )}
            </CardContent>
          </Card>

          {/* Insurance Information */}
          <Card>
            <CardHeader title="Insurance Information" />
            <CardContent className="space-y-4">
              {business.insuranceProvider ? (
                <>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Provider</p>
                    <p className="text-sm text-slate-900">{business.insuranceProvider}</p>
                  </div>
                  {business.insuranceNumber && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase">Policy Number</p>
                      <p className="text-sm text-slate-900 font-mono">{business.insuranceNumber}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500">No insurance information provided</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Financial Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Wallet & Financial */}
          <Card>
            <CardHeader title="Financial Overview" />
            <CardContent className="space-y-4">
              {business.wallet && (
                <>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-slate-500 uppercase">Available Balance</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">Rs {Number(business.wallet.balance - business.wallet.escrowBalance).toFixed(2)}</p>
                  </div>
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-yellow-600">Escrow (locked)</span>
                      <span className="font-medium text-yellow-600">Rs {business.wallet.escrowBalance?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Total Earnings</span>
                      <span className="font-medium text-slate-900">Rs {business.totalEarnings?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Total Withdrawals</span>
                      <span className="font-medium text-slate-900">Rs {business.wallet?.totalWithdrawals?.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Commission & Rates */}
          <Card>
            <CardHeader title="Commission & Rates" />
            <CardContent className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs font-medium text-slate-500 uppercase">Commission Rate</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{business.commissionRate}%</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs font-medium text-slate-500 uppercase mb-3">Active Rate Cards</p>
                {business.rateCards.length === 0 ? (
                  <p className="text-sm text-slate-500">No rate cards configured</p>
                ) : (
                  <div className="space-y-2">
                    {business.rateCards.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => {
                          setSelectedRateCard(card);
                          setIsRateCardModalOpen(true);
                        }}
                        className="w-full flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                      >
                        <span className="text-sm font-medium text-slate-900">{card.name}</span>
                        <span className="text-xs text-slate-600">Rs {card.baseRate} + Rs {card.perKmRate}/km</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Timeline */}
          <Card>
            <CardHeader title="Account Timeline" />
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Account Created</p>
                <p className="text-sm text-slate-900 mt-1">
                  {new Date(business.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs font-medium text-slate-500 uppercase">Member For</p>
                <p className="text-sm text-slate-900 mt-1">
                  {Math.floor((new Date().getTime() - new Date(business.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Drivers & Settlements */}
        <div className="lg:col-span-1 space-y-6">
          {/* Active Drivers */}
          <Card>
            <CardHeader title={`Active Drivers (${business.drivers.length})`} />
            <CardContent>
              {business.drivers.length === 0 ? (
                <p className="text-sm text-slate-500">No drivers assigned</p>
              ) : (
                <div className="space-y-3">
                  {business.drivers.map((assignment) => (
                    <div key={assignment.id} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-slate-900">
                          {assignment.driver.user.name}
                        </p>
                        <span className="text-xs font-medium text-slate-600">
                          {assignment.driver?.shipment?.length || 0} shipments
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono">ID: {assignment.driverId.slice(0, 8)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Settlements */}
          <Card>
            <CardHeader title="Recent Settlements" />
            <CardContent>
              {business.settlements.length === 0 ? (
                <p className="text-sm text-slate-500">No settlements yet</p>
              ) : (
                <div className="space-y-3">
                  {business.settlements.map((settlement) => (
                    <div key={settlement.id} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-slate-900">
                          Rs {settlement.amount.toFixed(2)}
                        </p>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          settlement.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {settlement.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(settlement.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rate Card Details Modal */}
      {isRateCardModalOpen && selectedRateCard && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader title={selectedRateCard.name} />
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Base Fare</p>
                  <p className="text-lg font-bold text-slate-900">Rs {selectedRateCard.baseRate.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Per KM Rate</p>
                  <p className="text-lg font-bold text-slate-900">Rs {selectedRateCard.perKmRate.toFixed(2)}/km</p>
                </div>
              </div>

              {selectedRateCard.description && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Description</p>
                  <p className="text-sm text-slate-700">{selectedRateCard.description}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Distance Limits</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">Minimum Distance</p>
                    <p className="text-sm text-slate-900">{selectedRateCard.minimumDistance} km</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">Maximum Distance</p>
                    <p className="text-sm text-slate-900">{selectedRateCard.maximumDistance} km</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Weight Specifications</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">Min Weight</p>
                    <p className="text-sm text-slate-900">{selectedRateCard.minWeight} kg</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">Max Weight</p>
                    <p className="text-sm text-slate-900">{selectedRateCard.maxWeight} kg</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">Surcharge/kg</p>
                    <p className="text-sm text-slate-900">Rs {selectedRateCard.weightSurcharge.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Service Coverage</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase mb-2">Service States</p>
                    {selectedRateCard.serviceStates.length === 0 ? (
                      <p className="text-xs text-slate-500">No states specified</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedRateCard.serviceStates.map((state) => (
                          <span key={state} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {state}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedRateCard.inCityDelivery && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase mb-2">In-City Service Cities</p>
                      {selectedRateCard.serviceCities.length === 0 ? (
                        <p className="text-xs text-slate-500">No cities specified</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {selectedRateCard.serviceCities.map((city) => (
                            <span key={city} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              {city}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Additional Options</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <span className="text-sm text-slate-700">In-City Delivery Support</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      selectedRateCard.inCityDelivery
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {selectedRateCard.inCityDelivery ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <span className="text-sm text-slate-700">Active Status</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      selectedRateCard.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {selectedRateCard.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Created Date</p>
                <p className="text-sm text-slate-700">{new Date(selectedRateCard.createdAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
            <div className="p-6 border-t flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsRateCardModalOpen(false)}
                className="rounded-full"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
