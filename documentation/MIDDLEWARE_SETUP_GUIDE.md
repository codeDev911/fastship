# Authentication Middleware Setup Guide

## Overview

Comprehensive authentication middleware system for protecting API routes with JWT token validation and role-based access control.

---

## Files Created

### 1. **Auth Middleware** (`packages/lib/middleware/auth.middleware.ts`)
Core authentication middleware for JWT validation.

**Functions:**
- `requireAuth()` - Validates JWT token
- `requireCSRF()` - Validates CSRF token
- `requireAuthAndCSRF()` - Validates both
- `authError()` - Error response helper
- `authSuccess()` - Success response helper with auth context

**Options:**
```typescript
interface AuthMiddlewareOptions {
  requiredRole?: 'DRIVER' | 'SELLER' | 'BUSINESS' | 'ADMIN';
  allowedRoles?: Array<'DRIVER' | 'SELLER' | 'BUSINESS' | 'ADMIN'>;
  checkCSRF?: boolean;
}
```

### 2. **Route Protection** (`packages/lib/middleware/route.protection.ts`)
Ready-to-use route protection functions.

**Functions:**
- `protectGetRoute()` - Protect GET endpoints (auth only)
- `protectPostRoute()` - Protect POST endpoints (auth + CSRF)
- `protectPutRoute()` - Protect PUT endpoints (auth + CSRF)
- `protectDeleteRoute()` - Protect DELETE endpoints (auth + CSRF)
- `protectPatchRoute()` - Protect PATCH endpoints (auth + CSRF)
- `protectRoute()` - Auto-detect method and protect accordingly

---

## Usage Examples

### Basic API Route Protection

```typescript
// app/api/users/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@fastship/lib';

export async function GET(request: NextRequest) {
  // Check authentication
  const auth = await protectRoute(request);
  if (!auth.authenticated) return auth.response;

  const { userId, userRole } = auth;

  // Your handler logic
  return NextResponse.json({
    message: `Hello ${userId}`,
    role: userRole,
  });
}
```

### Protected POST Endpoint

```typescript
// app/api/shipments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@fastship/lib';

export async function POST(request: NextRequest) {
  // Check auth + CSRF
  const auth = await protectRoute(request);
  if (!auth.authenticated) return auth.response;

  const { userId } = auth;
  const body = await request.json();

  // Your handler logic
  return NextResponse.json({
    message: 'Shipment created',
    createdBy: userId,
  });
}
```

### Role-Based Access Control

```typescript
// app/api/business/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@fastship/lib';

export async function PUT(request: NextRequest) {
  // Only BUSINESS users can update business settings
  const auth = await protectRoute(request, {
    requiredRole: 'BUSINESS',
  });
  if (!auth.authenticated) return auth.response;

  const { userId } = auth;
  const body = await request.json();

  // Update business settings for this user
  return NextResponse.json({
    message: 'Business settings updated',
    updatedBy: userId,
  });
}
```

### Multiple Allowed Roles

```typescript
// app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@fastship/lib';

export async function GET(request: NextRequest) {
  // Sellers and Business can access analytics
  const auth = await protectRoute(request, {
    allowedRoles: ['SELLER', 'BUSINESS'],
  });
  if (!auth.authenticated) return auth.response;

  const { userId, userRole } = auth;

  // Return role-specific analytics
  return NextResponse.json({
    userId,
    userRole,
    analytics: {
      /* analytics data */
    },
  });
}
```

### Using requireAuth Directly

```typescript
// app/api/drivers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, authError } from '@fastship/lib';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, {
    requiredRole: 'DRIVER',
  });

  if (!auth.authenticated) {
    return auth.response;
  }

  return NextResponse.json({
    driver: {
      id: auth.userId,
      role: auth.userRole,
    },
  });
}

export async function POST(request: NextRequest) {
  // Manual error handling
  const auth = await requireAuth(request);
  
  if (!auth.authenticated) {
    return authError('Authentication required', 401);
  }

  // Check CSRF manually if needed
  const csrfToken = request.headers.get('x-csrf-token');
  if (!csrfToken) {
    return authError('CSRF token required', 403);
  }

  return NextResponse.json({ message: 'OK' });
}
```

---

## Complete API Examples

### Example 1: User Profile API

```typescript
// app/api/users/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { protectRoute, authSuccess } from '@fastship/lib';
import { prisma } from '@fastship/lib';

export async function GET(request: NextRequest) {
  const auth = await protectRoute(request);
  if (!auth.authenticated) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return authSuccess(user, auth.userId);
}

export async function PUT(request: NextRequest) {
  const auth = await protectRoute(request);
  if (!auth.authenticated) return auth.response;

  const { name, phone } = await request.json();

  const user = await prisma.user.update({
    where: { id: auth.userId },
    data: { name, phone },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  return authSuccess(user, auth.userId);
}
```

### Example 2: Role-Specific Handler

```typescript
// app/api/sellers/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@fastship/lib';
import { prisma } from '@fastship/lib';

export async function GET(request: NextRequest) {
  const auth = await protectRoute(request, {
    requiredRole: 'SELLER',
  });
  if (!auth.authenticated) return auth.response;

  const products = await prisma.product.findMany({
    where: { sellerId: auth.userId },
  });

  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const auth = await protectRoute(request, {
    requiredRole: 'SELLER',
  });
  if (!auth.authenticated) return auth.response;

  const data = await request.json();

  const product = await prisma.product.create({
    data: {
      ...data,
      sellerId: auth.userId,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
```

