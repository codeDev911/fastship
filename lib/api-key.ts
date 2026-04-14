import crypto from 'crypto';

/**
 * Generate a secure API key
 * Format: sk_test_<random> or sk_live_<random>
 * Returns: { key: string (full key to give user), prefix: string (for display), hash: string (to store in db) }
 */
export function generateApiKey(
  environment: 'test' | 'live' = 'test'
): { key: string; prefix: string; hash: string } {
  // Generate 32 bytes of random data and convert to hex
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const environment_prefix = environment === 'test' ? 'sk_test_' : 'sk_live_';
  const key = `${environment_prefix}${randomBytes}`;

  // Create prefix (first 8 chars after environment prefix for display)
  const prefix = `${environment_prefix}${randomBytes.slice(0, 8)}`;

  // Hash the full key for storage
  const hash = hashApiKey(key);

  return { key, prefix, hash };
}

/**
 * Hash an API key for secure storage
 * Use SHA-256
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Verify an API key against its hash
 */
export function verifyApiKey(key: string, hash: string): boolean {
  const computedHash = hashApiKey(key);
  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
}

/**
 * Extract API key from Authorization header
 * Expected format: "Bearer sk_test_xxxx"
 */
export function getApiKeyFromHeaders(headers: {
  get: (name: string) => string | null;
}): string | null {
  const authHeader = headers.get('authorization');

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Check if API key is valid and not expired
 */
export function isApiKeyValid(
  apiKey: {
    isActive: boolean;
    revokedAt: Date | null;
    expiresAt: Date | null;
  }
): boolean {
  if (!apiKey.isActive || apiKey.revokedAt) {
    return false;
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return false;
  }

  return true;
}

/**
 * Check if API key has required scope
 * Scope format: "read", "write", "admin", or comma-separated "read,write"
 */
export function hasScope(
  apiKeyScope: string,
  requiredScope: string
): boolean {
  const scopes = apiKeyScope.split(',').map((s) => s.trim());
  return scopes.includes('all') || scopes.includes(requiredScope);
}
