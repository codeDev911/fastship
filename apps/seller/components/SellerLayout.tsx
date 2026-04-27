'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from "@fastship/ui";
import { Navbar } from "@fastship/ui";
import { Button } from "@fastship/ui";
import { BarChart3, Package, Gavel, Zap, CreditCard, Plus, Wallet, Banknote, Settings } from 'lucide-react';
import { useAuth } from '@fastship/lib';

interface SellerLayoutProps {
  children: React.ReactNode;
  currentPage?: 'overview' | 'orders' | 'bidding' |'payments'| 'integrations' | 'billing';
  walletBalance?: number;
  currency?: string;
  onTopUp?: () => void;
}

export function SellerLayout({
  children,
}: SellerLayoutProps) {
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

  const mockSellerUser = {
    id: 'seller-1',
    name: 'Seller',
    avatar: '',
    role: 'Seller',
  };

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <BarChart3 className="h-5 w-5" />,
      href: '/overview',
      children: [],
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <Package className="h-5 w-5" />,
      href: '/orders',
      children: [],
    },
  
    {
      id: 'payments',
      label: 'Payments',
      icon: <Banknote className="h-5 w-5" />,
      href: '/payments',
      children: [],
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: <Zap className="h-5 w-5" />,
      href: '/integrations',
      children: [],
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: <CreditCard className="h-5 w-5" />,
      href: '/billing',
      children: [],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      href: '/settings',
      children: [],
    },
  ];


  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        items={navItems}
        companyName="FastShip Seller"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        logo={
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">
            FS
          </div>
        }
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navbar with Wallet Header */}
        <nav className="border-b border-border bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Menu Toggle and User Info */}
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-full p-2 hover:bg-secondary transition-colors lg:hidden flex-shrink-0"
                aria-label="Toggle menu"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-foreground truncate">{mockSellerUser.name}</h1>
                <p className="text-sm text-muted-foreground capitalize truncate">Seller Dashboard</p>
              </div>
            </div>

            {/* Right: Wallet Balance and Top Up */}
            <div className="flex items-center gap-4 flex-shrink-0">
            
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-full p-2 hover:bg-secondary transition-colors disabled:opacity-50"
                aria-label="Logout"
                title="Sign out"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
