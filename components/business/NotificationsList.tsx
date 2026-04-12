'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/shared/Card';
import { Notification } from '@/lib/types';
import { X, Bell, Package, Truck, DollarSign } from 'lucide-react';
import { Button } from '@/components/shared/Button';

interface NotificationsListProps {
  notifications: Notification[];
  onMarkAsRead?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
  isLoading?: boolean;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'shipment':
      return <Package className="h-5 w-5 text-blue-600" />;
    case 'delivery':
      return <Truck className="h-5 w-5 text-green-600" />;
    case 'payment':
      return <DollarSign className="h-5 w-5 text-yellow-600" />;
    case 'system':
      return <Bell className="h-5 w-5 text-purple-600" />;
    default:
      return <Bell className="h-5 w-5 text-gray-600" />;
  }
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
}

function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  return (
    <div
      className={`flex gap-4 rounded-lg border border-border p-4 transition-colors ${
        !notification.read ? 'bg-blue-50' : 'bg-white'
      }`}
    >
      <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-foreground">{notification.title}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
          </div>
          {!notification.read && (
            <div className="ml-2 h-2 w-2 rounded-full bg-accent flex-shrink-0 mt-2" />
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {new Date(notification.createdAt).toLocaleString()}
          </p>
          <div className="flex gap-2">
            {!notification.read && (
              <button
                onClick={() => onMarkAsRead?.(notification.id)}
                className="text-xs font-medium text-accent hover:underline"
              >
                Mark as read
              </button>
            )}
            <button
              onClick={() => onDelete?.(notification.id)}
              className="text-xs font-medium text-destructive hover:underline"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationsList({
  notifications,
  onMarkAsRead,
  onDelete,
  isLoading = false,
}: NotificationsListProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All notifications read'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary text-foreground hover:bg-secondary/80'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary text-foreground hover:bg-secondary/80'
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
            />
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-semibold text-foreground">No notifications</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {filter === 'unread' ? 'All notifications have been read' : 'You&apos;re all caught up'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
