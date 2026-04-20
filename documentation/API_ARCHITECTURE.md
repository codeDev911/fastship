# Fastship API Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND APPS                               │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐     │
│  │   ADMIN      │   DRIVER     │   SELLER     │   BUSINESS   │     │
│  │   (3000)     │   (3001)     │   (3002)     │   (3003)     │     │
│  └──────────────┴──────────────┴──────────────┴──────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ (HTTPS)
                         secureFetch()
                              ↓
        ┌─────────────────────────────────────────────────────┐
        │                  NEXTJS API SERVER                 │
        │              (services/api-server:3000)            │
        │                                                     │
        │  ┌──────────────────────────────────────────────┐  │
        │  │  CORS Middleware - Allow all app origins    │  │
        │  └──────────────────────────────────────────────┘  │
        │                      ↓                              │
        │  ┌──────────────────────────────────────────────┐  │
        │  │  JWT Auth Middleware                        │  │
        │  │  - Extract token from header                │  │
        │  │  - Verify signature                         │  │
        │  │  - Check expiry                             │  │
        │  └──────────────────────────────────────────────┘  │
        │                      ↓                              │
        │  ┌──────────────────────────────────────────────┐  │
        │  │         PUBLIC ROUTES (No Auth)             │  │
        │  │  ┌────────────────────────────────────────┐ │  │
        │  │  │  POST /auth/login                      │ │  │
        │  │  │  POST /auth/register                   │ │  │
        │  │  │  POST /auth/logout                     │ │  │
        │  │  │  GET  /health                          │ │  │
        │  │  └────────────────────────────────────────┘ │  │
        │  └──────────────────────────────────────────────┘  │
        │                      ↓                              │
        │  ┌──────────────────────────────────────────────┐  │
        │  │      PROTECTED ROUTES (Auth Required)       │  │
        │  │  ┌────────────────────────────────────────┐ │  │
        │  │  │  Shipments                             │ │  │
        │  │  │  - GET    /api/shipments               │ │  │
        │  │  │  - POST   /api/shipments               │ │  │
        │  │  │  - GET    /api/shipments/:id           │ │  │
        │  │  │  - PUT    /api/shipments/:id           │ │  │
        │  │  └────────────────────────────────────────┘ │  │
        │  │  ┌────────────────────────────────────────┐ │  │
        │  │  │  Drivers                               │ │  │
        │  │  │  - GET    /api/drivers                 │ │  │
        │  │  │  - POST   /api/drivers                 │ │  │
        │  │  │  - GET    /api/drivers/:id             │ │  │
        │  │  │  - PUT    /api/drivers/:id             │ │  │
        │  │  └────────────────────────────────────────┘ │  │
        │  │  ┌────────────────────────────────────────┐ │  │
        │  │  │  Sellers                               │ │  │
        │  │  │  - GET    /api/sellers                 │ │  │
        │  │  │  - POST   /api/sellers                 │ │  │
        │  │  │  - GET    /api/sellers/:id             │ │  │
        │  │  │  - PUT    /api/sellers/:id             │ │  │
        │  │  └────────────────────────────────────────┘ │  │
        │  │  ┌────────────────────────────────────────┐ │  │
        │  │  │  Utilities                             │ │  │
        │  │  │  - POST   /api/dispatch                │ │  │
        │  │  │  - POST   /api/distance                │ │  │
        │  │  │  - GET    /api/earnings                │ │  │
        │  │  │  - GET    /api/dashboard               │ │  │
        │  │  └────────────────────────────────────────┘ │  │
        │  └──────────────────────────────────────────────┘  │
        │                      ↓                              │
        │  ┌──────────────────────────────────────────────┐  │
        │  │         ADMIN ROUTES (Role Check)           │  │
        │  │  ┌────────────────────────────────────────┐ │  │
        │  │  │  Admin Drivers                         │ │  │
        │  │  │  - GET    /api/admin/drivers           │ │  │
        │  │  │  - GET    /api/admin/drivers/:id       │ │  │
        │  │  │  - PUT    /api/admin/drivers/:id       │ │  │
        │  │  └────────────────────────────────────────┘ │  │
        │  │  ┌────────────────────────────────────────┐ │  │
        │  │  │  Admin Sellers                         │ │  │
        │  │  │  - GET    /api/admin/sellers           │ │  │
        │  │  │  - GET    /api/admin/sellers/:id       │ │  │
        │  │  │  - PUT    /api/admin/sellers/:id       │ │  │
        │  │  └────────────────────────────────────────┘ │  │
        │  │  ┌────────────────────────────────────────┐ │  │
        │  │  │  Admin Businesses                      │ │  │
        │  │  │  - GET    /api/admin/businesses        │ │  │
        │  │  │  - GET    /api/admin/businesses/:id    │ │  │
        │  │  │  - PUT    /api/admin/businesses/:id    │ │  │
        │  │  └────────────────────────────────────────┘ │  │
        │  │  ┌────────────────────────────────────────┐ │  │
        │  │  │  Admin Shipments                       │ │  │
        │  │  │  - GET    /api/admin/shipments         │ │  │
        │  │  │  - GET    /api/admin/shipments/:id     │ │  │
        │  │  │  - PUT    /api/admin/shipments/:id     │ │  │
        │  │  └────────────────────────────────────────┘ │  │
        │  └──────────────────────────────────────────────┘  │
        │                                                     │
        └─────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────────────────┐
        │              PRISMA ORM / DATABASE                 │
        │  ┌────────────────────────────────────────────────┐ │
        │  │  PostgreSQL (Single Source of Truth)          │ │
        │  │                                                │ │
        │  │  Tables:                                       │ │
        │  │  - users          (authentication)            │ │
        │  │  - drivers        (driver profiles)           │ │
        │  │  - sellers        (seller profiles)           │ │
        │  │  - businesses     (business profiles)         │ │
        │  │  - shipments      (shipment data)             │ │
        │  │  - assignments    (driver assignments)        │ │
        │  │  - payments       (payment records)           │ │
        │  │  - tracking       (real-time tracking)        │ │
        │  │  - wallets        (user wallets)              │ │
        │  │  - disputes       (dispute records)           │ │
        │  │  - ratings        (user ratings)              │ │
        │  │  - activities     (audit logs)                │ │
        │  └────────────────────────────────────────────────┘ │
        └─────────────────────────────────────────────────────┘
