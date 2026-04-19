'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
  icon?: React.ReactNode;
}

export function Alert({
  type,
  title,
  message,
  onClose,
  icon,
  className = '',
  ...props
}: AlertProps) {
  const typeConfig = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      title: 'text-green-900',
      icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      title: 'text-red-900',
      icon: <AlertCircle className="h-5 w-5 text-red-600" />,
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      title: 'text-yellow-900',
      icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      title: 'text-blue-900',
      icon: <Info className="h-5 w-5 text-blue-600" />,
    },
  };

  const config = typeConfig[type];

  return (
    <div
      className={`rounded-lg border ${config?.bg} ${config?.border} ${config?.text} p-4 ${className}`}
      role="alert"
      {...props}
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0">{icon || config.icon}</div>
        <div className="flex-1">
          <h3 className={`font-semibold ${config.title}`}>{title}</h3>
          {message && <p className="mt-1 text-sm">{message}</p>}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 hover:opacity-75 transition-opacity"
            aria-label="Close alert"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
