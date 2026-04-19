/**
 * Protected Route Component
 * 
 * Use this on individual pages/routes that require authentication
 */

'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '../services/auth.service';

interface ProtectedRouteProps {
  children: ReactNode;
  loginUrl?: string;
  requiredRole?: 'DRIVER' | 'SELLER' | 'BUSINESS';
  allowedRoles?: ('DRIVER' | 'SELLER' | 'BUSINESS')[];
}

/**
 * ProtectedRoute Component
 * 
 * Usage in any page component:
 * 
 * import { ProtectedRoute } from '@fastship/lib';
 * 
 * export default function MyPage() {
 *   return (
 *     <ProtectedRoute requiredRole="SELLER">
 *       <div>Only sellers can see this</div>
 *     </ProtectedRoute>
 *   );
 * }
 * 
 * Or with allowed roles:
 * 
 * <ProtectedRoute allowedRoles={['SELLER', 'BUSINESS']}>
 *   <div>Sellers and Business can see this</div>
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  loginUrl = `${process.env.NEXT_PUBLIC_MARKETING_BASE_URL || 'http://localhost:3004'}/login`,
  requiredRole,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsChecking(true);

        // Check if user has valid token
        const token = AuthService.getAccessToken();
        const isExpired = AuthService.isTokenExpired();

        if (!token || isExpired) {
          console.log('[ProtectedRoute] No valid token, redirecting to login');
          setIsAuthorized(false);
          setTimeout(() => {
            window.location.href = loginUrl;
          }, 100);
          return;
        }

        // Get user info
        const user = AuthService.getUser();
        if (!user) {
          setIsAuthorized(false);
          setTimeout(() => {
            window.location.href = loginUrl;
          }, 100);
          return;
        }

        setUserRole(user.role);

        // Check role requirements
        if (requiredRole && user.role !== requiredRole) {
          console.log('[ProtectedRoute] User role does not match required role');
          setIsAuthorized(false);
          return;
        }

        if (allowedRoles && !allowedRoles.includes(user.role as any)) {
          console.log('[ProtectedRoute] User role not in allowed roles');
          setIsAuthorized(false);
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('[ProtectedRoute] Auth check error:', error);
        setIsAuthorized(false);
        setTimeout(() => {
          window.location.href = loginUrl;
        }, 100);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [loginUrl, requiredRole, allowedRoles]);

  // Show loading state
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  // Not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            {!userRole
              ? 'You are not logged in. Redirecting to login...'
              : `Your role (${userRole}) does not have access to this page.`}
          </p>
          <a href={loginUrl} className="text-primary hover:underline">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Authorized, show content
  return <>{children}</>;
}

export default ProtectedRoute;
