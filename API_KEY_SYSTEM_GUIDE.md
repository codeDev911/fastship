# Phase 2: Third-Party API Key System

## Overview

This phase adds **API key authentication** for third-party integrations and external applications. This allows:

✅ **Third-party integrations** to access your APIs without logging in  
✅ **Rate limiting** per API key (configurable requests per hour)  
✅ **Permission scopes** to control what each API key can do (read/write/admin)  
✅ **Auto-tracking** of API key usage and IP addresses  
✅ **Expiration dates** for temporary access tokens  

---

## Architecture

### Three Authentication Methods Now Available

| Method | Use Case | Token Storage | Validation |
|--------|----------|---------------|-----------|
| **JWT + CSRF** | Frontend web app | HTTP-only cookies | CSRF middleware |
| **API Key** | Third-party integrations | Bearer token header | API key middleware |
| **Both** | Your own mobile/desktop apps | Bearer token or cookies | Both methods supported |

---

## How API Keys Work

```
1. User generates API key in settings (or via /api/auth/api-keys)
   ↓ Returns: "sk_test_abcdef1234567890..." (shown once!)
   ↓ Stores: Hashed version in database

2. Third party receives the API key
   ↓ Stores it securely (env var, secrets manager, etc.)

3. Third party makes request with API key
   ↓ Header: Authorization: Bearer sk_test_abcdef1234567890...

4. Middleware validates key
   ✓ Key exists and is active
   ✓ Not revoked or expired
   ✓ Rate limit not exceeded
   ✓ User authenticated

5. API endpoint processes request
   ↓ Returns data

6. Middleware logs usage
   ↓ Updates lastUsedAt, requestCount, requestCountHour
```

---

## Setup & Configuration

### Step 1: Run Prisma Migration

First, update your database with the new `ApiKey` model:

```bash
npx prisma migrate dev --name add_api_keys
```

This will:
- Create `ApiKey` table
- Add ApiKey relation to User model
- Create indexes for performance

### Step 2: Environment Variables

No new environment variables needed! Uses existing `JWT_SECRET`.

---

## Usage

### For Frontend: Generating API Keys (Optional)

Users can generate API keys in their dashboard settings:

```typescript
// GET: Retrieve all API keys
const response = await secureFetch('/api/auth/api-keys');
const { data: apiKeys } = await response.json();
console.log(apiKeys);
// [
//   { id: '...', name: 'Shopify Integration', prefix: 'sk_test_abc...', scope: 'read', rateLimit: 1000, ... },
//   { id: '...', name: 'Custom App', prefix: 'sk_live_xyz...', scope: 'read,write', rateLimit: 5000, ... }
// ]

// POST: Create new API key
const response = await secureFetch('/api/auth/api-keys', {
  method: 'POST',
  body: JSON.stringify({
    name: 'My Integration',
    scope: 'read,write',        // "read", "write", "admin", or comma-separated
    rateLimit: 1000,            // Requests per hour (default: 1000)
    environment: 'test',        // 'test' or 'live' (affects key prefix: sk_test_ vs sk_live_)
    expiresAt: new Date('2025-12-31').toISOString(), // Optional: expiration date
  }),
});

const { data, key } = await response.json();
console.log('Full API Key:', key);        // ONLY SHOWN ONCE!
console.log('Save for display:', data.prefix); // sk_test_abc123...
// User must copy and save the full key immediately!

// PATCH: Update API key settings
const response = await secureFetch(`/api/auth/api-keys/${keyId}`, {
  method: 'PATCH',
  body: JSON.stringify({
    name: 'Updated Name',
    scope: 'read',              // Change permissions
    rateLimit: 500,             // Change rate limit
  }),
});

// DELETE: Revoke an API key
const response = await secureFetch(`/api/auth/api-keys/${keyId}`, {
  method: 'DELETE',
});
console.log('API key revoked');
```

### For Third-Party: Using API Keys

Third parties use API keys with the `Authorization: Bearer` header:

```bash
# Example: Using curl
curl -X GET https://api.fastship.com/api/shipments \
  -H "Authorization: Bearer sk_test_abcdef1234567890..."

# With parameters
curl -X POST https://api.fastship.com/api/shipments \
  -H "Authorization: Bearer sk_test_abcdef1234567890..." \
  -H "Content-Type: application/json" \
  -d '{ "pickupName": "John", ... }'
```

**JavaScript/Node.js:**

