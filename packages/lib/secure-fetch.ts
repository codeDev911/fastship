/**
 * Secured fetch wrapper for cross-domain API calls
 * Uses JWT tokens stored in localStorage
 * Includes CSRF protection for state-changing requests
 * Works with separate API server (Turborepo architecture)
 */

interface FetchOptions extends RequestInit {
  skipAuth?: boolean; // Set to true for public endpoints
  skipCSRF?: boolean; // Set to true to skip CSRF token injection
}

/**
 * Get JWT token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null; // SSR - no token available
  }
  return localStorage.getItem('auth_token');
}

/**
 * Set JWT token in localStorage
 */
export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

/**
 * Clear JWT token from localStorage
 */
export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

/**
 * Get CSRF token from localStorage
 */
export function getCSRFToken(): string | null {
  if (typeof window === 'undefined') {
    return null; // SSR - no token available
  }
  return localStorage.getItem('csrf_token');
}

/**
 * Set CSRF token in localStorage
 */
export function setCSRFToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('csrf_token', token);
  }
}

/**
 * Clear CSRF token from localStorage
 */
export function clearCSRFToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('csrf_token');
  }
}

/**
 * Refresh CSRF token from server
 */
/**
 * Refresh CSRF token from server
 */
export async function refreshCSRFToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null; // SSR - cannot refresh
  }

  try {
    const token = getAuthToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add Authorization header if we have a token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/csrf-token`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      if (data.csrfToken) { 
        setCSRFToken(data.csrfToken);
        return data.csrfToken;
      }
    } else {
      console.warn('[SecureFetch] CSRF token refresh failed with status:', response.status);
    }
  } catch (error) {
    console.error('[SecureFetch] CSRF token refresh failed:', error);
  }

  return null;
}

/**
 * Main secure fetch function for API calls
 * Automatically includes JWT token in Authorization header
 * Automatically includes CSRF token for state-changing requests
 */
export async function secureFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { skipAuth = false, skipCSRF = false, ...fetchOptions } = options;
  
  const headers = new Headers(fetchOptions.headers || {});
  headers.set('Content-Type', 'application/json');

  // Add Authorization header if not skipped
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Add CSRF token for state-changing requests (POST, PUT, DELETE, PATCH)
  const method = (fetchOptions.method || 'GET').toUpperCase();
  const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  
  if (isStateChanging && !skipCSRF) {
    let csrfToken = getCSRFToken();
    
    // If no CSRF token, try to refresh it
    if (!csrfToken) {
      csrfToken = await refreshCSRFToken();
    }
    
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}`+url, {
      ...fetchOptions,
      headers,
      credentials: 'include', // Include cookies for CSRF
    });

    // Handle 401 Unauthorized (token expired)
    if (response.status === 401 && !skipAuth) {
      // Clear token and redirect to login
      clearAuthToken();
      
      // Only redirect if in browser
      if (typeof window !== 'undefined') {
        // Dispatch custom event for app to handle redirect
        window.dispatchEvent(
          new CustomEvent('auth:logout', {
            detail: { reason: 'Token expired' },
          })
        );
      }
    }

    return response;
  } catch (error) {
    console.error('[SecureFetch] Request failed:', error);
    throw error;
  }
}

/**
 * Helper for API requests with token refresh logic
 */
export async function secureFetchWithRetry(
  url: string,
  options: FetchOptions = {},
  retries = 1
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await secureFetch(url, options);

      // If successful, return
      if (response.ok) {
        return response;
      }

      // If 401 and we haven't retried, clear token and retry
      if (response.status === 401 && attempt < retries) {
        clearAuthToken();
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt === retries) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}
