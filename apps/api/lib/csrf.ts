import { SignJWT, jwtVerify } from 'jose';

/**
 * Generate a CSRF token that expires in 15 minutes
 * Token is stateless and verified using JWT
 */
export async function generateCSRFToken(userId: string): Promise<string> {
  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key'
  );

  const token = await new SignJWT({
    userId,
    type: 'csrf',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret);

  return token;
}

/**
 * Verify a CSRF token
 * Returns userId if valid, throws error if invalid
 */
export async function verifyCSRFToken(token: string): Promise<string> {
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key'
    );

    const verified = await jwtVerify(token, secret);
    
    const payload = verified.payload as {
      userId: string;
      type: string;
    };

    if (payload.type !== 'csrf') {
      throw new Error('Invalid CSRF token type');
    }

    return payload.userId;
  } catch (error) {
    console.log({error});
    
    throw new Error('CSRF token verification failed');
  }
}

/**
 * Extract CSRF token from request headers
 */
export function getCSRFTokenFromRequest(headers: {
  get: (name: string) => string | null;
}): string | null {
  return headers.get('x-csrf-token');
}

/**
 * Get CSRF token from cookie
 */
export function getCSRFTokenFromCookie(cookies: {
  get: (name: string) => { value: string } | undefined;
}): string | null {
  return cookies.get('csrf_token')?.value || null;
}

/**
 * Client-side: Get CSRF token from localStorage
 */
export function getCSRFToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('csrf_token');
}

/**
 * Client-side: Store CSRF token in localStorage
 */
export function setCSRFToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('csrf_token', token);
}

/**
 * Client-side: Clear CSRF token from localStorage
 */
export function clearCSRFToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('csrf_token');
}

/**
 * Client-side: Refresh CSRF token from server
 * Call this after login to get a fresh token
 */
export async function refreshCSRFToken(): Promise<string | null> {
  try {
    if (typeof window === 'undefined') return null;

    const response = await fetch('/api/auth/csrf-token', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('[CSRF] Failed to refresh token:', response.status);
      return null;
    }

    const data = await response.json();
    const token = data.token;

    if (token) {
      setCSRFToken(token);
    }

    return token;
  } catch (error) {
    console.error('[CSRF] Failed to refresh token:', error);
    return null;
  }
}
