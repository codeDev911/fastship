/**
 * Secured fetch wrapper that automatically includes CSRF tokens
 * Use this instead of native fetch() for API calls from the frontend
 */

interface FetchOptions extends RequestInit {
  requiresCSRF?: boolean; // Default: true for non-GET requests
}

let csrfToken: string | null = null;

/**
 * Fetch the CSRF token from the server
 */
async function fetchCSRFToken(): Promise<string> {
  try {
    const response = await fetch('/api/auth/csrf-token', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token');
    }

    const data = await response.json();
    csrfToken = data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('[SecureFetch] Failed to fetch CSRF token:', error);
    throw error;
  }
}

/**
 * Main secure fetch function
 * Automatically includes CSRF token for POST/PUT/DELETE/PATCH requests
 */
export async function secureFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const method = options.method || 'GET';
  const isStateChangingRequest = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(
    method.toUpperCase()
  );

  // Determine if CSRF token is needed
  const needsCSRF =
    options.requiresCSRF !== false && isStateChangingRequest;

  try {
    // Refresh CSRF token if needed and not cached
    if (needsCSRF && !csrfToken) {
      await fetchCSRFToken();
    }

    const headers = new Headers(options.headers || {});

    // Add CSRF token to headers for state-changing requests
    if (needsCSRF && csrfToken) {
      headers.set('x-csrf-token', csrfToken);
    }

    // Always include credentials for cookie-based auth
    const fetchOptions: RequestInit = {
      ...options,
      credentials: 'include',
      headers,
    };

    const response = await fetch(url, fetchOptions);

    // If CSRF token expired (403), refresh and retry once
    if (
      response.status === 403 &&
      needsCSRF &&
      response.statusText.includes('CSRF')
    ) {
      console.warn('[SecureFetch] CSRF token expired, refreshing...');
      csrfToken = null; // Clear cached token
      await fetchCSRFToken();

      if (csrfToken) {
        headers.set('x-csrf-token', csrfToken);
        const retryOptions: RequestInit = {
          ...options,
          credentials: 'include',
          headers,
        };
        return fetch(url, retryOptions);
      }
    }

    return response;
  } catch (error) {
    console.error('[SecureFetch] Request failed:', error);
    throw error;
  }
}

/**
 * Refresh the cached CSRF token
 * Call this after login or if token expires
 */
export async function refreshCSRFToken(): Promise<void> {
  csrfToken = null;
  await fetchCSRFToken();
}

/**
 * Clear the cached CSRF token
 * Call this on logout
 */
export function clearCSRFToken(): void {
  csrfToken = null;
}
