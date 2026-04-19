# Authentication Middleware - Quick Reference

## Import

```typescript
import { protectRoute } from '@fastship/lib';
```

## Basic Pattern

```typescript
export async function GET(request: NextRequest) {
  const auth = await protectRoute(request);
  if (!auth.authenticated) return auth.response;
  
  // Your code here
  // Use: auth.userId, auth.userRole, auth.user
}
```

---

## Common Use Cases

### 1. No Role Required (Any Authenticated User)
```typescript
const auth = await protectRoute(request);
if (!auth.authenticated) return auth.response;
```

### 2. Specific Role Required
```typescript
const auth = await protectRoute(request, {
  requiredRole: 'SELLER',
});
if (!auth.authenticated) return auth.response;
```

### 3. Multiple Roles Allowed
```typescript
const auth = await protectRoute(request, {
  allowedRoles: ['SELLER', 'BUSINESS'],
});
if (!auth.authenticated) return auth.response;
```

---

## Access User Info

```typescript
const auth = await protectRoute(request);

// User ID
const userId = auth.userId;

// User Role
const userRole = auth.userRole; // 'DRIVER' | 'SELLER' | 'BUSINESS' | 'ADMIN'

// User Object
const user = auth.user; // { id, email, role, jobId }
```

---

## Role Values

| Role | Description |
|------|-------------|
| `DRIVER` | Delivery driver |
| `SELLER` | E-commerce seller |
| `BUSINESS` | Logistics business |
| `ADMIN` | System administrator |

---

## API Response Examples

### Success
```typescript
return NextResponse.json({
  userId: auth.userId,
  role: auth.userRole,
  data: { /* your data */ }
});
```

### Not Authenticated (401)
```typescript
// Automatically returned if auth fails
{
  "message": "No authentication token provided",
  "status": 401
}
```

### Wrong Role (403)
```typescript
// Automatically returned if role doesn't match
{
  "message": "This action requires SELLER role",
  "status": 403
}
```

---

## All HTTP Methods

```typescript
// GET - Read only
export async function GET(request: NextRequest) {
  const auth = await protectRoute(request);
  if (!auth.authenticated) return auth.response;
  // ...
}

// POST - Create
export async function POST(request: NextRequest) {
  const auth = await protectRoute(request);
  if (!auth.authenticated) return auth.response;
  // ...
}

// PUT - Replace
export async function PUT(request: NextRequest) {
  const auth = await protectRoute(request);
  if (!auth.authenticated) return auth.response;
  // ...
}

// PATCH - Partial update
export async function PATCH(request: NextRequest) {
  const auth = await protectRoute(request);
  if (!auth.authenticated) return auth.response;
  // ...
}

// DELETE - Remove
export async function DELETE(request: NextRequest) {
  const auth = await protectRoute(request);
  if (!auth.authenticated) return auth.response;
  // ...
}
```

---

## Specific Route Protection Functions

If you want to be explicit about HTTP methods:

```typescript
// For GET endpoints only
import { protectGetRoute } from '@fastship/lib';
const auth = await protectGetRoute(request);

// For POST endpoints
import { protectPostRoute } from '@fastship/lib';
const auth = await protectPostRoute(request);

// For PUT endpoints
import { protectPutRoute } from '@fastship/lib';
const auth = await protectPutRoute(request);

// For DELETE endpoints
import { protectDeleteRoute } from '@fastship/lib';
const auth = await protectDeleteRoute(request);

// For PATCH endpoints
import { protectPatchRoute } from '@fastship/lib';
const auth = await protectPatchRoute(request);
```

---

## Real Example

```typescript
// apps/api/app/api/orders/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@fastship/lib';
import { prisma } from '@fastship/lib';

// GET /api/orders - List orders (for authenticated users)
export async function GET(request: NextRequest) {
  const auth = await protectRoute(request);
  if (!auth.authenticated) return auth.response;

  const orders = await prisma.order.findMany({
    where: { userId: auth.userId },
  });

  return NextResponse.json(orders);
}

// POST /api/orders - Create order (for authenticated users)
export async function POST(request: NextRequest) {
  const auth = await protectRoute(request);
  if (!auth.authenticated) return auth.response;

  const body = await request.json();
  
  const order = await prisma.order.create({
    data: {
      ...body,
      userId: auth.userId,
    },
  });

  return NextResponse.json(order, { status: 201 });
}
```

---

## Error Handling

### Check Authentication First
```typescript
const auth = await protectRoute(request);
if (!auth.authenticated) return auth.response;
// Safe to use auth.userId, auth.userRole now
```

### Handle Missing Data
```typescript
const auth = await protectRoute(request);
if (!auth.authenticated) return auth.response;

const user = await prisma.user.findUnique({
  where: { id: auth.userId },
});

if (!user) {
  return NextResponse.json(
    { error: 'User not found' },
    { status: 404 }
  );
}
```

### Validate Request Body
```typescript
export async function POST(request: NextRequest) {
  const auth = await protectRoute(request);
  if (!auth.authenticated) return auth.response;

  const body = await request.json();
  
  // Validate required fields
  if (!body.name || !body.email) {
    return NextResponse.json(
      { error: 'Name and email are required' },
      { status: 400 }
    );
  }

  // Create...
}
```

---

## Testing

### With cURL
```bash
# No token - should fail with 401
curl http://localhost:3000/api/orders

# With token - should work
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/orders
```

### In Browser Console
```javascript
const token = localStorage.getItem('auth_token');
const response = await fetch('http://localhost:3000/api/orders', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
console.log(await response.json());
```

---

## Checklist for API Routes

- [ ] Import `protectRoute` from `@fastship/lib`
- [ ] Call `protectRoute()` at start of handler
- [ ] Check `if (!auth.authenticated) return auth.response;`
- [ ] Use `auth.userId` for user-specific queries
- [ ] Specify `requiredRole` if role-restricted
- [ ] Test with and without authentication token
- [ ] Handle errors properly (400, 403, 404)
- [ ] Return appropriate HTTP status codes

---

## File Locations

- **Middleware**: `packages/lib/middleware/auth.middleware.ts`
- **Route Protection**: `packages/lib/middleware/route.protection.ts`
- **Main Guide**: `MIDDLEWARE_SETUP_GUIDE.md`
- **Examples**: `EXAMPLE_API_ROUTE.ts`, `EXAMPLE_ROLE_ROUTES.ts`

---

## Support

For detailed information, see:
- `MIDDLEWARE_SETUP_GUIDE.md` - Full documentation
- `EXAMPLE_API_ROUTE.ts` - Complete working example
- `EXAMPLE_ROLE_ROUTES.ts` - Role-based examples
