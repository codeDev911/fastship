'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@fastship/ui';
import { Button } from '@fastship/ui';
import {
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Truck,
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  TrendingUp,
  AlertTriangle,
  Shield,
} from 'lucide-react';
import { secureFetch } from '@fastship/lib';

interface DriverDetail {
  id: string;
  user: {
    name: string;
    email: string;
    phone: string;
    createdAt: string;
  };
  licenseNumber: string;
  licenseExpiry: string;
  vehicleType: string;
  vehicleNumber: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  status: string;
  isVerified: boolean;
  isActive: boolean;
  rating: number;
  totalDeliveries: number;
  cancelledDeliveries: number;
  totalEarnings: number;
  currentDebt: number;
  currentLocation?: string;
  createdAt: string;
  wallet?: {
    balance: number;
    totalEarnings: number;
    totalWithdrawals: number;
  };
  assignments: Array<{
    id: string;
    shipmentId: string;
    shipment: {
      id: string;
      status: string;
      createdAt: string;
    };
  }>;
  earnings: Array<{
    id: string;
    amount: number;
    shipmentId: string;
    createdAt: string;
  }>;
}

export default function DriverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const driverId = params.id as string;

  const [driver, setDriver] = useState<DriverDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'shipments' | 'financial' | 'account'>('overview');

  useEffect(() => {
    const fetchDriver = async () => {
      try {
        setIsLoading(true);
        const response = await secureFetch(`/api/admin/drivers/${driverId}`);
        if (response.ok) {
          const { data } = await response.json();
          setDriver(data);
        } else {
          setError('Failed to fetch driver details');
        }
      } catch (err) {
        console.error('Error fetching driver:', err);
        setError('Failed to load driver details');
      } finally {
        setIsLoading(false);
      }
    };

    if (driverId) {
      fetchDriver();
    }
  }, [driverId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Drivers
        </button>
        <div className="flex justify-center py-12">
          <AlertCircle className="w-8 h-8 animate-spin text-red-600" />
        </div>
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Drivers
        </button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-red-600" />
            <p className="text-lg font-semibold text-slate-900">{error || 'Driver not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const successRate = driver.totalDeliveries > 0
    ? ((driver.totalDeliveries - driver.cancelledDeliveries) / driver.totalDeliveries * 100)?.toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Drivers
        </button>
        <div className="flex gap-2">
          <Button
            variant={driver.isActive ? 'outline' : 'primary'}
            className="text-sm"
            onClick={() => {}}
          >
            {driver.isActive ? 'Active' : 'Inactive'}
          </Button>
          <Button
            variant={driver.isVerified ? 'outline' : 'primary'}
            className="text-sm"
            onClick={() => {}}
          >
            {driver.isVerified ? 'Verified' : 'Pending Verification'}
          </Button>
        </div>
      </div>

      {/* Driver Info Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{driver.user.name}</h1>
              <p className="text-slate-500 mt-1">Driver ID: {driver.id}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold text-slate-900">{driver.rating?.toFixed(1)}</span>
              </div>
              <p className="text-sm text-slate-500">Rating</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Deliveries</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{driver.totalDeliveries}</p>
              <p className="text-xs text-slate-400 mt-1">Cancelled: {driver.cancelledDeliveries}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Success Rate</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{successRate}%</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Total Earnings</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">$ {driver.totalEarnings?.toFixed(2)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Current Debt</p>
              <p className={`text-2xl font-bold mt-1 ${driver.currentDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                $ {driver.currentDebt?.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal & Vehicle Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader title="Contact Information" />
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Email</p>
                  <p className="text-sm text-slate-900">{driver.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Phone</p>
                  <p className="text-sm text-slate-900">{driver.user.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Location</p>
                  <p className="text-sm text-slate-900">{driver.currentLocation || 'Not available'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <CardHeader title="Vehicle Information" />
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Truck className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Vehicle Type</p>
                  <p className="text-sm text-slate-900">{driver.vehicleType}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Vehicle Number</p>
                <p className="text-sm text-slate-900 font-mono">{driver.vehicleNumber}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs font-medium text-slate-500 uppercase">Insurance</p>
                <p className="text-sm text-slate-900">{driver.insuranceProvider || 'Not provided'}</p>
                {driver.insuranceNumber && (
                  <p className="text-xs text-slate-600 font-mono mt-1">{driver.insuranceNumber}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* License Information */}
          <Card>
            <CardHeader title="License Information" />
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">License Number</p>
                <p className="text-sm text-slate-900 font-mono">{driver.licenseNumber}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Expiry Date</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <p className="text-sm text-slate-900">
                    {new Date(driver.licenseExpiry).toLocaleDateString()}
                  </p>
                </div>
                {new Date(driver.licenseExpiry) < new Date() && (
                  <p className="text-xs text-red-600 mt-2">⚠️ License expired</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Financial Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Wallet Balance */}
          <Card>
            <CardHeader title="Wallet & Balance" />
            <CardContent className="space-y-4">
              {driver.wallet && (
                <>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-slate-500 uppercase">Available Balance</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">$ {driver.wallet.balance?.toFixed(2)}</p>
                  </div>
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Total Earnings</span>
                      <span className="font-medium text-slate-900">$ {driver.wallet.totalEarnings?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Total Withdrawals</span>
                      <span className="font-medium text-slate-900">$ {driver.wallet.totalWithdrawals?.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader title="Account Status" />
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-900">Active Status</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    driver.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {driver.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-900">Verification</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    driver.isVerified
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {driver.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-900">Status</span>
                  <span className="text-xs font-medium text-slate-600">
                    {driver.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader title="Account Timeline" />
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Account Created</p>
                <p className="text-sm text-slate-900 mt-1">
                  {new Date(driver.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs font-medium text-slate-500 uppercase">Member For</p>
                <p className="text-sm text-slate-900 mt-1">
                  {Math.floor((new Date().getTime() - new Date(driver.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity & History */}
        <div className="lg:col-span-1 space-y-6">
          {/* Recent Assignments */}
          <Card>
            <CardHeader title="Recent Assignments" />
            <CardContent>
              {driver.assignments.length === 0 ? (
                <p className="text-sm text-slate-500">No assignments yet</p>
              ) : (
                <div className="space-y-3">
                  {driver.assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-500 uppercase">Shipment</p>
                        <p className="text-sm font-mono text-slate-900">{assignment.shipment.id.slice(0, 12)}...</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(assignment.shipment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        assignment.shipment.status === 'DELIVERED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {assignment.shipment.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Earnings */}
          <Card>
            <CardHeader title="Recent Earnings" />
            <CardContent>
              {driver.earnings.length === 0 ? (
                <p className="text-sm text-slate-500">No earnings yet</p>
              ) : (
                <div className="space-y-3">
                  {driver.earnings.map((earning) => (
                    <div key={earning.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <p className="text-sm font-medium text-slate-900">$ {earning.amount?.toFixed(2)}</p>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(earning.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
