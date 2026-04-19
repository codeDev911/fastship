# CSRF Protection Implementation Guide

## Overview

This project now has **CSRF token protection** to prevent Cross-Site Request Forgery attacks. This means:

✅ **Stops malicious sites from hijacking your logged-in users** — Even if someone tricks a user into visiting a malicious site, that site cannot make API calls (like transfer funds) using the user's credentials.

✅ **Automatic CSRF token injection** — Use `secureFetch` instead of native `fetch()` and the CSRF token is automatically added.

✅ **15-minute token refresh** — Tokens expire and auto-refresh when needed.

---

## How It Works

1. **Login** → Server creates JWT auth token + CSRF token
2. **Frontend caches CSRF token** via `lib/secure-fetch.ts`
3. **All state-changing API calls** (POST/PUT/DELETE/PATCH) automatically include CSRF token in `X-CSRF-Token` header
4. **Middleware validates CSRF token** on every state-changing request
5. **Invalid/expired tokens** trigger automatic refresh or return 403 error
6. **Logout** → CSRF token is cleared

---

## Usage

### Option 1: Use `secureFetch` (Recommended)

Replace native `fetch()` with `secureFetch()` for **all API calls**:

```typescript
import { secureFetch } from '@/lib/secure-fetch';

// GET request (no CSRF needed, but credentials included)
const response = await secureFetch('/api/shipments');
const data = await response.json();

// POST request (CSRF token automatically added)
const response = await secureFetch('/api/transactions/transfer-funds', {
  method: 'POST',
  body: JSON.stringify({
    from: 'DRIVER',
    to: 'BUSINESS',
    fromId: driverId,
    toId: businessId,
    amount: 1000,
    description: 'Payment for shipment',
  }),
});

if (!response.ok) {
  const error = await response.json();
  console.error('API Error:', error);
}

const result = await response.json();
console.log('Success:', result);
```

### Option 2: Manual CSRF Token Header

If you need fine-grained control:

```typescript
import { secureFetch, refreshCSRFToken } from '@/lib/secure-fetch';

// Manually add CSRF token
const csrfToken = await refreshCSRFToken();
const response = await fetch('/api/transactions/transfer-funds', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken, // Add this header
  },
  body: JSON.stringify(data),
  credentials: 'include',
});
```

---

## Updating Existing Components

### Before (Without CSRF)
```typescript
// ❌ Not protected
const res = await fetch('/api/wallets?driverId=${driverId}');
const data = await res.json();

// ❌ Not protected - vulnerable to CSRF
const res2 = await fetch('/api/transactions/transfer-funds', {
  method: 'POST',
  body: JSON.stringify({ from, to, fromId, toId, amount, description })
});
```

### After (With CSRF)
```typescript
import { secureFetch } from '@/lib/secure-fetch';

// ✅ Protected - credentials included, GET requests work as-is
const res = await secureFetch('/api/wallets?driverId=${driverId}');
const data = await res.json();

// ✅ Protected - CSRF token automatically added to POST requests
const res2 = await secureFetch('/api/transactions/transfer-funds', {
  method: 'POST',
  body: JSON.stringify({ from, to, fromId, toId, amount, description })
});
```

---

## Example: Update a Component

### Step 1: Import secureFetch
```typescript
import { secureFetch } from '@/lib/secure-fetch';
```

### Step 2: Replace fetch with secureFetch
```typescript
// Old: 
// const response = await fetch('/api/shipments', { method: 'POST', body: JSON.stringify(data) });

// New:
const response = await secureFetch('/api/shipments', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

### Example Component (DeptFundReleaseModal.tsx)
```typescript
import { secureFetch } from '@/lib/secure-fetch';

