'use client';

import React from 'react';
import { Bell, Settings, LogOut, Menu } from 'lucide-react';
import { Button } from './Button';

interface NavbarProps {
  userName: string;
  userRole: string;
  userAvatar?: string;
  unreadNotifications?: number;
  onNotificationClick?: () => void;
  onSettingsClick?: () => void;
  onLogout?: () => void;
  onMenuToggle?: () => void;
  isLoggingOut?: boolean;
}

export function Navbar({
  userName,
  userRole,
  userAvatar,
  unreadNotifications = 0,
  onNotificationClick,
  onSettingsClick,
  onLogout,
  onMenuToggle,
  isLoggingOut = false,
}: NavbarProps) {
  return (
    <nav className="border-b z-30 border-border bg-white px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Menu Toggle and User Info */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onMenuToggle}
            className="rounded-full p-2 hover:bg-secondary transition-colors lg:hidden flex-shrink-0"
            aria-label="Toggle menu"
            title="Toggle sidebar"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>

          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">{userName}</h1>
            <p className="text-sm text-muted-foreground capitalize truncate">{userRole}</p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Notifications */}
          <button
            onClick={onNotificationClick}
            className="relative rounded-full p-2 hover:bg-secondary transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-foreground" />
            {unreadNotifications > 0 && (
              <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-semibold text-white">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>

          {/* Settings */}
          <button
            onClick={onSettingsClick}
            className="rounded-full p-2 hover:bg-secondary transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5 text-foreground" />
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-border" />

          {/* User Avatar */}
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Logout */}
          <button
            onClick={onLogout}
            disabled={isLoggingOut}
            className="rounded-full p-2 hover:bg-secondary transition-colors disabled:opacity-50"
            aria-label="Logout"
            title="Sign out"
          >
            <LogOut className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </div>
    </nav>
  );
}
