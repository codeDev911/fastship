'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BusinessLayout } from '@fastship/ui';
import { Card, CardHeader, CardContent } from '@fastship/ui';
import { Button } from '@fastship/ui';
import { StatusBadge } from '@fastship/ui';
import { useNotifications } from '@fastship/lib';
import { ArrowLeft, Phone, Mail, Briefcase, FileText, Star, TrendingUp, Calendar, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { secureFetch } from '@fastship/lib';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DriverDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const driverId = params?.id as string;
  const { getUnreadCount } = useNotifications();

  const [driver, setDriver] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = getUnreadCount();

  useEffect(() => {
    const fetchDriverDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch driver details
        const driverRes = await secureFetch(`/api/drivers/${driverId}`);
        if (!driverRes.ok) throw new Error('Failed to fetch driver');
        const driverData = await driverRes.json();
        setDriver(driverData);

        // Fetch driver assignments (recent shipments)
        const assignmentsRes = await secureFetch(`/api/assignments?driverId=${driverId}&limit=10`);
        if (assignmentsRes.ok) {
          const assignmentData = await assignmentsRes.json();
          setAssignments(assignmentData.data || []);
        }

        // Fetch earnings history
        const earningsRes = await secureFetch(`/api/earnings?driverId=${driverId}&limit=30`);
        if (earningsRes.ok) {
          const earningsData = await earningsRes.json();
          setEarnings(earningsData.data || []);
        }

        // Calculate performance data for the last 7 days
        const today = new Date();
        const perfData = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          
          const dayAssignments = assignments.filter(a => {
            const assignedDate = new Date(a.assignedAt);
            return assignedDate.toDateString() === date.toDateString();
          });

          perfData.push({
            day: dayName,
            completed: dayAssignments.filter(a => a.assignmentStatus === 'COMPLETED').length,
            pending: dayAssignments.filter(a => a.assignmentStatus === 'ASSIGNED').length,
            failed: dayAssignments.filter(a => a.assignmentStatus === 'FAILED').length,
          });
        }
        setPerformanceData(perfData);
      } catch (err) {
        console.error('Error fetching driver details:', err);
        setError('Failed to load driver details');
      } finally {
        setIsLoading(false);
      }
    };

    if (driverId) {
      fetchDriverDetails();
    }
  }, [driverId]);

  if (isLoading) {
    return (
      <BusinessLayout currentPage="drivers" unreadNotifications={unreadCount}>
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-600">Loading driver details...</p>
        </div>
      </BusinessLayout>
    );
  }

  if (error || !driver) {
    return (
      <BusinessLayout currentPage="drivers" unreadNotifications={unreadCount}>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-lg font-semibold text-foreground">{error || 'Driver not found'}</p>
            </CardContent>
          </Card>
        </div>
      </BusinessLayout>
    );
  }

  return (
    <BusinessLayout currentPage="drivers" unreadNotifications={unreadCount}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{driver.user?.name || 'Driver'}</h1>
              <p className="mt-1 text-muted-foreground">Driver Details & Performance</p>
            </div>
          </div>
          <StatusBadge status={driver.status} />
        </div>

        {/* Driver Information Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Deliveries</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{driver.totalDeliveries || 0}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="mt-2 text-3xl font-bold text-accent">
                    PKR {(driver.totalEarnings || 0).toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{driver.rating || 0}/5.0</p>
                </div>
                <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cancelled Deliveries</p>
                  <p className="mt-2 text-3xl font-bold text-red-600">{driver.cancelledDeliveries || 0}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Driver Details */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader title="Personal Information" />
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{driver.user?.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{driver.user?.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Joined Date</p>
                  <p className="font-medium text-foreground">
                    {driver.createdAt ? new Date(driver.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <CardHeader title="Vehicle Information" />
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle Type</p>
                  <p className="font-medium text-foreground">{driver.vehicleType || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle Number</p>
                  <p className="font-medium text-foreground">{driver.vehicleNumber || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">License Number</p>
                  <p className="font-mono font-medium text-foreground">{driver.licenseNumber || 'N/A'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">License Expiry</p>
                <p className="font-medium text-foreground">
                  {driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart */}
        {performanceData.length > 0 && (
          <Card>
            <CardHeader title="Weekly Performance"  />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="completed" fill="#10B981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="pending" fill="#FFA500" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="failed" fill="#EF4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent Assignments */}
        {assignments.length > 0 && (
          <Card>
            <CardHeader title="Recent Assignments" />
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-3 px-4 text-left text-sm font-semibold text-slate-900">Shipment ID</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-slate-900">From</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-slate-900">To</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-slate-900">Status</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-slate-900">Assigned Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment) => (
                      <tr key={assignment.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm font-mono text-slate-700">
                          {assignment.shipmentId?.slice(0, 8)}...
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-700">
                          {assignment.shipment?.pickupCity || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-700">
                          {assignment.shipment?.deliveryCity || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            assignment.assignmentStatus === 'COMPLETED' 
                              ? 'bg-green-100 text-green-700'
                              : assignment.assignmentStatus === 'FAILED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {assignment.assignmentStatus || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {new Date(assignment.assignedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </BusinessLayout>
  );
}
