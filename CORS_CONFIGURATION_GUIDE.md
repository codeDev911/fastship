# Phase 3: Multi-Domain CORS Configuration

## Overview

This phase enables **Cross-Origin Resource Sharing (CORS)** for your APIs, allowing legitimate requests from multiple frontend domains while maintaining security.

✅ **Support multiple frontend domains**  
✅ **Use different origins per environment** (dev, staging, production)  
✅ **Automatic preflight request handling**  
✅ **Wildcard subdomain support** (e.g., `https://*.example.com`)  
✅ **Environment-based configuration**  

---

## Architecture

### CORS Flow

```
1. Browser makes cross-origin request (different domain)
   ↓
2. Browser sends OPTIONS preflight request
   ↓
3. Server checks ALLOWED_ORIGINS environment variable
   ↓
4. If origin is allowed:
   - Return CORS headers
   - Browser allows request to proceed
   ↓
5. Request succeeds with data + CORS response headers
```

### What Gets CORS Headers

✅ All `/api/*` endpoints  
✅ Non-browser requests using Authorization headers (API keys)  
✅ Preflight OPTIONS requests  

---

## Configuration

### Step 1: Set Environment Variable

Create or update your `.env.local` file:

```bash
# Development - multiple local domains
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# OR for production
ALLOWED_ORIGINS=https://app.fastship.com,https://mobile.fastship.com,https://dashboard.fastship.com

# OR with wildcard support
ALLOWED_ORIGINS=https://app.fastship.com,https://*.fastship.com,http://localhost:*
```

### Step 2: Format

```bash
ALLOWED_ORIGINS="origin1,origin2,origin3"
```

**Rules:**
- Comma-separated values
- No spaces around commas recommended
- Whitespace will be stripped automatically
- Supports wildcard pattern: `https://*.example.com`
- Protocol required: `https://` or `http://`

### Step 3: Supported Patterns

```bash
# Exact domain
https://app.fastship.com

# Subdomain wildcard
https://*.fastship.com          # Matches app.fastship.com, mobile.fastship.com, etc
https://app.*.fastship.com      # Matches app.dev.fastship.com, app.prod.fastship.com, etc

# Localhost with port
http://localhost:3000

# Multiple environments
https://app.fastship.com,https://staging-app.fastship.com,http://localhost:3000
```

---

## Implementation Details

### Files Created

1. **[lib/cors.ts](../../lib/cors.ts)** — CORS validation utilities
   - `getAllowedOrigins()` — Parse ALLOWED_ORIGINS from env
   - `isOriginAllowed()` — Check if origin is in whitelist
   - `getCORSHeaders()` — Generate CORS response headers
   - `isCORSPreflightRequest()` — Detect OPTIONS requests

2. **[lib/cors-middleware.ts](../../lib/cors-middleware.ts)** — Middleware helpers
   - `corsMiddleware()` — Handle preflight requests globally
   - `applyCORSHeaders()` — Add CORS headers to response
   - `handleCORSPreflight()` — Per-route preflight handling

3. **[lib/api-response.ts](../../lib/api-response.ts)** — API response helpers
   - `apiResponse()` — JSON response + CORS headers
   - `apiErrorResponse()` — Error response + CORS headers

### Modified Files

- **[middleware.ts](../../middleware.ts)** — Added CORS preflight handling + header application

---

## Usage

### Option 1: Automatic (via Middleware - Recommended)

Your middleware automatically handles CORS for all API routes:

```typescript
// Your API route - CORS headers are automatically applied!
export async function GET(request: NextRequest) {
  // Your logic...
  return NextResponse.json({ data });
  // CORS headers automatically added by middleware
}
```

### Option 2: Manual (using Helpers)

For more control, use the API response helpers:

```typescript
import { apiResponse, apiErrorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    return apiResponse({ data: [...] }, request, 200);
  } catch (err) {
    return apiErrorResponse('Error message', request, 500);
  }
}
```

### Option 3: Per-Route Custom CORS

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { applyCORSHeaders } from '@/lib/cors-middleware';

export async function GET(request: NextRequest) {
  const response = NextResponse.json({ data: [...] });
  return applyCORSHeaders(response, request);
}
```

---

## Browser Examples

### Frontend Making Cross-Origin Request

```typescript
// From https://app.fastship.com calling https://api.fastship.com
const response = await fetch('https://api.fastship.com/api/shipments', {
  method: 'GET',
  credentials: 'include', // Include cookies if needed
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token',
  },
});

const data = await response.json();
```

### React Component Example

```typescript
'use client';
import { useEffect, useState } from 'react';

export function ShipmentsList() {
  const [shipments, setShipments] = useState([]);

  useEffect(() => {
    const fetchShipments = async () => {
      const response = await fetch('/api/shipments', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setShipments(data.data);
      }
    };

    fetchShipments();
  }, []);

  return (
    <div>
      {shipments.map(ship => (
        <div key={ship.id}>{ship.name}</div>
      ))}
    </div>
  );
}
```

### Using API Keys (No Credentials)

```typescript
// Third-party app making request with API key
const response = await fetch('https://api.fastship.com/api/shipments', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer sk_test_abc123...',
  },
});

const data = await response.json();
```

---

## Testing CORS

### Test 1: Check CORS Preflight

```bash
curl -X OPTIONS https://api.fastship.com/api/shipments \
  -H "Origin: https://app.fastship.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Should see:
