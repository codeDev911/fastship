# Turborepo Migration Guide

## Overview

This guide explains the migration from a monolithic Next.js app to a Turborepo monorepo with separate services:

- **API Server** (Express.js) - Central backend at `services/api-server`
- **Admin App** (Next.js) - Admin dashboard at `apps/admin`
- **Driver App** (Next.js) - Driver portal at `apps/driver`
- **Seller App** (Next.js) - Seller portal at `apps/seller`
- **Business App** (Next.js) - Business/Logistics portal at `apps/business`

## Directory Structure

```
fastship/
├── apps/
│   ├── admin/          # Admin dashboard (port 3000)
│   ├── driver/         # Driver app (port 3001)
│   ├── seller/         # Seller app (port 3002)
│   ├── business/       # Business app (port 3003)
├── services/
│   └── api-server/     # Express API server (port 3000)
├── packages/
│   ├── db/            # Prisma client & schema
│   ├── lib/           # Shared utilities, types, auth
│   ├── ui/            # Shared React components
│   ├── hooks/         # Shared React hooks
├── turbo.json         # Turborepo config
├── package.json       # Root package.json
└── tsconfig.json      # Root TypeScript config
```

## Key Changes

### 1. Authentication (Cookie → JWT)

**Before (Monolithic):**
```typescript
// Session-based with cookies
fetch('/api/login', { credentials: 'include' })
// Browser auto-sends cookies
```

**After (Turborepo):**
```typescript
// JWT-based with Authorization header
const token = await login(email, password);
localStorage.setItem('auth_token', token);

fetch('https://api.fastship.com/api/shipments', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

### 2. CSRF Protection

**Before:** Session-based CSRF tokens

**After:** JWT tokens (CSRF not needed with headers)

### 3. CORS

**Before:** Not needed (same origin)

**After:** Configured in API server for multiple origins

## Setup Instructions

### Step 1: Install Dependencies

```bash
npm install
npm run prisma:generate
```

### Step 2: Environment Variables

Create `.env.local` files:

**Root `.env.local`:**
```
DATABASE_URL=postgresql://user:password@localhost:5432/fastship
JWT_SECRET=your_secret_key
```

**`services/api-server/.env.local`:**
```
DATABASE_URL=postgresql://user:password@localhost:5432/fastship
JWT_SECRET=your_secret_key
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003
```

**`apps/admin/.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**`apps/driver/.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**`apps/seller/.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**`apps/business/.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Step 3: Run Development Server

```bash
npm run dev
```

This starts all services in parallel:
- API Server: http://localhost:3000
- Admin App: http://localhost:3000
- Driver App: http://localhost:3001
- Seller App: http://localhost:3002
- Business App: http://localhost:3003

## API Calls with secureFetch

The `secureFetch` function now handles JWT tokens automatically:

```typescript
import { secureFetch, setAuthToken } from '@fastship/lib';

// Login
const { token } = await secureFetch(
  `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
  {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true // Don't send token for login
  }
).then(r => r.json());

setAuthToken(token);

// Fetch data (token auto-included)
const shipments = await secureFetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/shipments`
).then(r => r.json());
```

## Migration Checklist

- [ ] Copy static files (public/) to each app
- [ ] Copy lib files to `packages/lib/`
- [ ] Copy components to `packages/ui/`
- [ ] Copy hooks to `packages/hooks/`
- [ ] Copy existing API route handlers to `services/api-server/src/routes/`
- [ ] Update all `fetch()` calls to use `secureFetch()`
- [ ] Update environment variable references from `/api` to full URL
- [ ] Test login flow with JWT tokens
- [ ] Test cross-app communication with API server
- [ ] Update database connection string
- [ ] Configure CORS for production domains
- [ ] Set up GitHub Actions for CI/CD
- [ ] Deploy to Vercel (apps) and Railway/Render (API server)

## Deployment

### Vercel (Apps)

1. Create 4 separate Vercel projects:
   - `fastship-admin` → `apps/admin`
   - `fastship-driver` → `apps/driver`
   - `fastship-seller` → `apps/seller`
   - `fastship-business` → `apps/business`

2. Set environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.fastship.com
   ```

### Railway/Render (API Server)

1. Deploy `services/api-server`
2. Set environment variables
3. Update `NEXT_PUBLIC_API_URL` in Vercel projects

## Troubleshooting

### CORS Errors
- Add domain to `ALLOWED_ORIGINS` in API server
- Ensure `NEXT_PUBLIC_API_URL` matches API server URL

### Token Expired
- Implement token refresh logic in `secureFetch`
- Store refresh token separately if needed

### Database Connection
- Verify `DATABASE_URL` is set in API server
- Ensure all apps use `@fastship/db` package

## Next Steps

1. Implement token refresh endpoint in API server
2. Add rate limiting and security headers
3. Set up monitoring and logging
4. Configure email notifications
5. Implement WebSocket for real-time updates
