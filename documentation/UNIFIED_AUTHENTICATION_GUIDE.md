# Unified Authentication System - FastShip

## Overview

A complete cross-app authentication system that unifies login/registration across three apps:
- **Driver App** (port 3001)
- **Seller App** (port 3002)
- **Business App** (port 3003)
- **Marketing App** (port 3004) - Central login point

---

## Architecture

### Core Components

#### 1. **AuthService** (`packages/lib/services/auth.service.ts`)
Centralized authentication service that handles:
- Token management (save, retrieve, validate, clear)
- User info storage in localStorage
- Token expiration checking
- Role-based redirect URLs
- Authorization headers generation

**Key Methods:**
```typescript
AuthService.saveTokens(tokens)      // Save access & refresh tokens
AuthService.getAccessToken()        // Get token from localStorage
AuthService.saveUser(user)          // Save user info
AuthService.getUser()               // Get user from localStorage
AuthService.isAuthenticated()       // Check if token is valid
AuthService.getRedirectUrl(role)    // Get dashboard URL by role
AuthService.clearAuth()             // Clear all auth data
AuthService.getAuthHeaders()        // Get Authorization headers
```

#### 2. **AuthContext** (`packages/lib/context/AuthContext.tsx`)
React Context providing authentication state and methods globally:
- `useAuth()` hook for accessing auth functions
- Methods: `login()`, `registerDriver()`, `registerSeller()`, `registerBusiness()`, `logout()`
- Integrated with AuthService for localStorage persistence
- Automatic token refresh after successful login/registration

#### 3. **Authentication Hooks** (`packages/lib/hooks/auth.hooks.ts`)
Custom React hooks for authentication tasks:
- `useAuthToken()` - Get current access token
- `useIsAuthenticated()` - Check auth status
- `useStoredUser()` - Get user from localStorage
- `useAuthHeaders()` - Get auth headers for API calls
- `useLogout()` - Logout and redirect to login
- `useTokenExpirationCheck()` - Auto-logout on token expiration

#### 4. **Middleware** (`middleware.ts`)
Server-side route protection:
- Validates JWT tokens from cookies
- Enforces role-based access control
- Redirects unauthenticated users to marketing login
- Validates CSRF tokens for state-changing requests

---

## Authentication Flow

### Login Flow (Marketing App)

```
User (3004)
    ↓
Login Page (/login)
    ↓
Submit credentials
    ↓
POST /api/auth/login
    ↓
Server validates & returns token + user
    ↓
AuthContext saves to:
  - Cookies (for middleware)
  - localStorage (for client-side)
    ↓
Redirect to:
  - Driver: http://localhost:3001/overview
  - Seller: http://localhost:3002/overview
  - Business: http://localhost:3003/overview
```

### Cross-App API Authentication

```
Client App (Driver/Seller/Business)
    ↓
Make API request
    ↓
Include Authorization header:
  - From localStorage via AuthService
  - Or from cookies (automatic by browser)
    ↓
Server validates JWT
    ↓
Request processed
```

### Protected Route Access

```
User accesses /driver/overview (3001)
    ↓
Middleware checks:
  - Token valid?
  - User role == DRIVER?
  - Token expired?
    ↓
✓ All checks pass → Allow access
✗ Any check fails → Redirect to marketing login
```

---

## Environment Variables

### Marketing App (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_DRIVER_BASE_URL=http://localhost:3001
NEXT_PUBLIC_SELLER_BASE_URL=http://localhost:3002
NEXT_PUBLIC_BUSINESS_BASE_URL=http://localhost:3003
```

### Driver/Seller/Business Apps (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_MARKETING_BASE_URL=http://localhost:3004
```

**For Production:**
Update URLs to match your production domains:
- `NEXT_PUBLIC_DRIVER_BASE_URL=https://driver.fastship.com`
- `NEXT_PUBLIC_SELLER_BASE_URL=https://seller.fastship.com`
- `NEXT_PUBLIC_BUSINESS_BASE_URL=https://business.fastship.com`
- `NEXT_PUBLIC_MARKETING_BASE_URL=https://fastship.com`

---

## Usage Examples

### 1. Login from Marketing App

```typescript
'use client';
import { useAuth } from '@fastship/lib';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleLogin = async (email: string, password: string, role: string) => {
    try {
      const redirectUrl = await login(email, password, role);
      window.location.href = redirectUrl; // Redirect to app
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    // Form implementation...
  );
}
```

### 2. Make Authenticated API Calls

```typescript
import { AuthService } from '@fastship/lib';

async function fetchUserData() {
  const headers = AuthService.getAuthHeaders();
  
  const response = await fetch('/api/users/me', {
    method: 'GET',
    headers,
  });
  
  if (response.status === 401) {
    // Token expired, auto-logout
    AuthService.clearAuth();
    window.location.href = `${process.env.NEXT_PUBLIC_MARKETING_BASE_URL}/login`;
  }
  
  return response.json();
}
```

### 3. Using Auth Hooks

```typescript
import { useAuthToken, useIsAuthenticated, useLogout } from '@fastship/lib';

export default function Dashboard() {
  const token = useAuthToken();
  const { isAuthenticated } = useIsAuthenticated();
  const logout = useLogout();

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <p>Token: {token?.substring(0, 20)}...</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 4. Protected Component with Auto-Logout

```typescript
import { useTokenExpirationCheck, useLogout } from '@fastship/lib';

