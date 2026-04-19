/**
 * CORS Configuration and Validation
 * Supports multiple frontend domains with environment-based configuration
 */

/**
 * Parse ALLOWED_ORIGINS from environment variable
 * Format: comma-separated list of origins
 * Example: "https://app.fastship.com,https://mobile.fastship.com,http://localhost:3000"
 */
export function getAllowedOrigins(): string[] {
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || '';

  if (!allowedOriginsEnv.trim()) {
    // Default to current origin if not configured
    return ['http://localhost:3000', 'http://localhost:3001'];
  }

  return allowedOriginsEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/**
 * Validate if request origin is allowed
 * Used for CORS origin validation
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    // Allow requests without origin header (e.g., same-origin requests)
    return true;
  }

  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.some((allowedOrigin) => {
    // Support wildcards in origin (e.g., https://*.example.com)
    if (allowedOrigin.includes('*')) {
      const regex = new RegExp(
        '^' + allowedOrigin.replace(/\*/g, '[a-z0-9.-]*') + '$'
      );
      return regex.test(origin);
    }
    return origin === allowedOrigin;
  });
}

/**
 * Get CORS headers for response
 * Include appropriate headers based on origin validation
 */
export function getCORSHeaders(requestOrigin: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {};

  if (isOriginAllowed(requestOrigin)) {
    headers['Access-Control-Allow-Origin'] = requestOrigin || '*';
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With';
    headers['Access-Control-Max-Age'] = '86400'; // 24 hours
  }

  return headers;
}

/**
 * Extract origin from request
 */
export function getOriginFromRequest(request: { headers: { get: (name: string) => string | null } }): string | undefined {
  return request.headers.get('origin') || undefined;
}

/**
 * Check if request is a CORS preflight request (OPTIONS)
 */
export function isCORSPreflightRequest(method: string): boolean {
  return method.toUpperCase() === 'OPTIONS';
}

/**
 * Create CORS preflight response
 */
export function createCORSPreflightResponse(
  requestOrigin: string | undefined
) {
  const corsHeaders = getCORSHeaders(requestOrigin);
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