// In modal submit handler:
const handleSubmit = async () => {
  try {
    const response = await secureFetch('/api/transactions/release-debt-fund', {
      method: 'POST',
      body: JSON.stringify({
        driverId,
        amount,
        description: 'Debt fund release'
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    setSucess(true);
  } catch (error) {
    setError(error.message);
  }
};
```

---

## API Route Protection

### Apply CSRF Protection to Your API Routes

All **POST/PUT/DELETE/PATCH** routes are automatically validated by middleware. To explicitly add CSRF validation in a route:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { validateCSRFMiddleware, csrfErrorResponse } from '@/lib/csrf-middleware';

export async function POST(request: NextRequest) {
  // Validate CSRF token
  if (!validateCSRFMiddleware(request)) {
    return csrfErrorResponse();
  }

  const data = await request.json();
  // ... rest of your logic
}
```

### Already Protected Routes (via middleware)
- ✅ All `/api/*` POST/PUT/DELETE/PATCH routes
- ❌ GET requests (don't need CSRF protection - read-only)
- ❌ `/api/auth/login` (public, uses credentials: 'include')
- ❌ `/api/auth/register/*` (public registration)

---

## Getting CSRF Token

If frontend needs to get initial CSRF token:

```typescript
const response = await fetch('/api/auth/csrf-token', {
  method: 'GET',
  credentials: 'include',
});

const { csrfToken } = await response.json();
console.log('Fresh CSRF token:', csrfToken);
```

---

## Environment Variables

Ensure these are set:

```bash
JWT_SECRET=your-very-secure-secret-key-change-in-production
NODE_ENV=production  # for secure cookies
```

---

## Testing CSRF Protection

### Test 1: Verify CSRF Token is Required
```bash
# This should FAIL with 403 (CSRF token missing)
curl -X POST http://localhost:3000/api/transactions/transfer-funds \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=xxx; user_role=DRIVER" \
  -d '{"from":"DRIVER","to":"BUSINESS","amount":100}'

# Response: 403 - CSRF token validation failed
```

### Test 2: Verify CSRF Token Works
```typescript
// 1. Get auth token (login)
const loginRes = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, role: 'DRIVER' }),
  credentials: 'include',
});

// 2. Get CSRF token
const csrfRes = await fetch('/api/auth/csrf-token', {
  credentials: 'include',
});
const { csrfToken } = await csrfRes.json();

// 3. Make protected API call with CSRF token
const response = await fetch('/api/transactions/transfer-funds', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify({ ... }),
  credentials: 'include',
});

// Should succeed with 200/201
```

### Test 3: Verify External Site Blocked
1. Open your app: `http://localhost:3000` (logged in)
2. In DevTools console, run:
```typescript
// This should FAIL because malicious site can't get CSRF token
fetch('http://localhost:3000/api/transactions/transfer-funds', {
  method: 'POST',
  body: JSON.stringify({ from: 'DRIVER', amount: 1000 }),
  credentials: 'include',
}).then(r => r.json()).then(console.log);
// Response: 403 - CSRF token validation failed
```

---

## Troubleshooting

### Issue: "CSRF token validation failed"

1. **Check if secureFetch is being used** — Make sure you're using `secureFetch` not `fetch`
2. **Verify page refresh** — CSRF token expires in 15 minutes. If you see this after a long session, refresh the page
3. **Check browser console** — Look for warnings about CSRF token refresh

### Issue: "No CSRF token provided in headers"

This should not happen if using `secureFetch`. If it does:
1. Clear browser cache + local storage
2. Log out and log back in
3. Verify `/api/auth/csrf-token` endpoint is reachable

### Issue: API calls working without secureFetch

This is a **SECURITY ISSUE**. The middleware will still validate tokens on the server, but the frontend should be using `secureFetch` for consistency. Even without CSRF tokens, the API routes have JWT auth protection.

---

## Security Checklist

- ✅ All API calls use `secureFetch` (or manually include CSRF token header)
- ✅ `JWT_SECRET` is set to a strong, unique value in production
- ✅ Cookies are set to `secure` and `httpOnly` (automatic in production)
- ✅ CSRF tokens expire in 15 minutes
- ✅ No sensitive data in localStorage (only user object)
- ✅ All sensitive operations (transfer funds, rate card updates) require CSRF token

---

## Next Steps (Phase 2 & 3)

### Phase 2: Third-Party API Keys (Optional)
- Generate API keys for external integrations
- Use `Authorization: Bearer {apiKey}` header
- Implement rate limiting per API key

### Phase 3: Multi-Domain CORS
- Add `ALLOWED_ORIGINS` environment variable
- Update middleware to validate CORS headers
- Support multiple frontend domains

---

## Questions?

If you encounter issues or need to extend CSRF protection, check:
1. [lib/csrf.ts](../../lib/csrf.ts) — Token generation/verification logic
2. [lib/csrf-middleware.ts](../../lib/csrf-middleware.ts) — Middleware validation
3. [lib/secure-fetch.ts](../../lib/secure-fetch.ts) — Frontend fetch wrapper
4. [middleware.ts](../../middleware.ts) — Global middleware configuration
