'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import '../../../../packages/ui/styles/globals.css'

import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Wallet, 
  AlertCircle, 
  FileText, 
  Settings,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  DollarSign,
  CheckCircle2,
  BarChart3,
  ChevronDown
} from 'lucide-react';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // if (storedUser?.role !== 'ADMIN') {
    //   router.push('/login');
    //   return;
    // }
    
    setUser(storedUser);
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href:'/' },
    { label: 'Sellers', icon: Users, href: '/sellers' },
    { label: 'Drivers', icon: Truck, href: '/drivers' },
    { label: 'Businesses', icon: ShoppingCart, href: '/businesses' },
    { label: 'Shipments', icon: BarChart3, href: '/shipments' },
    { 
      label: 'Financial', 
      icon: DollarSign,
      subItems: [
        { label: 'Wallets', href: '/financial/wallets' },
        { label: 'Settlements', href: '/financial/settlements' },
        { label: 'Payments', href: '/financial/payments' },
      ]
    },
    { label: 'Approvals', icon: CheckCircle2, href: '/approvals' },
    { label: 'Disputes', icon: AlertCircle, href: '/disputes' },
    { 
      label: 'System', 
      icon: Settings,
     href:"/system",
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col overflow-y-auto`}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-bold text-sm">FS</div>
            {sidebarOpen && <span className="font-bold text-lg">FastShip Admin</span>}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasSubItems = 'subItems' in item;
            const isExpanded = expandedMenu === item.label;

            return (
              <div key={item.label}>
                {hasSubItems ? (
                  <button
                    onClick={() => setExpandedMenu(isExpanded ? null : item.label)}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-800 transition-all text-left"
                  >
                    <Icon className="w-5 h-5" />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href || '#'}
                    className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-800 transition-all"
                  >
                    <Icon className="w-5 h-5" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </Link>
                )}

                {/* Sub Items */}
                {hasSubItems && sidebarOpen && isExpanded && (
                  <div className="ml-6 mt-2 space-y-1">
                    {item.subItems?.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className="block px-4 py-2 text-sm text-slate-400 rounded hover:bg-slate-800 hover:text-white transition-all"
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="border-t border-slate-700 p-4 space-y-3">
          <div className={`${!sidebarOpen && 'hidden'} text-sm`}>
            <p className="text-slate-400">Logged in as:</p>
            <p className="font-semibold text-white truncate">{user?.name || user?.email}</p>
            <p className="text-xs text-slate-500">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-800 text-red-400 transition-all"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-all"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <p className="text-sm text-slate-500">Welcome Back</p>
              <p className="font-semibold text-slate-900">{user?.companyName || user?.name || 'Admin'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">Admin Panel</p>
              <p className="text-xs text-slate-500">System Management</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