# Access-Control-Allow-Origin: https://app.fastship.com
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
```

### Test 2: Check Actual Request Headers

```bash
curl -X GET https://api.fastship.com/api/shipments \
  -H "Origin: https://app.fastship.com" \
  -H "Authorization: Bearer token" \
  -v

# Should see:
# Access-Control-Allow-Origin: https://app.fastship.com
# Access-Control-Allow-Credentials: true
```

### Test 3: Disallowed Origin

```bash
curl -X GET https://api.fastship.com/api/shipments \
  -H "Origin: https://malicious-site.com" \
  -v

# Should NOT see Access-Control-Allow-Origin header
# Browser will block the response
```

### Test 4: Browser DevTools

1. Open DevTools → Network tab
2. Make a fetch request from your app
3. Look for OPTIONS preflight request
4. Check Response Headers for CORS headers

```
Access-Control-Allow-Origin: https://app.fastship.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Credentials: true
```

---

## Environment Setup

### Development (.env.local)

```bash
# Allow local development on multiple ports
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:8080

# Local testing with different hosts
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://myapp.local:3000
```

### Staging (.env.staging)

```bash
# Staging deployments
ALLOWED_ORIGINS=https://staging-app.fastship.com,https://staging-dashboard.fastship.com,http://localhost:3000
```

### Production (.env.production)

```bash
# Production only - be specific!
ALLOWED_ORIGINS=https://app.fastship.com,https://mobile.fastship.com,https://dashboard.fastship.com,https://admin.fastship.com
```

---

## Security Best Practices

### ✅ DO:

- **Whitelist specific domains** — Don't use `*` in production
- **Use HTTPS** — Require secure protocol in production
- **Environment-specific config** — Different origins for dev/staging/prod
- **Rotate domains** — Update ALLOWED_ORIGINS when changing deployment
- **Monitor CORS errors** — Log rejected origins to catch attacks
- **Validate tokens** — Don't rely on CORS alone for security

### ❌ DON'T:

- **Don't use `*` in production** — Too permissive
- **Don't hardcode origins** — Use environment variables
- **Don't trust Origin header alone** — Validate tokens + credentials
- **Don't expose sensitive endpoints** — Require authentication
- **Don't log full API responses to console** — Credentials could leak

---

## Troubleshooting

### Issue: "Access to XMLHttpRequest has been blocked by CORS policy"

**Cause:** Origin not in `ALLOWED_ORIGINS`

**Solution:**
1. Check browser console for Origin header
2. Add origin to `ALLOWED_ORIGINS` environment variable
3. Restart server
4. Clear browser cache

```bash
# Before: ALLOWED_ORIGINS=https://app.fastship.com
# After:  ALLOWED_ORIGINS=https://app.fastship.com,https://new-app.fastship.com
```

### Issue: Preflight request fails (no CORS headers)

**Cause:** Server not handling OPTIONS request

**Solution:**
- Ensure middleware is applied globally
- Check request path is in validator
- Verify origin matches ALLOWED_ORIGINS pattern

### Issue: Works locally but fails in production

**Cause:** Different environment variables

**Solution:**
1. Check production `.env` file
2. Verify `ALLOWED_ORIGINS` includes production domain
3. Restart production server after env change
4. Clear CDN cache if using one

### Issue: Credentials not being sent

**Cause:** Missing `credentials: 'include'` in fetch

**Solution:**
```typescript
// ❌ Won't send cookies
fetch('/api/shipments')

// ✅ Will send cookies
fetch('/api/shipments', {
  credentials: 'include'
})
```

---

## Architecture Summary

```
Browser (https://app.fastship.com)
         ↓
    Makes request to API
         ↓
Middleware receives request
         ↓
Checks if ALLOWED_ORIGINS includes origin
         ↓
If OPTIONS (preflight): respond with 204 + CORS headers
If POST/PUT/DELETE: validate CSRF + auth, add CORS headers
If GET: validate auth (if needed), add CORS headers
         ↓
Response returned to browser with Access-Control-Allow-Origin
         ↓
Browser allows/blocks response based on header
```

---

## Next Steps

### Immediate:
1. Set `.env.local` with `ALLOWED_ORIGINS`
2. Test with multiple local domains
3. Verify preflight requests work

### Optional:
- Add CORS logging/monitoring
- Create analytics for blocked origins
- Set up alerts for suspicious CORS patterns
- Document allowed origins for team

### Advanced:
- Rate limiting by origin (optional)
- Dynamic origin validation (advanced)
- CORS certificate pinning (optional)
- Analytics dashboard for API access patterns

---

## Files Reference

| File | Purpose |
|------|---------|
| `lib/cors.ts` | Core CORS validation logic |
| `lib/cors-middleware.ts` | Middleware integration |
| `lib/api-response.ts` | Helper functions for responses |
| `middleware.ts` | Global CORS handling |

---

## Complete Implementation Checklist

- ✅ CORS utilities created
- ✅ Middleware updated with preflight handling
- ✅ Automatic CORS header application
- ✅ API response helpers
- ✅ Environment-based configuration
- ✅ Wildcard subdomain support
- ✅ Documentation complete

---

## Questions?

See the implementation files for detailed examples and comments explaining each function.

Testing CORS? Use the curl examples above or check browser DevTools → Network tab.