export default function ProtectedPage() {
  useTokenExpirationCheck(); // Auto-logout when token expires

  return (
    <div>
      {/* Your protected content */}
    </div>
  );
}
```

---

## Token Management

### Storage Locations

| Item | Location | Purpose | Lifetime |
|------|----------|---------|----------|
| Access Token | Cookie + localStorage | API authentication | 24 hours |
| Refresh Token | localStorage (optional) | Token renewal | As configured |
| User Info | localStorage | Client-side access | Until logout |
| Token Expiration | localStorage | Expiry checking | Until new login |

### Token Lifecycle

```
1. Login successful
   ├─ Server sends JWT in Set-Cookie header
   └─ AuthContext saves to localStorage

2. API Request
   ├─ Browser includes cookie automatically
   └─ Client can use localStorage token for custom headers

3. Token Validation
   ├─ Middleware validates JWT signature
   └─ Route handlers check expiration

4. Token Expiry
   ├─ Detected by useTokenExpirationCheck hook
   └─ User auto-logged out

5. Logout
   ├─ Server clears cookies
   └─ AuthService clears localStorage
```

---

## Error Handling

### Common Scenarios

#### 1. **Invalid Credentials**
```typescript
try {
  await login(email, password, role);
} catch (error) {
  // Error: Invalid email or password
}
```

#### 2. **Token Expired**
```typescript
// Automatic handling by middleware:
// If token expired → Redirect to /login on marketing app

// Or manual check:
if (AuthService.isTokenExpired()) {
  AuthService.clearAuth();
  window.location.href = `${MARKETING_URL}/login`;
}
```

#### 3. **Wrong Role Access**
```typescript
// Middleware prevents this:
// User with DRIVER role accessing /seller route
// → Redirects to marketing login
```

#### 4. **CSRF Token Missing**
```typescript
// Automatic handling by middleware:
// State-changing request without CSRF token
// → Returns 403 Forbidden
```

---

## Security Features

### 1. **JWT Authentication**
- Tokens signed with `JWT_SECRET`
- Server-side validation
- 24-hour expiration
- Role-based claims

### 2. **CSRF Protection**
- CSRF token required for state-changing requests
- Token validation in middleware
- Automatic token refresh after login

### 3. **Role-Based Access Control**
- Middleware enforces role-specific routes
- Users can only access their dashboard
- Cross-role access prevented

### 4. **Secure Token Storage**
- Tokens in HTTP-only cookies (secure by default)
- Additional localStorage backup for client-side access
- Automatic clearance on logout

### 5. **Token Expiration**
- Client-side expiration checking
- Auto-logout on expiration
- Prevents use of expired tokens

---

## Troubleshooting

### Issue: User redirects to login after successful registration

**Cause:** Token not being saved or redirect URL not configured
**Solution:**
1. Check `.env.local` has correct `NEXT_PUBLIC_*_BASE_URL`
2. Verify AuthService methods are called in AuthContext
3. Check browser localStorage for stored token

### Issue: "CSRF token validation failed" error

**Cause:** CSRF token missing or expired
**Solution:**
1. Ensure login happens before other state-changing requests
2. Check if requests include CSRF token from cookies
3. Refresh page and try again

### Issue: 401 Unauthorized on API requests

**Cause:** Token expired or missing
**Solution:**
1. Check token in localStorage: `localStorage.getItem('auth_token')`
2. Verify token expiration: `AuthService.isTokenExpired()`
3. Re-login if token is expired

### Issue: Cross-origin request blocked

**Cause:** CORS not configured for app URLs
**Solution:**
1. Ensure API server has CORS headers configured
2. Add app URLs to CORS whitelist if needed
3. Check middleware corsMiddleware is enabled

---

## Development Checklist

- [x] AuthService created with token management
- [x] AuthContext integrated with AuthService
- [x] Login page updated with cross-app redirects
- [x] Environment variables configured for all apps
- [x] Middleware updated with role-based protection
- [x] Auth hooks created for component usage
- [x] localStorage integration for token persistence
- [x] CSRF protection configured
- [x] Token expiration handling
- [ ] Integration tests for auth flows
- [ ] E2E tests for cross-app redirects

---

## Next Steps

1. **Test Authentication Flow:**
   - Login from marketing app
   - Verify redirect to correct dashboard
   - Check token in localStorage
   - Try API requests

2. **Configure CORS (if needed):**
   - Add app URLs to server CORS whitelist
   - Test cross-origin API requests

3. **Set Up Production:**
   - Update `.env.local` with production URLs
   - Configure SSL certificates
   - Set secure cookie flags
   - Update JWT_SECRET

4. **Implement Token Refresh (optional):**
   - Create refresh token endpoint
   - Implement token refresh logic
   - Handle refresh failures

5. **Add Integration Tests:**
   - Test login flow
   - Test API authentication
   - Test logout
   - Test token expiration

---

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/login`
Login for any user role
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "DRIVER" | "SELLER" | "BUSINESS"
}
```

#### POST `/api/auth/register/driver`
Driver registration
```json
{
  "email": "driver@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

#### POST `/api/auth/register/seller`
Seller registration
```json
{
  "email": "seller@example.com",
  "password": "password123",
  "name": "Shop Owner",
  "phone": "+1234567890",
  "shopName": "My Shop"
}
```

#### POST `/api/auth/register/business`
Business registration
```json
{
  "email": "business@example.com",
  "password": "password123",
  "name": "Company Name",
  "phone": "+1234567890",
  "businessName": "Logistics Co"
}
```

#### GET `/api/auth/me`
Get current user
```
Headers:
  Authorization: Bearer {token}
```

#### POST `/api/auth/logout`
Logout current user
```
Headers:
  Authorization: Bearer {token}
```

---

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review the auth-related files
3. Check browser console for errors
4. Verify environment variables are set correctly
