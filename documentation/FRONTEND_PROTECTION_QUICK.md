# Frontend Protection - Quick Setup (2 Minutes)

## 🎯 What You Need to Do

### Step 1: Update Layout File

For **Business App** (`apps/business/app/layout.tsx`):

```typescript
import { AuthProvider, ProtectedLayout } from '@fastship/lib';

export default function RootLayout({ children }) {
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

**Do the same for:**
- `apps/driver/app/layout.tsx`
- `apps/seller/app/layout.tsx`

### Step 2: Add Environment Variables

Create or update `.env.local` in each app:

**`apps/business/.env.local`:**
```env
NEXT_PUBLIC_MARKETING_BASE_URL=http://localhost:3004
```

**`apps/seller/.env.local`:**
```env
NEXT_PUBLIC_MARKETING_BASE_URL=http://localhost:3004
```

**`apps/driver/.env.local`:**
```env
NEXT_PUBLIC_MARKETING_BASE_URL=http://localhost:3004
```

### Step 3: Restart Apps

```bash
npm run dev
```

---

## ✅ That's It!

Now your apps are protected:

```
http://localhost:3003 (not logged in) → Redirects to http://localhost:3004/login
http://localhost:3003 (logged in)     → Shows dashboard
```

---

## 🧪 Test It

1. **Without Login:**
   - Go to http://localhost:3003
   - Should see loading spinner
   - Should redirect to http://localhost:3004/login

2. **With Login:**
   - Login at http://localhost:3004/login
   - Should redirect to http://localhost:3003/overview
   - Should see content (not redirected again)

3. **After Logout:**
   - Click logout
   - Go to http://localhost:3003
   - Should redirect to login again

---

## 📝 Component Usage

### Protect Entire App (Recommended)
```typescript
<AuthProvider>
  <ProtectedLayout>
    {children}
  </ProtectedLayout>
</AuthProvider>
```

### Protect Individual Page
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

### With Role Check
```typescript
<ProtectedRoute requiredRole="BUSINESS">
  <YourContent />
</ProtectedRoute>
```

---

## 🚨 If It's Not Working

1. **Check `.env.local` has `NEXT_PUBLIC_MARKETING_BASE_URL`**
2. **Check layout.tsx has `ProtectedLayout` wrapper**
3. **Check `AuthProvider` is above `ProtectedLayout`**
4. **Clear localStorage and login fresh**
5. **Restart the dev server**

---

## 📂 Files to Update

- [ ] `apps/driver/app/layout.tsx`
- [ ] `apps/seller/app/layout.tsx`
- [ ] `apps/business/app/layout.tsx`
- [ ] `apps/driver/.env.local`
- [ ] `apps/seller/.env.local`
- [ ] `apps/business/.env.local`

---

Done! Your frontend is now protected! 🔒
