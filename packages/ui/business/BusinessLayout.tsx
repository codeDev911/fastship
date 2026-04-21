'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, NavItem } from '../shared/Sidebar';
import { Navbar } from '../shared/Navbar';
import {
  BarChart3,
  Truck,
  Package,
  Users,
  Bell,
  Settings,
  Home,
  Tag,
  Navigation,
  DollarSign,
  Gavel,
  CreditCard,
  Banknote,
  Key,
} from 'lucide-react';
import { useAuth } from '../../lib/context/AuthContext';

interface BusinessLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  unreadNotifications?: number;
  walletBalance?: number | string;
  currency?: string;
}

export function BusinessLayout({
  children,
  currentPage,
  unreadNotifications = 0,
  walletBalance=0,
  currency = 'PKR',
}: BusinessLayoutProps) {
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

  const navItems: NavItem[] = [
    {
      label: 'Overview',
      href: '/overview',
      icon: <Home className="h-5 w-5" />,
    },
    {
      label: 'Shipments',
      href: '/shipments',
      icon: <Package className="h-5 w-5" />,
    },
    {
      label: 'Drivers',
      href: '/drivers',
      icon: <Truck className="h-5 w-5" />,
    }, 
   
    {
      label: 'Analytics',
      href: '/analytics',
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      label: 'Rate Cards',
      href: '/rate-cards',
      icon: <Tag className="h-5 w-5" />,
    },
    {
      label: 'Payments & Settlement',
      href: '/payments-settlement',
      icon: <Banknote className="h-5 w-5" />,
    },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: <Bell className="h-5 w-5" />,
      badge: unreadNotifications,
    },
     {
      label: 'Billing',
      href: '/billing',
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      label: 'API Keys',
      href: '/api-keys',
      icon: <Key className="h-5 w-5" />,
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
        companyName="FastShip"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        logo={
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">
            FS
          </div>
        }
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          userName="Business"
          userRole="Logistics Business"
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
