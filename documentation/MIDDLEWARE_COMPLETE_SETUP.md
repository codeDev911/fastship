# Authentication Middleware - Complete Setup Summary

## ✅ What Has Been Set Up

### Files Created

1. **`packages/lib/middleware/auth.middleware.ts`**
   - Core authentication middleware
   - JWT token validation
   - CSRF protection
   - Role-based access control

2. **`packages/lib/middleware/route.protection.ts`**
   - Ready-to-use route protection functions
   - Automatic method detection
   - Easy to integrate into API routes

3. **`packages/lib/middleware/index.ts`**
   - Exports all middleware functions
   - Single import point for middleware

4. **Documentation Files:**
   - `MIDDLEWARE_SETUP_GUIDE.md` - Comprehensive guide
   - `MIDDLEWARE_QUICK_REFERENCE.md` - Quick reference
   - `EXAMPLE_API_ROUTE.ts` - Complete working example
   - `EXAMPLE_ROLE_ROUTES.ts` - Role-specific examples
   - `AUTH_IMPLEMENTATION_SUMMARY.md` - What was created (from previous request)
   - `UNIFIED_AUTHENTICATION_GUIDE.md` - Full auth system docs

### Files Modified

1. **`packages/lib/index.ts`**
   - Added middleware exports
   - All functions now available via `@fastship/lib`

---

## 🚀 Quick Start

### Step 1: Protect an API Route

```typescript
// apps/api/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@fastship/lib';

export async function GET(request: NextRequest) {
  // Check authentication
  const auth = await protectRoute(request);
  if (!auth.authenticated) return auth.response;

  // You're authenticated! Use auth.userId, auth.userRole
  return NextResponse.json({
    message: 'Success',
    userId: auth.userId,
  });
}
```

### Step 2: Protect by Role

```typescript
// Only SELLER can access
const auth = await protectRoute(request, {
  requiredRole: 'SELLER',
});
if (!auth.authenticated) return auth.response;
```

### Step 3: Allow Multiple Roles

```typescript
// SELLER and BUSINESS can access
const auth = await protectRoute(request, {
  allowedRoles: ['SELLER', 'BUSINESS'],
});
if (!auth.authenticated) return auth.response;
```

---

## 📋 Middleware Functions Available

### Import All
```typescript
import { 
  requireAuth,
  requireCSRF,
  requireAuthAndCSRF,
  protectRoute,
  protectGetRoute,
  protectPostRoute,
  protectPutRoute,
  protectDeleteRoute,
  protectPatchRoute,
  authError,
  authSuccess,
} from '@fastship/lib';
```

### Common Functions

| Function | Purpose | Use Case |
|----------|---------|----------|
| `protectRoute()` | Auto-detect method | Most endpoints |
| `protectGetRoute()` | Protect GET | Read-only endpoints |
| `protectPostRoute()` | Protect POST | Create endpoints |
| `protectPutRoute()` | Protect PUT | Replace endpoints |
| `protectPatchRoute()` | Protect PATCH | Update endpoints |
| `protectDeleteRoute()` | Protect DELETE | Delete endpoints |
| `requireAuth()` | Low-level auth check | Custom logic |
| `requireCSRF()` | Low-level CSRF check | Custom logic |

---

## 🔐 Authentication Flow

```
Request → Middleware checks:
  1. Is token present?
  2. Is token valid (signature)?
  3. Is token expired?
  4. Does user have required role?
  
  ✓ All checks pass → Allow request
  ✗ Any check fails → Return 401/403 error
```

---

## 📊 Role Types

| Role | Purpose | Access |
|------|---------|--------|
| `DRIVER` | Delivery personnel | Driver app endpoints |
| `SELLER` | E-commerce seller | Seller app endpoints |
| `BUSINESS` | Logistics company | Business app endpoints |
| `ADMIN` | System administrator | Admin endpoints |

---

## 🧪 Testing Your Protected Endpoints

### With cURL
```bash
# Get your token first
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass"}' \
  | jq -r '.token')

# Test protected endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/users/me
```

### In JavaScript
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

## 🔧 Common API Patterns

### Pattern 1: Get Current User Data
```typescript
export async function GET(request: NextRequest) {
  const auth = await protectRoute(request);
  if (!auth.authenticated) return auth.response;

  // Get user's own data
  const data = await prisma.user.findUnique({
    where: { id: auth.userId },
  });

  return NextResponse.json(data);
}
```

### Pattern 2: Create with User Association
```typescript
export async function POST(request: NextRequest) {
  const auth = await protectRoute(request);
  if (!auth.authenticated) return auth.response;

  const body = await request.json();

  // Automatically associate with current user
  const data = await prisma.order.create({
    data: {
      ...body,
      userId: auth.userId, // Set user ID automatically
    },
  });

  return NextResponse.json(data, { status: 201 });
}
```

