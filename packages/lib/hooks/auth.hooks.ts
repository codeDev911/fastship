/**
 * Custom hooks for authentication
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { AuthService, AuthUser } from '../services/auth.service';

/**
 * Hook to get the access token
 */
export function useAuthToken(): string | null {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const authToken = AuthService.getAccessToken();
    setToken(authToken);
    setIsLoading(false);
  }, []);

  return token;
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): { isAuthenticated: boolean; isLoading: boolean } {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const authenticated = AuthService.isAuthenticated();
    setIsAuthenticated(authenticated);
    setIsLoading(false);
  }, []);

  return { isAuthenticated, isLoading };
}

/**
 * Hook to get the current user from localStorage
 */
export function useStoredUser(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const storedUser = AuthService.getUser();
    setUser(storedUser);
    setIsLoading(false);
  }, []);

  return user;
}

/**
 * Hook to get auth headers for API requests
 */
export function useAuthHeaders(csrfToken?: string): Record<string, string> {
  const [headers, setHeaders] = useState<Record<string, string>>({});

  useEffect(() => {
    const authHeaders = AuthService.getAuthHeaders(csrfToken);
    setHeaders(authHeaders);
  }, [csrfToken]);

  return headers;
}

/**
 * Hook to clear authentication and redirect to login
 */
export function useLogout(): () => void {
  const logout = useCallback(() => {
    AuthService.clearAuth();
    
    // Redirect to marketing login page
    const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_BASE_URL || 'http://localhost:3004';
    window.location.href = `${marketingUrl}/login`;
  }, []);

  return logout;
}

/**
 * Hook to check token expiration and auto-logout if needed
 */
export function useTokenExpirationCheck(): void {
  useEffect(() => {
    // Check every minute if token is expired
    const interval = setInterval(() => {
      if (AuthService.isTokenExpired()) {
        // Token expired, clear auth and redirect to login
        AuthService.clearAuth();
        const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_BASE_URL || 'http://localhost:3004';
        window.location.href = `${marketingUrl}/login`;
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);
}

export default {
  useAuthToken,
  useIsAuthenticated,
  useStoredUser,
  useAuthHeaders,
  useLogout,
  useTokenExpirationCheck,
};
