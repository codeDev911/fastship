'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

export interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: NavItem[];
  badge?: number;
}

interface SidebarProps {
  items: NavItem[];
  logo?: React.ReactNode;
  companyName?: string;
  baseRoute?: string;
}

interface SidebarWithToggleProps extends SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ items, logo, companyName, baseRoute = '', isOpen = true, onClose }: SidebarWithToggleProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const active = isActive(item.href);
    const expanded = expandedItems.includes(item.label);

    return (
      <div key={item.label}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.label)}
            className={`w-full flex items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${expanded
              ? 'bg-secondary text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
          >
            <span className="flex items-center gap-3">
              {item.icon}
              {item.label}
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </button>
        ) : (
          <Link
            href={item.href || '#'}
            onClick={onClose}
            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${active
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-white">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </Link>
        )}

        {hasChildren && expanded && (
          <div className="mt-2 space-y-1 border-l border-border pl-4">
            {item.children?.map((child) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-white transition-transform duration-300 lg:relative lg:translate-x-0 ${!isOpen ? '-translate-x-full' : 'translate-x-0'}`}>
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            {logo && <div className="flex-shrink-0">{logo}</div>}
            {companyName && (
              <div>
                <h1 className="text-base font-bold text-foreground">{companyName}</h1>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-2">
            {items.map((item) => renderNavItem(item))}
          </div>
        </nav>
      </aside>
    </>
  );
}
