'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@fastship/ui';
import {
  ArrowLeft,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { secureFetch } from '@fastship/lib';

interface ShipmentDetail {
  id: string;
  sellerId: string;
  businessId?: string;
  pickupName: string;
  pickupPhone: string;
  pickupAddress: string;
  pickupCity: string;
  pickupState: string;
  pickupZipCode: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryZipCode: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  weight: number;
  distance?: number;
  dimensions?: string;
  packageType: string;
  isInCityDelivery: boolean;
  description: string;
  paymentMethod: string;
  codAmount?: number;
  expectedRate?: number;
  actualRate?: number;
  status: string;
  priority: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  seller: {
    id: string;
    companyName: string;
    user: {
      name: string;
      email: string;
      phone: string;
    };
  };
  assignment?: {
    id: string;
    driverId: string;
    businessId: string;
    assignedAt: string;
    pickupCompletedAt?: string;
    deliveryCompletedAt?: string;
    assignmentStatus: string;
    notes?: string;
    driver: {
      id: string;
      user: {
        name: string;
        phone: string;
      };
      vehicleType: string;
      vehicleNumber: string;
    };
    business: {
      id: string;
      companyName: string;
    };
  };
  payment?: {
    id: string;
    amount: number;
    tax: number;
    commission: number;
    driverPayable: number;
    paymentMethod: string;
    paymentStatus: string;
    paidAt?: string;
    createdAt: string;
  };
  tracking?: {
    id: string;
    currentStatus: string;
    currentLocation?: string;
    latitude?: number;
    longitude?: number;
    estimatedDelivery?: string;
    actualDelivery?: string;
  };
  activities: Array<{
    id: string;
    status: string;
    description: string;
    location?: string;
    createdAt: string;
  }>;
  disputes: Array<{
    id: string;
    reason: string;
    status: string;
    amount: number;
    description?: string;
    createdAt: string;
  }>;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  PICKUP: 'bg-purple-100 text-purple-700',
  PICKED_UP: 'bg-indigo-100 text-indigo-700',
  IN_TRANSIT: 'bg-cyan-100 text-cyan-700',
  DELIVERED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-700',
};

const paymentStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-slate-100 text-slate-700',
};

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shipmentId = params.id as string;

  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tracking' | 'financial' | 'activity' | 'assignment'>('overview');

  useEffect(() => {
    const fetchShipment = async () => {
      try {
        setIsLoading(true);
        const response = await secureFetch(`/api/admin/shipments/${shipmentId}`);
        if (response.ok) {
          const { data } = await response.json();
          setShipment(data);
        } else {
          setError('Failed to fetch shipment details');
        }
      } catch (err) {
        console.error('Error fetching shipment:', err);
        setError('Failed to load shipment details');
      } finally {
        setIsLoading(false);
      }
    };

    if (shipmentId) {
      fetchShipment();
    }
  }, [shipmentId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shipments
        </button>
        <div className="flex justify-center py-12">
          <AlertCircle className="w-8 h-8 animate-spin text-red-600" />
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shipments
        </button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-red-600" />
            <p className="text-lg font-semibold text-slate-900">{error || 'Shipment not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isDelivered = shipment.status === 'DELIVERED';
  const isAssigned = !!shipment.assignment;
  const hasDisputes = shipment.disputes.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shipments
        </button>
        <div className="flex gap-2">
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColors[shipment.status]}`}>
            {shipment.status}
          </span>
          {shipment.priority && (
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${
              shipment.priority === 'URGENT' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {shipment.priority}
            </span>
          )}
        </div>
      </div>

      {/* Shipment Info Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Shipment Details</h1>
              <p className="text-slate-500 mt-1">ID: {shipment.id}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">Rs {shipment.actualRate?.toFixed(0) || '0'}</p>
              <p className="text-sm text-slate-500">Actual Rate</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Distance</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{shipment.distance?.toFixed(1) || 'N/A'} km</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Weight</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{shipment.weight} kg</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">Payment</p>
              <p className={`text-2xl font-bold mt-1 ${
                shipment.payment?.paymentStatus === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {shipment.payment?.paymentStatus || 'N/A'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">In City</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{shipment.isInCityDelivery ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        {(['overview', 'tracking', 'financial', 'activity', 'assignment'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium text-sm transition border-b-2 whitespace-nowrap ${
              activeTab === tab
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pickup Information */}
          <Card>
            <CardHeader title="Pickup Information" />
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{shipment.pickupAddress}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {shipment.pickupCity}, {shipment.pickupState} {shipment.pickupZipCode}
                  </p>
                </div>
              </div>
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Contact</p>
                    <p className="text-sm text-slate-900 mt-1">{shipment.pickupName}</p>
                    <p className="text-sm text-slate-900">{shipment.pickupPhone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader title="Delivery Information" />
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{shipment.deliveryAddress}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {shipment.deliveryCity}, {shipment.deliveryState} {shipment.deliveryZipCode}
                  </p>
                </div>
              </div>
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Contact</p>
                    <p className="text-sm text-slate-900 mt-1">{shipment.deliveryName}</p>
                    <p className="text-sm text-slate-900">{shipment.deliveryPhone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package Information */}
          <Card>
            <CardHeader title="Package Information" />
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Type</p>
                <p className="text-sm text-slate-900 mt-1">{shipment.packageType}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Description</p>
                <p className="text-sm text-slate-900 mt-1">{shipment.description}</p>
              </div>
              {shipment.dimensions && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Dimensions</p>
                  <p className="text-sm text-slate-900 mt-1">{shipment.dimensions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seller Information */}
          <Card>
            <CardHeader title="Seller Information" />
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Company</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">{shipment.seller.companyName}</p>
              </div>
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Email</p>
                    <p className="text-sm text-slate-900 mt-1">{shipment.seller.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Phone</p>
                    <p className="text-sm text-slate-900 mt-1">{shipment.seller.user.phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'tracking' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tracking Information */}
          {shipment.tracking ? (
            <Card>
              <CardHeader title="Current Tracking Status" />
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Status</p>
                  <p className="text-sm text-slate-900 mt-1">{shipment.tracking.currentStatus}</p>
                </div>
                {shipment.tracking.currentLocation && (
                  <div className="border-t pt-4">
                    <p className="text-xs font-medium text-slate-500 uppercase">Current Location</p>
                    <p className="text-sm text-slate-900 mt-1">{shipment.tracking.currentLocation}</p>
                  </div>
                )}
                {shipment.tracking.estimatedDelivery && (
                  <div className="border-t pt-4">
                    <p className="text-xs font-medium text-slate-500 uppercase">Estimated Delivery</p>
                    <p className="text-sm text-slate-900 mt-1">
                      {new Date(shipment.tracking.estimatedDelivery).toLocaleString()}
                    </p>
                  </div>
                )}
                {shipment.tracking.actualDelivery && (
                  <div className="border-t pt-4">
                    <p className="text-xs font-medium text-slate-500 uppercase">Actual Delivery</p>
                    <p className="text-sm text-slate-900 mt-1">
                      {new Date(shipment.tracking.actualDelivery).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No tracking information available</p>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader title="Timeline" />
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-500 uppercase">Created</p>
                  <p className="text-sm text-slate-900 mt-1">
                    {new Date(shipment.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {shipment.pickedUpAt && (
                <div className="flex items-center gap-3 border-t pt-4">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-500 uppercase">Picked Up</p>
                    <p className="text-sm text-slate-900 mt-1">
                      {new Date(shipment.pickedUpAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              {shipment.deliveredAt && (
                <div className="flex items-center gap-3 border-t pt-4">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-500 uppercase">Delivered</p>
                    <p className="text-sm text-slate-900 mt-1">
                      {new Date(shipment.deliveredAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'financial' && (
        <Card>
          <CardHeader title="Financial Information" />
          <CardContent>
            {shipment.payment ? (
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase">Total Amount</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">Rs {shipment.payment.amount.toFixed(0)}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <p className="text-xs font-medium text-slate-500 uppercase mb-2">Tax</p>
                    <p className="text-2xl font-bold text-slate-900">Rs {shipment.payment.tax.toFixed(0)}</p>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <p className="text-xs font-medium text-slate-500 uppercase mb-2">Commission</p>
                    <p className="text-2xl font-bold text-slate-900">Rs {shipment.payment.commission.toFixed(0)}</p>
                  </div>
                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <p className="text-xs font-medium text-slate-500 uppercase mb-2">Driver Payable</p>
                    <p className="text-2xl font-bold text-blue-600">Rs {shipment.payment.driverPayable.toFixed(0)}</p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-3">Payment Details</p>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm text-slate-600">Payment Method</span>
                      <span className="font-medium text-slate-900">{shipment.payment.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm text-slate-600">Payment Status</span>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                        paymentStatusColors[shipment.payment.paymentStatus] || 'bg-slate-100 text-slate-700'
                      }`}>
                        {shipment.payment.paymentStatus}
                      </span>
                    </div>
                    {shipment.payment.paidAt && (
                      <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-600">Paid At</span>
                        <span className="text-sm text-slate-900">
                          {new Date(shipment.payment.paidAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No payment information available</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'activity' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Timeline */}
          <Card>
            <CardHeader title={`Activity History (${shipment.activities.length})`} />
            <CardContent>
              {shipment.activities.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">No activity recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shipment.activities.map((activity) => (
                    <div key={activity.id} className="pb-3 border-b last:border-b-0">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">{activity.status}</p>
                          <p className="text-xs text-slate-500 mt-1">{activity.description}</p>
                          {activity.location && (
                            <p className="text-xs text-slate-500">{activity.location}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Disputes */}
          {shipment.disputes.length > 0 && (
            <Card>
              <CardHeader title={`Disputes (${shipment.disputes.length})`} />
              <CardContent>
                <div className="space-y-3">
                  {shipment.disputes.map((dispute) => (
                    <div key={dispute.id} className="p-3 border border-red-200 bg-red-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-900">{dispute.reason}</p>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          dispute.status === 'RESOLVED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {dispute.status}
                        </span>
                      </div>
                      {dispute.description && (
                        <p className="text-xs text-slate-600 mb-2">{dispute.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                          {new Date(dispute.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs font-medium text-red-600">Rs {dispute.amount.toFixed(0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {shipment.disputes.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <CheckCircle2 className="w-8 h-8 text-green-300 mx-auto mb-2" />
                <p className="text-slate-500">No disputes for this shipment</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'assignment' && (
        <Card>
          <CardHeader title="Driver Assignment" />
          <CardContent>
            {shipment.assignment ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase mb-4">Driver Information</p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase">Name</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">{shipment.assignment.driver.user.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase">Phone</p>
                      <p className="text-sm text-slate-900 mt-1">{shipment.assignment.driver.user.phone}</p>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-xs font-medium text-slate-500 uppercase">Vehicle</p>
                      <p className="text-sm text-slate-900 mt-1">{shipment.assignment.driver.vehicleType}</p>
                      <p className="text-xs text-slate-500 font-mono mt-1">{shipment.assignment.driver.vehicleNumber}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase mb-4">Assignment Details</p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase">Business</p>
                      <p className="text-sm text-slate-900 mt-1">{shipment.assignment.business.companyName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase">Status</p>
                      <p className={`text-sm font-medium mt-1 ${
                        shipment.assignment.assignmentStatus === 'COMPLETED'
                          ? 'text-green-600'
                          : 'text-blue-600'
                      }`}>
                        {shipment.assignment.assignmentStatus}
                      </p>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-xs font-medium text-slate-500 uppercase">Assigned At</p>
                      <p className="text-sm text-slate-900 mt-1">
                        {new Date(shipment.assignment.assignedAt).toLocaleString()}
                      </p>
                    </div>
                    {shipment.assignment.pickupCompletedAt && (
                      <div className="border-t pt-4">
                        <p className="text-xs font-medium text-slate-500 uppercase">Pickup Completed</p>
                        <p className="text-sm text-slate-900 mt-1">
                          {new Date(shipment.assignment.pickupCompletedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {shipment.assignment.deliveryCompletedAt && (
                      <div className="border-t pt-4">
                        <p className="text-xs font-medium text-slate-500 uppercase">Delivery Completed</p>
                        <p className="text-sm text-slate-900 mt-1">
                          {new Date(shipment.assignment.deliveryCompletedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-slate-600 font-medium">Not yet assigned to a driver</p>
                <p className="text-xs text-slate-500 mt-1">This shipment is waiting to be assigned</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
