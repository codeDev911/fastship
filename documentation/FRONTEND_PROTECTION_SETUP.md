# Frontend Protection Setup - Implementation Guide

## 🔐 Protecting Your Frontend Apps

Prevent unauthorized access to your dashboard apps. If users aren't logged in, they'll be automatically redirected to the login page.

---

## 📋 Two Approaches

### **Option 1: Protect Entire App (Recommended)**
Use `ProtectedLayout` to protect all routes at once.

### **Option 2: Protect Individual Routes**
Use `ProtectedRoute` for specific pages that need protection.

---

## ✅ Option 1: Protect Entire App

### Step 1: Update Your Root Layout

**File:** `apps/business/app/layout.tsx`

```typescript
import type { Metadata } from 'next';
import { AuthProvider, ProtectedLayout } from '@fastship/lib';
import './globals.css';

export const metadata: Metadata = {
  title: 'FastShip - Business Dashboard',
  description: 'Logistics business dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ProtectedLayout>
            {children}
          </ProtectedLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
```

**What this does:**
- ✅ Checks authentication on every page load
- ✅ Redirects to login if not authenticated
- ✅ Shows loading spinner while checking
- ✅ Protects all routes automatically

---

## ✅ Option 2: Protect Individual Routes

### Use ProtectedRoute on Specific Pages

**File:** `apps/business/app/overview/page.tsx`

```typescript
'use client';

import { ProtectedRoute } from '@fastship/lib';
import OverviewContent from '@/components/overview/OverviewContent';

export default function OverviewPage() {
  return (
    <ProtectedRoute>
      <OverviewContent />
    </ProtectedRoute>
  );
}
```

**With Role Check:**

```typescript
<ProtectedRoute requiredRole="BUSINESS">
  <OverviewContent />
</ProtectedRoute>
```

**With Multiple Roles:**

```typescript
<ProtectedRoute allowedRoles={['BUSINESS']}>
  <OverviewContent />
</ProtectedRoute>
```

---

## 🎯 Setup Instructions for Each App

### **Business App** (localhost:3003)

**File:** `apps/business/app/layout.tsx`

```typescript
import { AuthProvider, ProtectedLayout } from '@fastship/lib';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <ProtectedLayout>
            {children}
          </ProtectedLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Then in `.env.local`:**
```env
NEXT_PUBLIC_MARKETING_BASE_URL=http://localhost:3004
```

---

### **Seller App** (localhost:3002)

**File:** `apps/seller/app/layout.tsx`

```typescript
import { AuthProvider, ProtectedLayout } from '@fastship/lib';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <ProtectedLayout>
            {children}
          </ProtectedLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Then in `.env.local`:**
```env
NEXT_PUBLIC_MARKETING_BASE_URL=http://localhost:3004
```

---

### **Driver App** (localhost:3001)

**File:** `apps/driver/app/layout.tsx`

```typescript
import { AuthProvider, ProtectedLayout } from '@fastship/lib';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <ProtectedLayout>
            {children}
          </ProtectedLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Then in `.env.local`:**
```env
NEXT_PUBLIC_MARKETING_BASE_URL=http://localhost:3004
```

---

## 🧪 Testing Frontend Protection

### Test 1: Logout and Try Accessing App

```
1. Go to any app: http://localhost:3003/overview
2. You should see loading spinner
3. Within 1 second, redirected to: http://localhost:3004/login
```

### Test 2: Login and Access App

```
1. Go to login: http://localhost:3004/login
2. Login with valid credentials
3. Should redirect to: http://localhost:3003/overview (or respective app)
4. Should see your content (not loading spinner)
```

### Test 3: Clear localStorage and Try Accessing

```
1. Open DevTools (F12)
2. Go to Application → Local Storage
3. Delete all items
4. Refresh page
5. Should redirect to login
```

### Test 4: Expired Token

```
1. Edit EXAMPLE_API_ROUTE.ts to set token expiration to 10 seconds
2. Login
3. Wait 10 seconds
4. Try accessing page
5. Should redirect to login
```

---

## 🔑 How It Works

```
User visits http://localhost:3003
    ↓
ProtectedLayout checks authentication
    ↓
Is token in localStorage?
    ├─ NO → Redirect to http://localhost:3004/login
    └─ YES → Is token expired?
              ├─ YES → Redirect to http://localhost:3004/login
              └─ NO → Show content
