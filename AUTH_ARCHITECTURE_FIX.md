# Authentication Architecture Fix - Complete Documentation

## Problem Identified

The authentication APIs (login and registration) were incorrectly trying to store email and password directly on the Driver, Seller, and Business models, but these models don't have email/password fields. The database schema uses a central User model for authentication.

### Wrong Approach
```prisma
model Driver {
  email: String  // ❌ DOES NOT EXIST
  passwordHash: String  // ❌ DOES NOT EXIST
}
```

### Correct Approach
```prisma
model User {
  id: String @id
  email: String @unique
  password: String (hash)
  role: UserRole (DRIVER, SELLER, BUSINESS)
}

model Driver {
  userId: String @unique (FK to User)
  // Other driver-specific fields
}
```

## Changes Made

### 1. Driver Registration API (`/app/api/auth/register/driver/route.ts`)
**Before**: Tried to create driver with email and passwordHash
**After**: 
- Creates User record first with email, phone, name, password hash, and role='DRIVER'
- Then creates Driver record linked to that User via userId
- Wallet is created under user.id instead of driver.id

### 2. Seller Registration API (`/app/api/auth/register/seller/route.ts`)
**Before**: Tried to create seller with email and passwordHash
**After**:
- Creates User record first with email, phone, name, password hash, and role='SELLER'
- Then creates Seller record with companyName, businessType, address fields
- Wallet is created under user.id

### 3. Business Registration API (`/app/api/auth/register/business/route.ts`)
**Before**: Tried to create business with email and passwordHash
**After**:
- Creates User record first with email, phone, name, password hash, and role='BUSINESS'
- Then creates Business record with companyName, businessType, operatingRegion
- Wallet is created under user.id

### 4. Login API (`/app/api/auth/login/route.ts`)
**Before**: Searched for email in Driver.email, Seller.email, or Business.email (doesn't exist)
**After**:
- Finds User by email (correct field)
- Verifies the user's role matches the requested login role
- Verifies password against User.password field
- Creates JWT with user.id, user.email, and role

### 5. Auth Me API (`/app/api/auth/me/route.ts`)
**Before**: Fetched Driver/Seller/Business by decoded.id
**After**:
- Fetches User by decoded.id with include relations to driver, seller, business
- Returns user data from User model with relationships

## Database Relationships

```
User (Central Authentication)
├── 1:1 → Driver (via userId)
├── 1:1 → Seller (via userId)
├── 1:1 → Business (via userId)
└── 1:Many → Wallet (via userId)
```

## JWT Token Structure

All JWT tokens now use User model data:
```json
{
  "id": "user_id_from_user_model",
  "email": "user_email_from_user_model",
  "role": "DRIVER|SELLER|BUSINESS"
}
```

## What Was Fixed

| Issue | Fix |
|-------|-----|
| Querying `driver.email` (doesn't exist) | Query `user.email` instead |
| Querying `seller.email` (doesn't exist) | Query `user.email` instead |
| Querying `business.email` (doesn't exist) | Query `user.email` instead |
| Storing password in Driver/Seller/Business | Store in User.password |
| Creating JWT with driver.id | Use user.id instead |
| Creating JWT with seller.id | Use user.id instead |
| Creating JWT with business.id | Use user.id instead |
| Wallet userId pointing to Driver/Seller/Business | Point to User.id |

## Important Notes

1. **User Model is the Source of Truth** - All authentication happens through the User model
2. **Role Enforcement** - The role is stored in User and verified during login
3. **Cascading Deletes** - Driver, Seller, Business have `onDelete: Cascade` on User foreign key
4. **One Registration Per Email** - Email uniqueness is enforced at User level, not Driver/Seller/Business

## Next Steps for Database Setup

When creating the migration:
```bash
npm run prisma:migrate
```

This will create tables that follow the correct relationship structure with email only in the User table.

## Testing the Fixed APIs

### Register as Driver
```bash
POST /api/auth/register/driver
{
  "email": "driver@example.com",
  "password": "securepass123",
  "name": "John Driver",
  "phone": "03001234567",
  "licenseNumber": "DL123456",
  "vehicleType": "Motorcycle",
  "vehicleNumber": "ABC-1234"
}
```

### Login
```bash
POST /api/auth/login
{
  "email": "driver@example.com",
  "password": "securepass123",
  "role": "DRIVER"
}
```

### Get Current User
```bash
GET /api/auth/me
(Requires auth_token cookie)
```

All APIs now correctly use the User model for email and password authentication!