```

## Request Flow

### 1. Login Request

```
Frontend App
    ↓
POST /auth/login
  ├─ Email, Password, Role
    ↓
API Server
  ├─ Validate input (Zod)
  ├─ Query DB for user by email
  ├─ Compare password hash
  ├─ Verify role matches
    ↓
Generate JWT Token
  ├─ User ID
  ├─ Email
  ├─ Role
  ├─ Associated profile IDs (driverId, sellerId, businessId)
  ├─ Expires: 30 days
    ↓
Response: { token, user }
    ↓
Frontend: localStorage.setItem('auth_token', token)
```

### 2. Protected Request (e.g., Get Shipments)

```
Frontend App
    ↓
secureFetch('/api/shipments')
  ├─ Get token from localStorage
  ├─ Add Authorization header: "Bearer {token}"
    ↓
API Server
  ├─ CORS Middleware
  │  └─ Check origin is whitelisted
    ↓
  ├─ Auth Middleware
  │  ├─ Extract token from header
  │  ├─ Verify JWT signature
  │  ├─ Check token not expired
  │  ├─ Decode payload into req.user
    ↓
  ├─ Route Handler (/api/shipments)
  │  ├─ Get user ID from req.user
  │  ├─ Determine user type (seller, driver, business, admin)
  │  ├─ Build query based on role
  │  ├─ Query DB using Prisma
    ↓
  ├─ Return results: { data, pagination }
    ↓
Frontend App receives JSON
```

### 3. Error Handling

```
Request → Validation fails
           ↓
        Return: { error: "..." }
        Status: 400 Bad Request
        
Request → Token invalid/expired
           ↓
        Return: { error: "Unauthorized" }
        Status: 401 Unauthorized
        
Request → User not authorized
           ↓
        Return: { error: "Unauthorized - Admin access required" }
        Status: 403 Forbidden
        
Request → Resource not found
           ↓
        Return: { error: "Resource not found" }
        Status: 404 Not Found
        
Request → Server error
           ↓
        Return: { error: "Internal server error" }
        Status: 500 Internal Server Error
```

## Environment Setup

### Development

```
Frontend Apps:
├─ apps/admin          → http://localhost:3000 (also serves frontend)
├─ apps/driver         → http://localhost:3001
├─ apps/seller         → http://localhost:3002
├─ apps/business       → http://localhost:3003

API Server:
├─ services/api-server → http://localhost:3000 (Express)

Database:
├─ PostgreSQL          → localhost:5432
```

**Issue:** Frontend admin app and API server both want port 3000!

**Solution 1:** Start API on different port in dev
```env
# API Server
PORT=4000
```

**Solution 2:** Use reverse proxy (nginx) - production setup

### Production

```
Frontend Apps:
├─ admin.fastship.com         → Vercel
├─ driver.fastship.com        → Vercel
├─ seller.fastship.com        → Vercel
├─ business.fastship.com      → Vercel

API Server:
├─ api.fastship.com           → Railway/Render/AWS

Database:
├─ PostgreSQL (managed)       → AWS RDS / Railway / Neon
```

## Security Flow

```
1. User Login
   └─ Password hashed with bcryptjs (10 rounds)
   └─ JWT signed with HS256 algorithm

2. Token Validation
   └─ Signature verified with JWT_SECRET
   └─ Expiry checked (30 days)
   └─ Payload decoded safely

3. Authorization
   └─ User ID extracted from token
   └─ Role checked for admin routes
   └─ Resource ownership verified
     └─ Sellers can only see own shipments
     └─ Drivers can only see own assignments
     └─ Admins can see everything

4. CORS Protection
   └─ Origin header validated
   └─ Only whitelisted domains allowed
   └─ Credentials supported

5. Data Protection
   └─ Passwords never logged
   └─ Sensitive fields excluded from responses
   └─ Queries scoped to user's data
```

## Deployment Checklist

- [ ] Database hosted and configured
- [ ] JWT_SECRET generated and stored in secrets
- [ ] DATABASE_URL configured
- [ ] ALLOWED_ORIGINS set for production domains
- [ ] Environment variables set in Railway/Render
- [ ] HTTPS enforced
- [ ] CORS headers proper configured
- [ ] Error logging setup (Sentry/DataDog)
- [ ] Database backups scheduled
- [ ] Rate limiting configured
- [ ] Monitoring and alerts setup
- [ ] Load balancing if needed

---

## Files Overview

| File | Purpose |
|------|---------|
| `server.ts` | Main Express server, route imports, middleware setup |
| `middleware/auth.ts` | JWT verification, error handling |
| `middleware/cors.ts` | CORS configuration, origin whitelist |
| `routes/auth.ts` | Login, register, logout, me endpoints |
| `routes/shipments.ts` | Shipment CRUD operations |
| `routes/drivers.ts` | Driver profile management |
| `routes/sellers.ts` | Seller profile management |
| `routes/dispatch.ts` | Shipment to driver assignment |
| `routes/distance.ts` | Distance calculation utility |
| `routes/earnings.ts` | User earnings tracking |
| `routes/dashboard.ts` | Role-specific dashboard stats |
| `routes/admin/*` | Admin management endpoints |
