# API App Setup (Next.js API Routes)

## Structure Created ✅

```
apps/api/
├── app/
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts       ✅ Created
│       │   └── register/route.ts    ✅ Created
│       ├── shipments/
│       │   └── route.ts             ✅ Created
│       ├── drivers/
│       │   └── route.ts             ✅ Created
│       └── health/route.ts          ✅ Created
├── package.json                      ✅ Created (Port 4000)
├── next.config.mjs                   ✅ Created
├── tsconfig.json                     ✅ Created
└── .env.example                      ✅ Created
```

---

## What You Need to Do

### Step 1: Copy Remaining API Routes

Copy these folders from `/app/api/` to `/apps/api/app/api/`:

```
Your Existing Structure          →    New API App Structure
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/app/api/admin/                 →    /apps/api/app/api/admin/
/app/api/analytics/             →    /apps/api/app/api/analytics/
/app/api/assignments/           →    /apps/api/app/api/assignments/
/app/api/bids/                  →    /apps/api/app/api/bids/
/app/api/billing/               →    /apps/api/app/api/billing/
/app/api/business/              →    /apps/api/app/api/business/
/app/api/dispatch/              →    /apps/api/app/api/dispatch/
/app/api/disputes/              →    /apps/api/app/api/disputes/
/app/api/distance/              →    /apps/api/app/api/distance/
/app/api/driver/                →    /apps/api/app/api/driver/
/app/api/earnings/              →    /apps/api/app/api/earnings/
/app/api/integrations/          →    /apps/api/app/api/integrations/
/app/api/locations/             →    /apps/api/app/api/locations/
/app/api/notifications/         →    /apps/api/app/api/notifications/
/app/api/payments/              →    /apps/api/app/api/payments/
/app/api/rate-cards/            →    /apps/api/app/api/rate-cards/
/app/api/register/              →    /apps/api/app/api/register/
/app/api/sellers/               →    /apps/api/app/api/sellers/
/app/api/settlements/           →    /apps/api/app/api/settlements/
/app/api/transactions/          →    /apps/api/app/api/transactions/
/app/api/users/                 →    /apps/api/app/api/users/
/app/api/wallets/               →    /apps/api/app/api/wallets/
```

**Quick Copy Command (Windows PowerShell):**
```powershell
# Copy all API folders
$folders = @("admin", "analytics", "assignments", "bids", "billing", "business", "dispatch", "disputes", "distance", "driver", "earnings", "integrations", "locations", "notifications", "payments", "rate-cards", "register", "sellers", "settlements", "transactions", "users", "wallets")

foreach ($folder in $folders) {
    Copy-Item -Path "app/api/$folder" -Destination "apps/api/app/api/$folder" -Recurse -Force
}
```

**Or manually in VS Code:**
1. Open file explorer
2. Select each folder from `/app/api/`
3. Drag to `/apps/api/app/api/`

### Step 2: Copy Middleware

Copy middleware configuration to API app:

```
/middleware.ts          →    /apps/api/middleware.ts
```

### Step 3: Environment Setup

Create `.env.local` in `/apps/api/`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fastship

# JWT
JWT_SECRET=your-super-secret-key

# API
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Step 4: Update Root package.json

Add API app to root `package.json`:

```json
{
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    ...
  }
}
```

---

## Port Configuration

### Development Ports

```
apps/admin        → 3000  (Frontend - Admin)
apps/driver       → 3001  (Frontend - Driver)
apps/seller       → 3002  (Frontend - Seller)
apps/business     → 3003  (Frontend - Business)
apps/api          → 4000  (Backend - All APIs)  ⭐ NEW
```

### Environment Variables

**In each frontend app (apps/admin/.env.local, etc.):**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**In API app (apps/api/.env.local):**
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Running the Application

### Development

```bash
# From root directory
npm install

# Start all apps and API server
npm run dev

# Or start individual services
npm run dev -p admin      # Admin app only
npm run dev -p driver     # Driver app only
npm run dev -p api        # API server only
```

### URLs

- Admin App: http://localhost:3000
- Driver App: http://localhost:3001
- Seller App: http://localhost:3002
- Business App: http://localhost:3003
- **API Server: http://localhost:4000**

---

## API Endpoints (Now on Port 4000)

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@example.com",
    "password": "password123",
    "role": "SELLER"
  }'
```

### Get Shipments
```bash
curl -X GET http://localhost:4000/api/shipments?sellerId=123
```

### Get Health
```bash
curl http://localhost:4000/api/health
```

---

## Frontend Integration

Update all frontend apps to use the new API URL:

**From:**
```typescript
fetch('/api/shipments')
```

**To:**
```typescript
import { secureFetch } from '@fastship/lib';

secureFetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/shipments`
).then(r => r.json())
```

---

## Deployment

### Vercel (Frontend Apps)

1. Create 5 Vercel projects:
   - `fastship-admin` (from apps/admin)
   - `fastship-driver` (from apps/driver)
   - `fastship-seller` (from apps/seller)
   - `fastship-business` (from apps/business)
   - `fastship-api` (from apps/api)

2. Set environment variables for all projects:
   ```
   DATABASE_URL=<production-db-url>
   JWT_SECRET=<production-secret>
   NEXT_PUBLIC_API_URL=https://api.fastship.com  (for frontend apps)
   ```

3. Deploy from Turborepo root

---

## Comparison: Express vs Next.js API

| Aspect | Express (services/api-server) | Next.js (apps/api) |
|--------|-------------------------------|-------------------|
| Performance | ⚡ Faster | 🟡 Slower (Serverless) |
| Deployment | Any Node.js host | Vercel/Netlify |
| Learning | Different routing | Same as apps |
| Your Code | Requires migration | No changes needed ✅ |
| **Recommendation for you** | Express (best) | **Next.js (what we did)** ✅ |

---

## Quick Checklist

- [ ] Copy remaining API folders from /app/api/ to /apps/api/app/api/
- [ ] Copy middleware.ts to /apps/api/
- [ ] Create /apps/api/.env.local
- [ ] Update frontend apps NEXT_PUBLIC_API_URL
- [ ] Run `npm install` from root
- [ ] Run `npm run dev` to test all services
- [ ] Verify API works on http://localhost:4000
- [ ] Test login from frontend apps
- [ ] Deploy to Vercel

---

## Support Files

- [TURBOREPO_MIGRATION_GUIDE.md](../../TURBOREPO_MIGRATION_GUIDE.md)
- [TURBOREPO_PROGRESS.md](../../TURBOREPO_PROGRESS.md)
- [API_ARCHITECTURE.md](../../API_ARCHITECTURE.md)