```typescript
// Third parties can call your APIs directly with API key
const response = await fetch('https://api.fastship.com/api/shipments', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer sk_test_abcdef1234567890...`,
    'Content-Type': 'application/json',
  },
});

const shipments = await response.json();
console.log(shipments);
```

**Python:**

```python
import requests

headers = {
    'Authorization': 'Bearer sk_test_abcdef1234567890...',
    'Content-Type': 'application/json',
}

response = requests.get('https://api.fastship.com/api/shipments', headers=headers)
shipments = response.json()
print(shipments)
```

---

## API Reference

### Generate API Key

```http
POST /api/auth/api-keys
Authorization: Bearer {jwt_token} or Cookie: auth_token={token}
Content-Type: application/json
X-CSRF-Token: {csrf_token}

{
  "name": "My Integration",
  "scope": "read,write",
  "rateLimit": 1000,
  "environment": "test",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Response:**

```json
{
  "message": "API key created successfully...",
  "data": {
    "id": "key_12345",
    "name": "My Integration",
    "prefix": "sk_test_abc123...",
    "scope": "read,write",
    "rateLimit": 1000,
    "createdAt": "2024-04-14T10:00:00Z",
    "key": "sk_test_abcdef1234567890..." // ONLY RETURNED ONCE!
  }
}
```

### List API Keys

```http
GET /api/auth/api-keys
Authorization: Bearer {jwt_token} or Cookie: auth_token={token}
```

**Response:**

```json
{
  "data": [
    {
      "id": "key_123",
      "name": "Shopify",
      "prefix": "sk_test_abc123...",
      "scope": "read",
      "rateLimit": 1000,
      "isActive": true,
      "lastUsedAt": "2024-04-14T09:30:00Z",
      "requestCount": 45000,
      "createdAt": "2024-03-01T00:00:00Z",
      "expiresAt": null,
      "revokedAt": null
    }
  ],
  "count": 1
}
```

### Update API Key

```http
PATCH /api/auth/api-keys/{id}
Authorization: Bearer {jwt_token} or Cookie: auth_token={token}
X-CSRF-Token: {csrf_token}

{
  "name": "Updated Name",
  "scope": "read",
  "rateLimit": 500
}
```

### Revoke API Key

```http
DELETE /api/auth/api-keys/{id}
Authorization: Bearer {jwt_token} or Cookie: auth_token={token}
X-CSRF-Token: {csrf_token}
```

---

## Scope Permissions

API key scopes control what actions third parties can perform:

| Scope | Permissions |
|-------|-------------|
| `read` | GET requests only (read shipments, get rates, etc.) |
| `write` | POST/PUT requests (create shipments, update rates, etc.) |
| `all` | Full access (read + write + admin) |
| `read,write` | Combination of read and write |

**Best Practices:**
- Give `read` only for integrations that only query data
- Give `read,write` for integrations that create/update shipments
- Never give `all` unless absolutely necessary
- Rotate keys periodically

---

## Rate Limiting

Each API key has a rate limit (default: 1000 requests/hour):

- **Enforced hourly**: Counter resets every hour
- **Per-key basis**: Each API key has independent limit
- **Automatic tracking**: Last used IP, request count, timestamp tracked
- **Configurable**: Set custom limits when creating keys

**Rate Limit Response:**

```json
{
  "message": "Rate limit exceeded. Max 1000 requests per hour"
}
```

HTTP Status: `429 Too Many Requests`

---

## Dual Authentication in API Routes

Most routes now support **both** authentication methods:

```typescript
import { validateApiKey, apiKeyErrorResponse } from '@/lib/api-key-middleware';
import { validateCSRFMiddleware, csrfErrorResponse } from '@/lib/csrf-middleware';

export async function POST(request: NextRequest) {
  let userId: string | null = null;

  // Try API key first
  const apiKeyResult = await validateApiKey(request);
  if (apiKeyResult.valid) {
    userId = apiKeyResult.userId;
    console.log('Authenticated via API key');
  } else {
    // Fall back to CSRF + JWT
    if (!validateCSRFMiddleware(request)) {
      return csrfErrorResponse();
    }

    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify JWT...
    userId = /* extracted from token */;
    console.log('Authenticated via CSRF + JWT');
  }

  // Process request with userId...
}
```

---

## Security Best Practices

### For Your Platform

1. **Always hash API keys** before storing (done automatically in `generateApiKey()`)
2. **Show full key only once** when creating - users must save it immediately
3. **Display prefix** in list view (not full key)
4. **Track usage** - monitor suspicious activity
5. **Enforce HTTPS** in production (done via secure cookies)
6. **Rotate keys** - encourage users to rotate quarterly
7. **Scope minimally** - users should request least-privilege access
8. **Set expiration dates** for temporary integrations

### For Third Parties Using Your API

1. **Store keys securely** - use environment variables, not hardcoded
   ```bash
   # .env (not committed to git)
   FASTSHIP_API_KEY=sk_test_abcdef1234567890
   ```

2. **Rotate keys regularly** - quarterly minimum, monthly recommended

3. **Use separate keys per environment**
   - `sk_test_*` for development/testing
   - `sk_live_*` for production

4. **Monitor rate limits** - implement backoff/retry logic

5. **Never share keys** - treat like passwords

6. **Rotate immediately if exposed**

---

## Testing

### Test API Key Creation

```bash
# 1. Login to get JWT token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "user@example.com", "password": "pass123", "role": "SELLER" }' \
  -c cookies.txt

# 2. Get CSRF token
curl -X GET http://localhost:3000/api/auth/csrf-token \
  -b cookies.txt

# 3. Create API key
curl -X POST http://localhost:3000/api/auth/api-keys \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: {csrf_token_from_step2}" \
  -d '{
    "name": "My Test Key",
    "scope": "read",
    "rateLimit": 100,
    "environment": "test"
  }' \
  -b cookies.txt

# Response will include the full API key (shown only once!)
```

### Test API Key Usage

```bash
# Use the API key from previous step
curl -X GET http://localhost:3000/api/shipments \
  -H "Authorization: Bearer sk_test_abcdef1234567890..."

# Should return shipments list
```

### Test Rate Limiting

```bash
# Spam requests to hit rate limit
for i in {1..101}; do
  curl -X GET http://localhost:3000/api/shipments \
    -H "Authorization: Bearer sk_test_xxx..." \
    -H "X-Client-IP: 192.168.1.1"
done

# After 100 requests (if rateLimit=100), you should get 429
```

---

## Migration from Old System

If you're upgrading from JWT-only to dual authentication:

1. **Existing frontend** continues working with JWT + CSRF tokens (no changes needed)
2. **New integrations** can use API keys
3. **Gradual migration** - no need to force changes immediately

---

## Troubleshooting

### Issue: "Invalid API key"

1. Verify the exact API key string (no extra spaces)
2. Check if key has been revoked
3. Check if key has expired
4. Ensure Authorization header format: `Bearer sk_test_xxx`

### Issue: "Rate limit exceeded"

1. Check `rateLimit` setting on the API key
2. Verify current hour request count
3. Implement exponential backoff in client
4. Request rate limit increase if needed

### Issue: "API key does not have write permission"

1. Revoke old key
2. Create new key with `scope: "read,write"`
3. Update client to use new key

### Issue: Scope/Permissions Not Working

Check that the API route validates scopes:

```typescript
import { validateApiKeyScope } from '@/lib/api-key-middleware';

const hasWrite = await validateApiKeyScope(apiKeyId, 'write');
if (!hasWrite) {
  return NextResponse.json({ message: 'Permissions denied' }, { status: 403 });
}
```

---

## Next Steps

### Phase 3: Multi-Domain CORS
- Allow multiple frontend domains
- Configure ALLOWED_ORIGINS environment
- Support development + production simultaneously

### Optional: Webhook Delivery
- Send API key events to webhooks
- Notify integrations of rate limit warnings
- Alert on suspicious activity

### Optional: API Analytics Dashboard
- Show per-key request volume over time
- Identify unused keys
- Suggest key rotation
- Display top endpoints by requests

---

## Files Created/Modified

**Created:**
- `lib/api-key.ts` — API key generation/verification
- `lib/api-key-middleware.ts` — Middleware for validation + rate limiting
- `app/api/auth/api-keys/route.ts` — Create/list API keys
- `app/api/auth/api-keys/[id]/route.ts` — Update/revoke API keys
- `app/api/auth/shipments-example/route.ts` — Example dual-auth endpoint

**Modified:**
- `prisma/schema.prisma` — Added `ApiKey` model + User relation

---

## Questions?

- Need to adjust rate limits? Update in API key creation or via PATCH endpoint
- Want to add custom scopes? Extend `hasScope()` function in `lib/api-key.ts`
- Need webhook notifications? Can be added as optional feature
