# Business App Layout Integration Example
# File: apps/business/app/layout.tsx

```typescript
import type { Metadata } from 'next';
import { AuthProvider, ProtectedLayout } from '@fastship/lib';
import './globals.css';

export const metadata: Metadata = {
  title: 'FastShip - Business Dashboard',
  description: 'Manage your logistics business with FastShip',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning>
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

# Seller App Layout Integration Example
# File: apps/seller/app/layout.tsx

```typescript
import type { Metadata } from 'next';
import { AuthProvider, ProtectedLayout } from '@fastship/lib';
import './globals.css';

export const metadata: Metadata = {
  title: 'FastShip - Seller Dashboard',
  description: 'Manage your shipments with FastShip',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning>
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

# Driver App Layout Integration Example
# File: apps/driver/app/layout.tsx

```typescript
import type { Metadata } from 'next';
import { AuthProvider, ProtectedLayout } from '@fastship/lib';
import './globals.css';

export const metadata: Metadata = {
  title: 'FastShip - Driver Dashboard',
  description: 'View your deliveries with FastShip',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning>
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

## Key Points:

1. **AuthProvider wraps everything first** - Provides context for authentication
2. **ProtectedLayout wraps children** - Checks auth and redirects if needed
3. **suppressHydrationWarning** - Prevents Next.js hydration warnings (optional but recommended)
4. **Metadata** - Custom title and description for each app

## Environment Files Needed:

### apps/business/.env.local
```
NEXT_PUBLIC_MARKETING_BASE_URL=http://localhost:3004
```

### apps/seller/.env.local
```
NEXT_PUBLIC_MARKETING_BASE_URL=http://localhost:3004
```

### apps/driver/.env.local
```
NEXT_PUBLIC_MARKETING_BASE_URL=http://localhost:3004
```

## What Gets Imported:

From `@fastship/lib`:
- ✅ `AuthProvider` - Provides auth context
- ✅ `ProtectedLayout` - Protects the entire app layout

These are automatically exported from packages/lib/index.ts