```

---

## 📝 Important Files

### Components
- `packages/lib/components/ProtectedLayout.tsx` - Wrap entire app
- `packages/lib/components/ProtectedRoute.tsx` - Wrap individual routes

### Services
- `packages/lib/services/auth.service.ts` - Token management
- `packages/lib/context/AuthContext.tsx` - Auth context provider

### Environment Variables
All three apps need:
```env
NEXT_PUBLIC_MARKETING_BASE_URL=http://localhost:3004
```

---

## ⚙️ Configuration

### Default Login URL
By default, `ProtectedLayout` redirects to:
```
${process.env.NEXT_PUBLIC_MARKETING_BASE_URL}/login
# or
http://localhost:3004/login
```

### Custom Login URL
You can override the redirect URL:

```typescript
<ProtectedLayout loginUrl="https://custom-login.com/auth">
  {children}
</ProtectedLayout>
```

---

## 🚨 Common Issues

### Issue: "Checking authentication..." spinner appears but doesn't redirect

**Cause:** `NEXT_PUBLIC_MARKETING_BASE_URL` not set
**Solution:**
1. Add to `.env.local` in each app:
   ```env
   NEXT_PUBLIC_MARKETING_BASE_URL=http://localhost:3004
   ```
2. Restart the app: `npm run dev`

### Issue: Can access app without login

**Cause:** `ProtectedLayout` not wrapping the app
**Solution:**
1. Check that layout.tsx has `ProtectedLayout` wrapper
2. Check that `AuthProvider` is above `ProtectedLayout`
3. Check that auth token actually expires

### Issue: Redirects to blank login page

**Cause:** Login page at wrong URL
**Solution:**
1. Verify marketing app running at `http://localhost:3004`
2. Verify login page exists at `/login`
3. Test directly: `http://localhost:3004/login`

### Issue: Page loads but immediately redirects to login

**Cause:** Token is expired or corrupted
**Solution:**
1. Clear localStorage: `localStorage.clear()`
2. Login again
3. Check browser console for errors

---

## 🔒 Security Features

✅ **Token Validation** - Checks JWT signature and expiration
✅ **Automatic Redirect** - Users can't see content without token
✅ **Loading State** - Prevents flash of unprotected content
✅ **Role-Based** - Can restrict by user role if needed
✅ **Fallback Link** - Shows "Click here" if redirect fails

---

## 📚 Usage Examples

### Simple Protection
```typescript
import { ProtectedLayout } from '@fastship/lib';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ProtectedLayout>
          {children}
        </ProtectedLayout>
      </body>
    </html>
  );
}
```

### With Custom Login URL
```typescript
<ProtectedLayout loginUrl="http://mycompany.com/auth/login">
  {children}
</ProtectedLayout>
```

### Protect Individual Pages
```typescript
'use client';

import { ProtectedRoute } from '@fastship/lib';

export default function Page() {
  return (
    <ProtectedRoute>
      <YourContent />
    </ProtectedRoute>
  );
}
```

### Role-Restricted Page
```typescript
<ProtectedRoute requiredRole="BUSINESS">
  <BusinessContent />
</ProtectedRoute>
```

---

## ✨ Next Steps

1. **Update all three app layouts:**
   - `apps/driver/app/layout.tsx`
   - `apps/seller/app/layout.tsx`
   - `apps/business/app/layout.tsx`

2. **Add environment variables** to each app's `.env.local`:
   ```env
   NEXT_PUBLIC_MARKETING_BASE_URL=http://localhost:3004
   ```

3. **Test the protection:**
   - Logout from all apps
   - Try accessing each app
   - Should redirect to login

4. **Test login flow:**
   - Login at marketing app
   - Should redirect to appropriate app
   - Should see content (not redirected back to login)

---

## 💡 Tips

- **Always wrap with `AuthProvider` first**, then `ProtectedLayout`
- **Use `ProtectedLayout` for entire app protection** (easiest)
- **Use `ProtectedRoute` for specific sensitive pages** (more granular)
- **Set correct `NEXT_PUBLIC_MARKETING_BASE_URL`** in each app
- **Test logout/login flow thoroughly**

---

## 🆘 Need Help?

Check the created components:
- `packages/lib/components/ProtectedLayout.tsx`
- `packages/lib/components/ProtectedRoute.tsx`

They have detailed comments and examples!
