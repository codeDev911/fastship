/**
 * Protected Layout Component
 * 
 * Wraps your app to ensure users are authenticated
 * Redirects to login page if not authenticated
 */

'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '../services/auth.service';
import { useTokenFromUrl } from '../hooks/useTokenFromUrl';

interface ProtectedLayoutProps {
  children: ReactNode;
  loginUrl?: string;
}

/**
 * ProtectedLayout Component
 * 
 * Usage in app/layout.tsx or any page:
 * 
 * import { ProtectedLayout } from '@fastship/lib';
 * 
 * export default function Layout({ children }) {
 *   return <ProtectedLayout>{children}</ProtectedLayout>;
 * }
 */
export function ProtectedLayout({
  children,
  loginUrl = `${process.env.NEXT_PUBLIC_MARKETING_BASE_URL || 'http://localhost:3004'}/login`,
}: ProtectedLayoutProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Extract and save token from URL if present (cross-origin redirect)
  useTokenFromUrl();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsChecking(true);

        // Check if user has valid token
        const token = AuthService.getAccessToken();
        const isExpired = AuthService.isTokenExpired();
        if (!token || isExpired) {
          // No valid token, redirect to login
          setIsAuthenticated(false);
          // Small delay to ensure we're not in the middle of render
          setTimeout(() => {
            window.location.href = loginUrl;
          }, 100);
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.log("error occured");
        alert("An error occurred while checking authentication. Please try again.");
        console.error('[ProtectedLayout] Auth check error:', error);
        setIsAuthenticated(false);
        setTimeout(() => {
          window.location.href = loginUrl;
        }, 100);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [loginUrl]);

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't show content (we'll redirect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Redirecting to login...</p>
          <a href={loginUrl} className="text-primary hover:underline">
            Click here if not redirected automatically
          </a>
        </div>
      </div>
    );
  }

  // Authenticated, show content
  return <>{children}</>;
}

export default ProtectedLayout;
