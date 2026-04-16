'use client';

import React from 'react';
import {
  Clock10,
  UserCircle,
  BoxIcon,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowDown,
} from 'lucide-react';

interface TimelineActivity {
  status: string;
  createdAt: string;
  notes?: string;
}

interface ShipmentTimelineProps {
  activities?: TimelineActivity[];
  currentStatus: string;
}

export function ShipmentTimeline({
  activities = [],
  currentStatus,
}: ShipmentTimelineProps) {
  const statuses = [
    'PENDING',
    'ASSIGNED',
    'PICKED_UP',
    'IN_TRANSIT',
    'DELIVERED',
  ];

  const getIcon = (status: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      PENDING: <Clock10 className="h-4 w-4" />,
      ASSIGNED: <UserCircle className="h-4 w-4" />,
      PICKED_UP: <BoxIcon className="h-4 w-4" />,
      IN_TRANSIT: <Truck className="h-4 w-4" />,
      DELIVERED: <CheckCircle className="h-4 w-4" />,
      CANCELLED: <XCircle className="h-4 w-4" />,
      FAILED: <AlertCircle className="h-4 w-4" />,
      RETURNED: <ArrowDown className="h-4 w-4" />,
    };
    return iconMap[status] || <AlertCircle className="h-4 w-4" />;
  };

  const getStatusLabel = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const currentIndex = statuses.indexOf(currentStatus);

  return (
    <div className="space-y-4">
      {statuses.map((status, idx) => {
        const isCompleted = idx < currentIndex;
        const isActive = idx === currentIndex;
        const activity = activities?.find((a) => a.status === status);

        return (
          <div key={status}>
            <div className="flex gap-4">
              {/* Timeline indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    isCompleted
                      ? 'bg-green-100 text-green-700'
                      : isActive
                      ? 'bg-accent text-accent-foreground ring-2 ring-accent/30'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {isCompleted ? '✓' : getIcon(status)}
                </div>

                {/* Connector line */}
                {idx < statuses.length - 1 && (
                  <div
                    className={`w-1 h-16 mt-2 transition-colors ${
                      isCompleted ? 'bg-green-100' : 'bg-secondary'
                    }`}
                  />
                )}
              </div>

              {/* Status content */}
              <div className="flex-1 py-2">
                <div className="flex items-baseline gap-2">
                  <p className="font-semibold text-foreground">
                    {getStatusLabel(status)}
                  </p>
                  {!isCompleted && !isActive && (
                    <p className="text-xs text-muted-foreground">Pending</p>
                  )}
                </div>

                {activity && (
                  <>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(activity.createdAt).toLocaleDateString()} at{' '}
                      {new Date(activity.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {activity?.description && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        {activity?.description}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
