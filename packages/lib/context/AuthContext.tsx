'use client';

import  { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '../services/auth.service';
import { secureFetch } from '../secure-fetch';


export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'DRIVER' | 'SELLER' | 'BUSINESS';
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: string) => Promise<string>; // Returns redirect URL
  registerDriver: (data: any) => Promise<string>; // Returns redirect URL
  registerSeller: (data: any) => Promise<string>; // Returns redirect URL
  registerBusiness: (data: any) => Promise<string>; // Returns redirect URL
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  error: string | null;
  getRedirectUrl: () => string | null; // Get redirect URL for current user
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const response = await secureFetch('/api/auth/me');

        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error(' Auth check failed:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string, role: string) => {
    try {
      setError(null);
      setIsLoading(true);


      const response = await secureFetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setUser(data.user);
      
      // Save tokens and user info using AuthService
      AuthService.saveTokens({
        accessToken: data.token || data.accessToken || '',
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
      });
      AuthService.saveUser(data.user);
      
      // Also keep existing localStorage for backward compatibility
      localStorage.setItem("user", JSON.stringify(data.user));
      
      

      // Get redirect URL and append token + user data as query parameters
      const redirectUrl = AuthService.getRedirectUrl(data.user.role);
      const userDataEncoded = encodeURIComponent(JSON.stringify(data.user));
      const urlWithTokenAndUser = `${redirectUrl}?token=${encodeURIComponent(data.token || data.accessToken || '')}&user=${userDataEncoded}`;
      
      return urlWithTokenAndUser;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      console.error('[Auth] Login error:', message);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerDriver = async (data: any) => {
    try {
      setError(null);
      setIsLoading(true);


      const response = await secureFetch('/api/auth/register/driver', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const responseData = await response.json();
      
      // Save tokens and user info using AuthService
      AuthService.saveTokens({
        accessToken: responseData.token || responseData.accessToken || '',
        refreshToken: responseData.refreshToken,
        expiresIn: responseData.expiresIn,
      });
      AuthService.saveUser(responseData.user);
      
      // Also keep existing localStorage for backward compatibility
      localStorage.setItem("user", JSON.stringify(responseData.user));
      setUser(responseData.user);

    

      // Return redirect URL
      return AuthService.getRedirectUrl(responseData.user.role);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerSeller = async (data: any) => {
    try {
      setError(null);
      setIsLoading(true);

      

      const response = await secureFetch('/api/auth/register/seller', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const responseData = await response.json();
      
      // Save tokens and user info using AuthService
      AuthService.saveTokens({
        accessToken: responseData.token || responseData.accessToken || '',
        refreshToken: responseData.refreshToken,
        expiresIn: responseData.expiresIn,
      });
      AuthService.saveUser(responseData.user);
      
      // Also keep existing localStorage for backward compatibility
      localStorage.setItem("user", JSON.stringify(responseData.user));
      setUser(responseData.user);

      // Refresh CSRF token after successful registration
       
      // Return redirect URL
      return AuthService.getRedirectUrl(responseData.user.role);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerBusiness = async (data: any) => {
    try {
      setError(null);
      setIsLoading(true);

      

      const response = await secureFetch('/api/auth/register/business', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const responseData = await response.json();
      
      // Save tokens and user info using AuthService
      AuthService.saveTokens({
        accessToken: responseData.token || responseData.accessToken || '',
        refreshToken: responseData.refreshToken,
        expiresIn: responseData.expiresIn,
      });
      AuthService.saveUser(responseData.user);
      
      // Also keep existing localStorage for backward compatibility
      localStorage.setItem("user", JSON.stringify(responseData.user));
      setUser(responseData.user);

    
      // Return redirect URL
      return AuthService.getRedirectUrl(responseData.user.role);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);

      

      await secureFetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          
        },
        credentials: 'include',
      });

      setUser(null);
      
      // Clear all auth data using AuthService
      AuthService.clearAuth();
      

    } catch (err) {
      console.error('[Auth] Logout failed:', err);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await secureFetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('[Auth] Refresh failed:', err);
      setUser(null);
    }
  };

  const getRedirectUrl = () => {
    if (!user) return null;
    return AuthService.getRedirectUrl(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        registerDriver,
        registerSeller,
        registerBusiness,
        logout,
        refreshUser,
        error,
        getRedirectUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
