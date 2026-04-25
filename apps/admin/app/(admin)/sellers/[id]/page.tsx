'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@fastship/ui';
import { Button } from '@fastship/ui';
import {
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  Building2,
  MapPin,
  Warehouse,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Star,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Truck,
} from 'lucide-react';
import { secureFetch } from '@fastship/lib';

interface SellerDetail {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    createdAt: string;
  };
  companyName: string;
  businessType: string;
  taxId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bankAccount?: string;
  bankName?: string;
  accountHolder?: string;
  warehouseName?: string;
  warehouseAddress?: string;
  warehouseCity?: string;
  warehouseState?: string;
  warehouseZipCode?: string;
  warehouseLatitude?: number;
  warehouseLongitude?: number;
  warehousePhone?: string;
  rating: number;
  totalOrders: number;
  cancelledOrders: number;
  isVerified: boolean;
  createdAt: string;
  wallet?: {
    id: string;
    balance: number;
    totalEarnings: number;
    totalWithdrawals: number;
  };
  shipments: Array<{
    id: string;
    status: string;
    distance: number;
    actualRate: number;
    createdAt: string;
  }>;
  disputes: Array<{
    id: string;
    reason: string;
    status: string;
    amount: number;
    createdAt: string;
  }>;
}

export default function SellerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sellerId = params.id as string;

  const [seller, setSeller] = useState<SellerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'shipments' | 'disputes' | 'financial'>('overview');

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        setIsLoading(true);
        const response = await secureFetch(`/api/admin/sellers/${sellerId}`);
        if (response.ok) {
          const { data } = await response.json();
          setSeller(data);
        } else {
          setError('Failed to fetch seller details');
        }
      } catch (err) {
        console.error('Error fetching seller:', err);
        setError('Failed to load seller details');
      } finally {
        setIsLoading(false);
      }
    };

    if (sellerId) {
      fetchSeller();
    }
  }, [sellerId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sellers
        </button>
        <div className="flex justify-center py-12">
          <AlertCircle className="w-8 h-8 animate-spin text-red-600" />
        </div>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sellers
        </button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-red-600" />
            <p className="text-lg font-semibold text-slate-900">{error || 'Seller not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cancelRate = seller.totalOrders > 0
    ? ((seller.cancelledOrders / seller.totalOrders) * 100)?.toFixed(1)
    : 0;
  
  const totalRevenue = seller.shipments.reduce((sum, s) => sum + (s.codAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sellers
        </button>
        <div className="flex gap-2">
          <Button
            variant={seller.isVerified ? 'outline' : 'primary'}
            className="text-sm"
            onClick={() => {}}
          >
            {seller.isVerified ? 'Verified' : 'Pending Verification'}
          </Button>
        </div>
      </div>

      {/* Seller Info Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{seller.companyName}</h1>
              <p className="text-slate-500 mt-1">Seller ID: {seller.id}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold text-slate-900">{seller.rating?.toFixed(1)}</span>
              </div>
              <p className="text-sm text-slate-500">Rating</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Total Orders</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{seller.totalOrders}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Success Rate</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{(100 - parseFloat(cancelRate as string))?.toFixed(1)}%</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">$ {totalRevenue?.toFixed(2)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Wallet Balance</p>
              <p className="text-2xl font-bold text-green-600 mt-1">$ {(seller.wallet?.balance || 0)?.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Company & Contact Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader title="Company Information" />
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Business Type</p>
                <p className="text-sm text-slate-900 mt-1">{seller.businessType}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Tax ID</p>
                <p className="text-sm text-slate-900 font-mono mt-1">{seller.taxId}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs font-medium text-slate-500 uppercase">Verification Status</p>
                <p className={`text-sm font-medium mt-1 ${
                  seller.isVerified ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {seller.isVerified ? '✓ Verified' : '⏳ Pending'}
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
                  <p className="text-sm text-slate-900">{seller.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Phone</p>
                  <p className="text-sm text-slate-900">{seller.user.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Contact Person</p>
                  <p className="text-sm text-slate-900">{seller.user.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registered Address */}
          <Card>
            <CardHeader title="Registered Address" />
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{seller.address}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {seller.city}, {seller.state} {seller.zipCode}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Information */}
          <Card>
            <CardHeader title="Bank Information" />
            <CardContent className="space-y-4">
              {seller.bankAccount ? (
                <>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Bank Name</p>
                    <p className="text-sm text-slate-900 mt-1">{seller.bankName || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Account Holder</p>
                    <p className="text-sm text-slate-900 mt-1">{seller.accountHolder || 'Not provided'}</p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-xs font-medium text-slate-500 uppercase">Account Number</p>
                    <p className="text-sm text-slate-900 font-mono mt-1">****{seller.bankAccount.slice(-4)}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">No bank information provided</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Financial & Warehouse */}
        <div className="lg:col-span-1 space-y-6">
          {/* Wallet & Financial */}
          <Card>
            <CardHeader title="Financial Overview" />
            <CardContent className="space-y-4">
              {seller.wallet && (
                <>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-slate-500 uppercase">Available Balance</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">$ {Number(seller.wallet?.balance-seller.wallet?.escrowBalance)?.toFixed(2)}</p>
                  </div>
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-yellow-600">Escrow (locked)</span>
                      <span className="font-medium text-yellow-600">$ {seller.wallet.escrowBalance?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Total Earnings</span>
                      <span className="font-medium text-slate-900">$ {seller.wallet.totalEarnings?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Total Withdrawals</span>
                      <span className="font-medium text-slate-900">$ {seller.wallet.totalWithdrawals?.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <Card>
            <CardHeader title="Performance" />
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-2">Cancel Rate</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${cancelRate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-slate-900">{cancelRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warehouse Information */}
          {seller.warehouseName && (
            <Card>
              <CardHeader title="Warehouse Information" />
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Warehouse Name</p>
                  <p className="text-sm text-slate-900 mt-1">{seller.warehouseName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Phone</p>
                  <p className="text-sm text-slate-900 mt-1">{seller.warehousePhone || 'N/A'}</p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-xs font-medium text-slate-500 uppercase">Address</p>
                  <p className="text-sm text-slate-900 mt-1">
                    {seller.warehouseAddress}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {seller.warehouseCity}, {seller.warehouseState} {seller.warehouseZipCode}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Timeline */}
          <Card>
            <CardHeader title="Account Timeline" />
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Account Created</p>
                <p className="text-sm text-slate-900 mt-1">
                  {new Date(seller.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs font-medium text-slate-500 uppercase">Member For</p>
                <p className="text-sm text-slate-900 mt-1">
                  {Math.floor((new Date().getTime() - new Date(seller.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Orders & Disputes */}
        <div className="lg:col-span-1 space-y-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader title="Recent Shipments" />
            <CardContent>
              {seller.shipments.length === 0 ? (
                <p className="text-sm text-slate-500">No shipments yet</p>
              ) : (
                <div className="space-y-3">
                  {seller.shipments.map((shipment) => (
                    <div key={shipment.id} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-mono text-slate-900">{shipment.id.slice(0, 12)}...</p>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          shipment.status === 'DELIVERED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {shipment.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">{shipment.distance?.toFixed(1)} km</p>
                        <p className="text-xs font-medium text-slate-900">$ {shipment.actualRate?.toFixed(2)}</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(shipment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Disputes */}
          <Card>
            <CardHeader title="Recent Disputes" />
            <CardContent>
              {seller.disputes.length === 0 ? (
                <p className="text-sm text-slate-500">No disputes reported</p>
              ) : (
                <div className="space-y-3">
                  {seller.disputes.map((dispute) => (
                    <div key={dispute.id} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-slate-900">{dispute.reason}</p>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          dispute.status === 'RESOLVED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {dispute.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                          {new Date(dispute.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs font-medium text-red-600">$ {dispute.amount?.toFixed(2)}</p>
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