### Example 3: Multi-Role Handler

```typescript
// app/api/shipments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@fastship/lib';
import { prisma } from '@fastship/lib';

export async function GET(request: NextRequest) {
  const auth = await protectRoute(request, {
    allowedRoles: ['SELLER', 'BUSINESS', 'DRIVER'],
  });
  if (!auth.authenticated) return auth.response;

  let shipments;

  if (auth.userRole === 'SELLER') {
    // Get seller's products' shipments
    shipments = await prisma.shipment.findMany({
      where: { product: { sellerId: auth.userId } },
    });
  } else if (auth.userRole === 'BUSINESS') {
    // Get business's shipments
    shipments = await prisma.shipment.findMany({
      where: { businessId: auth.userId },
    });
  } else if (auth.userRole === 'DRIVER') {
    // Get assigned shipments
    shipments = await prisma.shipment.findMany({
      where: { driverId: auth.userId },
    });
  }

  return NextResponse.json(shipments);
}
```

---

## Middleware Configuration

### Environment Variables

Ensure these are set in `.env`:

```env
JWT_SECRET="your-secret-key-here"
NEXT_PUBLIC_MARKETING_BASE_URL=http://localhost:3004
```

### Middleware.ts Configuration

The root `middleware.ts` already handles:
- CORS preflight requests
- Public API route filtering
- CSRF validation
- Role-based page route protection

No additional configuration needed!

---

## Error Handling

### Common Status Codes

| Code | Scenario | Solution |
|------|----------|----------|
| 401 | No token provided | User needs to login |
| 401 | Invalid token | Token is malformed or tampered |
| 401 | Token expired | User needs to refresh/login |
| 403 | Wrong role | User role not allowed for this endpoint |
| 403 | CSRF token missing | Add CSRF token to request headers |

### Error Response Example

```typescript
// When authentication fails:
{
  "message": "No authentication token provided",
  "status": 401
}

// When role is insufficient:
{
  "message": "This action requires BUSINESS role",
  "status": 403
}
```

---

## Security Best Practices

### 1. Always Use protectRoute()
```typescript
// ✅ Good - automatic method detection
const auth = await protectRoute(request);

// ✅ Also good - explicit method protection
const auth = await protectPostRoute(request);

// ❌ Avoid - leaving endpoints unprotected
export async function POST(request) {
  // No auth check!
}
```

### 2. Check Role Before Accessing User Data
```typescript
// ✅ Good - verify role
if (auth.userRole !== 'SELLER') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// ❌ Bad - assuming role without checking
const sellerId = auth.userId; // Might not be a seller!
```

### 3. Use Specific Role Checks
```typescript
// ✅ Best - explicit role requirement
const auth = await protectRoute(request, {
  requiredRole: 'BUSINESS',
});

// ✅ Good - multiple roles allowed
const auth = await protectRoute(request, {
  allowedRoles: ['SELLER', 'BUSINESS'],
});
```

### 4. Log Authentication Failures
```typescript
const auth = await protectRoute(request);
if (!auth.authenticated) {
  console.error('[API] Unauthorized access attempt:', {
    path: request.nextUrl.pathname,
    method: request.method,
  });
  return auth.response;
}
```

---

## Testing Middleware

### Test with cURL

```bash
# Without token - should fail
curl http://localhost:3000/api/users/me

# With token - should work
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/users/me
```

### Test with JavaScript

```javascript
// From browser console
const token = localStorage.getItem('auth_token');

const response = await fetch('http://localhost:3000/api/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

console.log(await response.json());
```

---

## Troubleshooting

### Issue: "No authentication token provided"

**Cause:** Token not in request
**Solution:**
1. Check token is in localStorage: `localStorage.getItem('auth_token')`
2. Include token in request headers
3. Or rely on cookies (automatic from browser)

### Issue: "Invalid or malformed authentication token"

**Cause:** Token is corrupted or from wrong secret
**Solution:**
1. Login again to get new token
2. Check JWT_SECRET matches server
3. Clear localStorage and re-login

### Issue: "This action requires BUSINESS role"

**Cause:** User role doesn't match required role
**Solution:**
1. Login with correct account
2. Check user role in database
3. Use allowedRoles for multiple roles

---

## Integration with Existing APIs

### Migrate Existing Unprotected Routes

Before:
```typescript
export async function GET(request: NextRequest) {
  // No auth check
  return NextResponse.json({ data: [] });
}
```

After:
```typescript
import { protectRoute } from '@fastship/lib';

export async function GET(request: NextRequest) {
  const auth = await protectRoute(request);
  if (!auth.authenticated) return auth.response;
  
  return NextResponse.json({ data: [] });
}
```

---

## Summary

The authentication middleware provides:

✅ **JWT Token Validation** - Secure token verification
✅ **Role-Based Access** - Control endpoints by user role
✅ **CSRF Protection** - Automatic CSRF token validation
✅ **Easy Integration** - Simple, consistent API
✅ **Flexible** - Works with any request handler
✅ **Type-Safe** - Full TypeScript support

Use `protectRoute()` on every API endpoint that requires authentication!
