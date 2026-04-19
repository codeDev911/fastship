# Unified Authentication - Quick Start Guide

## 🚀 Getting Started

### 1. Verify Environment Variables

Check that each app has proper `.env.local` configuration:

**Marketing App** (`apps/marketing/.env.local`):
```env
NEXT_PUBLIC_DRIVER_BASE_URL=http://localhost:3001
NEXT_PUBLIC_SELLER_BASE_URL=http://localhost:3002
NEXT_PUBLIC_BUSINESS_BASE_URL=http://localhost:3003
```

**Driver/Seller/Business Apps** (`.env.local`):
```env
NEXT_PUBLIC_MARKETING_BASE_URL=http://localhost:3004
```

### 2. Start All Apps

Open 4 terminals and run each app:

```bash
# Terminal 1 - API Server (port 3000)
cd apps/api
npm run dev

# Terminal 2 - Driver App (port 3001)
cd apps/driver
npm run dev

# Terminal 3 - Seller App (port 3002)
cd apps/seller
npm run dev

# Terminal 4 - Business App (port 3003)
cd apps/business
npm run dev

# Terminal 5 - Marketing App (port 3004)
cd apps/marketing
npm run dev
```

### 3. Test Login Flow

1. **Open Browser:**
   - Navigate to `http://localhost:3004/login` (Marketing App)

2. **Login:**
   - Select role: "Driver" / "Seller" / "Logistics Business"
   - Enter credentials (use existing account or register)
   - Click "Sign In"

3. **Verify Redirect:**
   - Should redirect to respective app:
     - Driver → `http://localhost:3001/overview`
     - Seller → `http://localhost:3002/overview`
     - Business → `http://localhost:3003/overview`

4. **Check localStorage:**
   - Open Browser DevTools (F12)
   - Go to Application → Local Storage
   - Should see:
     - `auth_token` - JWT token
     - `user_info` - User details
     - `auth_token_expires` - Expiration time

### 4. Test Protected Routes

1. **Try direct access:**
   - Navigate to `http://localhost:3001/overview` (without login)
   - Should redirect to `http://localhost:3004/login`

2. **Check cookies:**
   - DevTools → Application → Cookies
   - Should see `auth_token` and `user_role` cookies

### 5. Test API Calls

From any app, make authenticated request:

```javascript
// In browser console on driver/seller/business app
const token = localStorage.getItem('auth_token');
const response = await fetch('http://localhost:3000/api/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
console.log(await response.json());
```

### 6. Test Logout

1. **Click Logout** in any app
2. **Verify:**
   - Redirected to `http://localhost:3004/login`
   - localStorage cleared
   - Cookies removed

---

## 🐛 Troubleshooting

### Issue: After login, stays on marketing page

**Check:**
1. Are environment variables set? 
   ```bash
   echo $NEXT_PUBLIC_DRIVER_BASE_URL
   ```
2. Are other apps running?
3. Check browser console for errors

**Fix:**
1. Restart app: `npm run dev`
2. Clear cache: `Ctrl+Shift+Delete` → Clear browsing data
3. Check middleware.ts has correct redirect logic

### Issue: "Unauthorized" error on API calls

**Check:**
1. Token exists in localStorage: `localStorage.getItem('auth_token')`
2. Token not expired: Check `auth_token_expires`
3. API request includes auth header

**Fix:**
```javascript
// Manually add auth header
const token = localStorage.getItem('auth_token');
const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Issue: Middleware redirects to login on protected page

**Check:**
1. Are you logged in? Check localStorage
2. Is token valid? Check expiration time
3. Is your role correct for the route?

**Fix:**
1. Login again
2. Clear localStorage and login fresh
3. Check user role matches the app

### Issue: CORS errors

**Check:**
1. API server has CORS configured
2. Frontend origin is whitelisted
3. Credentials included in requests

**Fix:**
Update API CORS configuration for your app URLs

---

## 📝 Common Tasks

### Change Redirect URL (Production)

Edit `.env.local` in each app:

```env
# Marketing App
NEXT_PUBLIC_DRIVER_BASE_URL=https://driver.mycompany.com
NEXT_PUBLIC_SELLER_BASE_URL=https://seller.mycompany.com
NEXT_PUBLIC_BUSINESS_BASE_URL=https://business.mycompany.com

# Other Apps
NEXT_PUBLIC_MARKETING_BASE_URL=https://mycompany.com
```

### Test Token Expiration

Edit `packages/lib/services/auth.service.ts`:

```typescript
// Change from 86400 (24 hours) to 60 (1 minute)
const expiresIn = tokens.expiresIn || 60; // 60 seconds for testing
```

Then:
1. Login
2. Wait 1 minute
3. Try making API call
4. Should auto-logout

### Add Custom Auth Logic

Extend `AuthService`:

```typescript
// In packages/lib/services/auth.service.ts
static getCustomData(): any {
  // Your custom logic here
}

// Use in components
const customData = AuthService.getCustomData();
```

### Create Protected Component

```typescript
import { useAuth } from '@fastship/lib';
import { useRouter } from 'next/navigation';

export function ProtectedComponent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) return <div>Loading...</div>;
  
  if (!user) {
    router.push('/login');
    return null;
  }

  return <div>Welcome, {user.name}!</div>;
}
```

---

## 📚 File Reference

| File | Purpose |
|------|---------|
| `packages/lib/services/auth.service.ts` | Token & user management |
| `packages/lib/context/AuthContext.tsx` | React context for auth |
| `packages/lib/hooks/auth.hooks.ts` | Custom hooks for auth |
| `middleware.ts` | Route protection |
| `apps/marketing/app/login/page.tsx` | Login page |
| `UNIFIED_AUTHENTICATION_GUIDE.md` | Full documentation |

---

## 🎯 Next Steps

1. **Test the complete flow** (login → redirect → protected route)
2. **Verify tokens** are being saved and used correctly
3. **Test error scenarios** (expired token, wrong role, etc.)
4. **Update production URLs** when ready for deployment
5. **Add integration tests** for auth flows

---

## 💡 Tips

- Use `localStorage.getItem('auth_token')` to debug token issues
- Check browser Network tab to see token in request headers
- Use `AuthService.isTokenExpired()` to manually check expiration
- All redirects use full URLs to support cross-origin navigation

Good luck! 🎉
