/**
 * Hook to handle token extraction from URL redirect
 * Called when user is redirected from login on another origin
 */

'use client';

import { useEffect } from 'react';
import { AuthService } from '../services/auth.service';

export function useTokenFromUrl() {
  useEffect(() => {
    // Get token and user from URL query parameters
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userJson = params.get('user');
    
    if (token) {
      console.log('[useTokenFromUrl] Found token in URL, saving to localStorage');
      
      // Save token to this app's localStorage
      AuthService.saveTokens({
        accessToken: token,
        expiresIn: 24 * 60 * 60, // 24 hours
      });
      
      // Save user data if present
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          console.log('[useTokenFromUrl] Found user data, saving to localStorage');
          AuthService.saveUser(user);
          // Also save in "user" key for backward compatibility
          localStorage.setItem('user', JSON.stringify(user));
        } catch (err) {
          console.error('[useTokenFromUrl] Failed to parse user data:', err);
        }
      }
      
      // Remove token and user from URL (clean up)
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
      
      console.log('[useTokenFromUrl] Token and user saved, URL cleaned');
    }
  }, []);
}
