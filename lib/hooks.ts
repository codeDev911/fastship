'use client';
import { secureFetch } from '@/lib/secure-fetch';

import { useState, useCallback, useEffect } from 'react';

// Shipment Hook
export function useShipments(sellerId?: string, status?: string) {
  const [shipments, setShipments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const businessId = user?.jobId;
        if (user.role === "BUSINESS" && businessId) params.append('businessId', businessId);
        if (user.role === "DRIVER" && businessId) params.append('driverId', businessId); // For driver view, filter by assigned shipments
        if (status) params.append('status', status);

        const response = await secureFetch(`/api/business/shipments?${params}`);
        if (!response.ok) throw new Error('Failed to fetch shipments');
        const data = await response.json();
        setShipments(data.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch shipments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchShipments();
  }, [sellerId, status]);

  const updateShipmentStatus = useCallback(
    async (shipmentId: string, newStatus: string) => {
      try {
        setIsLoading(true);
        const response = await secureFetch(`/api/shipments/${shipmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!response.ok) throw new Error('Failed to update shipment');
        const updated = await response.json();
        setShipments((prev) =>
          prev.map((s) => (s.id === shipmentId ? updated : s))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const assignDriver = useCallback(
    async (shipmentId: string, driverId: string, businessId: string) => {
      try {
        setIsLoading(true);
        const response = await secureFetch('/api/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shipmentId, driverId, businessId }),
        });
        if (!response.ok) throw new Error('Failed to assign driver');
        const assignment = await response.json();
        // Update shipment with assignment
        setShipments((prev) =>
          prev.map((s) => (s.id === shipmentId ? { ...s, status: 'ASSIGNED', assignment } : s))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to assign');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createShipment = useCallback(
    async (newShipment: any) => {
      try {
        setIsLoading(true);
        const response = await secureFetch('/api/shipments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newShipment),
        });
        if (!response.ok) throw new Error('Failed to create shipment');
        const created = await response.json();
        setShipments((prev) => [created, ...prev]);
        return created;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteShipment = useCallback(
    async (shipmentId: string) => {
      try {
        setIsLoading(true);
        const response = await secureFetch(`/api/shipments/${shipmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CANCELLED' }),
        });
        if (!response.ok) throw new Error('Failed to delete shipment');
        setShipments((prev) => prev.filter((s) => s.id !== shipmentId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    shipments,
    isLoading,
    error,
    updateShipmentStatus,
    assignDriver,
    createShipment,
    deleteShipment,
  };
}

// Notifications Hook
export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!userId) return;
        setIsLoading(true);
        const response = await secureFetch(`/api/notifications?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setNotifications(data.data);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [userId]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await secureFetch(`/api/notifications/${notificationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    },
    []
  );

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        await secureFetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      } catch (err) {
        console.error('Failed to delete:', err);
      }
    },
    []
  );

  const getUnreadCount = useCallback(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  return {
    notifications,
    isLoading,
    markAsRead,
    deleteNotification,
    getUnreadCount,
  };
}

// Drivers Hook
export function useDrivers(businessId?: string) {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({ isActive: 'true' });
        if (businessId) params.append('businessId', businessId);

        const response = await secureFetch(`/api/drivers?${params}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setDrivers(data.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch drivers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDrivers();
  }, [businessId]);

  const addEarnings = useCallback(
    async (driverId: string, amount: number, shipmentId?: string) => {
      try {
        const response = await secureFetch('/api/earnings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ driverId, amount, shipmentId }),
        });
        if (!response.ok) throw new Error('Failed to add earnings');
        setDrivers((prev) =>
          prev.map((d) =>
            d.id === driverId
              ? { ...d, totalEarnings: d.totalEarnings + amount, totalDeliveries: d.totalDeliveries + 1 }
              : d
          )
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add earnings');
      }
    },
    []
  );

  return {
    drivers,
    isLoading,
    error,
    addEarnings,
  };
}
