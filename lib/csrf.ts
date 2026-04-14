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
