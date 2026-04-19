# Login Troubleshooting Guide

## Issue: Login Loads But Nothing Happens

### Root Cause
The login was failing silently because:
1. **Missing jsonwebtoken package** - Version ^9.1.2 was specified but doesn't exist. Latest is 9.0.3
2. **No test data in database** - No user records to test login against
3. **Database schema mismatch** - Auth APIs were trying to use wrong fields

### What's Been Fixed

#### 1. Package Version (FIXED ✓)
- Changed `jsonwebtoken@^9.1.2` → `jsonwebtoken@^9.0.3`
- Removed duplicate `@types/jsonwebtoken` from devDependencies
- Package.json now has correct versions

#### 2. Error Logging (ADDED ✓)
- Added detailed console logging to `/api/auth/login`
- Added console logging to AuthContext login method
- Errors will now show in browser console and server logs

#### 3. Architecture Fix (FIXED ✓)
- Auth APIs now correctly use User model for authentication
- User table stores email, password, role
- Driver/Seller/Business link to User via userId
- All endpoints fixed: login, register (driver/seller/business), me, logout

### How to Test Login Now

#### Option 1: Register First (Recommended)
1. Go to `/register/driver` (or seller/business)
2. Fill in the registration form
3. This creates a User record in the database
4. Then login with those credentials

#### Option 2: Manual Database Seeding
If you want to create test users directly in PostgreSQL:

```sql
INSERT INTO "User" (id, email, phone, name, password, role, "isVerified", "isActive", "createdAt", "updatedAt")
VALUES (
  'user_test_driver',
  'driver@test.com',
  '03001234567',
  'Test Driver',
  '$2b$10$YOUR_BCRYPT_HASH_HERE',  -- Use bcrypt hashed password
  'DRIVER',
  true,
  true,
  NOW(),
  NOW()
);
```

**To get bcrypt hash**, use this Node.js snippet:
```javascript
const bcrypt = require('bcryptjs');
bcrypt.hash('password123', 10).then(hash => console.log(hash));
```

#### Option 3: Use Registration API Directly
```bash
curl -X POST http://localhost:3000/api/auth/register/driver \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Driver",
    "email": "driver@example.com",
    "password": "password123",
    "phone": "03001234567",
    "licenseNumber": "DL123456",
    "vehicleType": "bike",
    "vehicleNumber": "ABC-123"
  }'
```

### Debug Output to Check

1. **Browser Console** (Press F12 → Console tab)
   - Look for `[v0] Login attempt: { email, role }`
   - Look for `[v0] Login response status: 200` or error code
   - Look for any error messages

2. **Server Console** (Terminal where `npm run dev` runs)
   - Look for `[v0] Login error: ...`
   - Look for full error stack traces

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Module not found: Can't resolve 'jsonwebtoken'" | Dependencies not installed. Run `npm install` or wait for auto-install |
| "Invalid email or password" | User doesn't exist in database. Try registration first |
| "Invalid role for this account" | Register with same role you're trying to login with |
| Silent loading then nothing | Check browser console for errors (F12) |
| 500 error on server | Check terminal logs for detailed error messages |

### Verification Steps

1. Open browser DevTools (F12)
2. Go to `/login` page
3. Try to login with test credentials
4. Check Console tab for `[v0]` log messages
5. Check Network tab to see API response
6. Check your terminal for server-side logs

### Next Steps

After successful login:
- You should be redirected to `/driver/overview` (or seller/business based on role)
- AuthContext will store user data
- All protected routes will work
- Logout button in navbar should appear
