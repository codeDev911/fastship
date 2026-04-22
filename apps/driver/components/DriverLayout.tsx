'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@fastship/ui';
import { Navbar } from '@fastship/ui';
import {
  Home,
  Package,
  DollarSign,
  Bell,
  Settings,
  AlertCircle,
  Wallet,
  LogOut,
  Gavel,
  CreditCard,
} from 'lucide-react';
import { Button } from '@fastship/ui';
import Link from 'next/link';
import { useAuth } from '@fastship/lib';

interface DriverLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  unreadNotifications?: number;
}

export function DriverLayout({
  children,
  currentPage,
  unreadNotifications = 0,
}: DriverLayoutProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('[v0] Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const codDebt = { currentDebt: 0 };
  const hasDebt = codDebt.currentDebt > 0;

  const navItems = [
    {
      label: 'Overview',
      href: '/overview',
      icon: <Home className="h-5 w-5" />,
    },
    {
      label: 'Orders',
      href: '/orders',
      icon: <Package className="h-5 w-5" />,
    },
    {
      label: 'Income',
      href: '/income',
      icon: <DollarSign className="h-5 w-5" />,
    },
     
    {
      label: 'Settle Debt',
      href: '/settle-debt',
      icon: <Wallet className="h-5 w-5" />,
    },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: <Bell className="h-5 w-5" />,
      badge: unreadNotifications,
    },
     {
        label:"Billing",
      icon: <CreditCard className="h-5 w-5" />,
        href:"/billing"
      },
    {
      label: 'Settings',
      href: '/settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        items={navItems}
        companyName="FastShip Driver"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        logo={
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">
            FS
          </div>
        }
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* COD Debt Warning Header */}
        {hasDebt && (
          <div className={`border-b border-red-200 bg-red-50 px-6 py-4`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-red-700">COD Debt: -{codDebt.currentDebt.toLocaleString()} PKR</p>
                  <p className="text-xs text-red-600 mt-0.5">Please settle your debt to avoid account suspension</p>
                </div>
              </div>
              <Link href="/driver/settle-debt" className="flex-shrink-0">
                <Button variant="primary" size="sm">
                  Settle Now
                </Button>
              </Link>
            </div>
          </div>
        )}

        <Navbar
          userName="Driver"
          userRole="Delivery Driver"
          userAvatar=""
          unreadNotifications={unreadNotifications}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
        />

        <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