### Pattern 3: Role-Specific Logic
```typescript
export async function GET(request: NextRequest) {
  const auth = await protectRoute(request, {
    allowedRoles: ['SELLER', 'BUSINESS', 'DRIVER'],
  });
  if (!auth.authenticated) return auth.response;

  if (auth.userRole === 'SELLER') {
    // Seller-specific logic
  } else if (auth.userRole === 'BUSINESS') {
    // Business-specific logic
  } else if (auth.userRole === 'DRIVER') {
    // Driver-specific logic
  }

  return NextResponse.json({ /* data */ });
}
```

### Pattern 4: Input Validation
```typescript
export async function POST(request: NextRequest) {
  const auth = await protectRoute(request);
  if (!auth.authenticated) return auth.response;

  const body = await request.json();

  // Validate required fields
  if (!body.name) {
    return NextResponse.json(
      { error: 'Name is required' },
      { status: 400 }
    );
  }

  // Create...
  return NextResponse.json({ success: true });
}
```

---

## ❌ Common Mistakes to Avoid

### ❌ Mistake 1: Not checking auth response
```typescript
// BAD - Will crash if not authenticated
const auth = await protectRoute(request);
const userId = auth.userId; // May be null!

// GOOD - Check first
const auth = await protectRoute(request);
if (!auth.authenticated) return auth.response;
const userId = auth.userId; // Now safe to use
```

### ❌ Mistake 2: Trusting user input without role check
```typescript
// BAD - User could be wrong role
const auth = await protectRoute(request);
const sellerId = request.query.sellerId; // From URL
await prisma.product.findMany({ where: { sellerId } });

// GOOD - Verify role first
const auth = await protectRoute(request, {
  requiredRole: 'SELLER',
});
if (!auth.authenticated) return auth.response;
// Now safe to use auth.userId
```

### ❌ Mistake 3: Forgetting CSRF on state-changing requests
```typescript
// protectRoute() automatically handles CSRF
// for POST, PUT, DELETE, PATCH
// GET, HEAD, OPTIONS skip CSRF check

// This is correct:
export async function POST(request: NextRequest) {
  const auth = await protectRoute(request); // Validates CSRF
  if (!auth.authenticated) return auth.response;
  // ...
}
```

---

## 📚 Documentation Structure

### Quick Start
- **File:** `MIDDLEWARE_QUICK_REFERENCE.md`
- **Use:** When you just need syntax help

### Complete Guide
- **File:** `MIDDLEWARE_SETUP_GUIDE.md`
- **Use:** When you need detailed explanations

### Code Examples
- **Files:** `EXAMPLE_API_ROUTE.ts`, `EXAMPLE_ROLE_ROUTES.ts`
- **Use:** When you need working code to copy

### Full Auth System
- **File:** `UNIFIED_AUTHENTICATION_GUIDE.md`
- **Use:** Understanding the complete auth system

---

## 🚀 Next Steps

1. **Test the middleware**
   - Use example code from `EXAMPLE_API_ROUTE.ts`
   - Test with browser console or cURL

2. **Protect your API routes**
   - Add `protectRoute()` to each endpoint
   - Specify role requirements if needed

3. **Verify it works**
   - Try accessing without token (should fail)
   - Try accessing with token (should work)
   - Try wrong role (should fail)

4. **Update other endpoints**
   - Go through all existing API routes
   - Add `protectRoute()` where needed

---

## 🔒 Security Checklist

- [x] JWT token validation implemented
- [x] Token signature verification
- [x] Token expiration checking
- [x] CSRF protection
- [x] Role-based access control
- [x] Automatic method detection (GET vs POST)
- [ ] Add middleware to all API routes
- [ ] Test all endpoints with and without auth
- [ ] Test with wrong roles
- [ ] Monitor for unauthorized access attempts

---

## 💡 Key Features

✅ **Simple to Use** - Just call `protectRoute()`
✅ **Flexible** - Works with any HTTP method
✅ **Secure** - JWT validation + CSRF protection
✅ **Type-Safe** - Full TypeScript support
✅ **Role-Based** - Control access by user role
✅ **Error Handling** - Automatic error responses
✅ **No Configuration** - Uses existing JWT_SECRET

---

## 📞 Get Help

### Quick Questions?
- See `MIDDLEWARE_QUICK_REFERENCE.md`

### How do I...?
- See `MIDDLEWARE_SETUP_GUIDE.md`

### Show me code examples
- See `EXAMPLE_API_ROUTE.ts` and `EXAMPLE_ROLE_ROUTES.ts`

### Understand the full system
- See `UNIFIED_AUTHENTICATION_GUIDE.md`

---

## Summary

The middleware is ready to use:

1. Import: `import { protectRoute } from '@fastship/lib'`
2. Use: `const auth = await protectRoute(request);`
3. Check: `if (!auth.authenticated) return auth.response;`
4. Access: Use `auth.userId`, `auth.userRole`, `auth.user`

That's it! Your API route is now protected. 🎉
