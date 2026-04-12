# Authentication System Documentation

## Overview

The FastShip platform implements a complete authentication system supporting three user types:
- **Driver**: Delivery personnel managing orders and earnings
- **Seller**: E-commerce businesses shipping products
- **Business**: Logistics companies managing operations

## Architecture

### Core Components

#### 1. AuthContext (`lib/context/AuthContext.tsx`)
- Global authentication state management using React Context
- Provides `useAuth()` hook for accessing auth functions and user data
- Handles login, registration, logout, and token refresh
- Stores JWT tokens in HTTP-only cookies

#### 2. Authentication APIs

**POST `/api/auth/login`**
- Login endpoint for all user types
- Accepts: email, password, role
- Returns: user object and JWT token
- Sets secure HTTP-only cookie with token

**POST `/api/auth/register/driver`**
- Driver registration endpoint
- Accepts: email, password, name, phone, licenseNumber, vehicleType, vehicleNumber
- Creates driver user and wallet
- Auto-logs in user

**POST `/api/auth/register/seller`**
- Seller registration endpoint
- Accepts: email, password, name, phone, shopName, shopAddress, city, province
- Creates seller user and wallet
- Auto-logs in user

**POST `/api/auth/register/business`**
- Business registration endpoint
- Accepts: email, password, name, phone, businessName, businessType, operationCity, operationArea
- Creates business user and wallet
- Auto-logs in user

**GET `/api/auth/me`**
- Retrieves current authenticated user
- Validates JWT token from cookies
- Returns: user object with id, email, name, phone, role

**POST `/api/auth/logout`**
- Clears authentication cookies
- Invalidates session on server-side

#### 3. Route Protection

**Middleware (`middleware.ts`)**
- Protects all routes under `/driver/*`, `/seller/*`, `/business/*`
- Validates JWT tokens from cookies
- Enforces role-based access (driver can only access /driver, etc.)
- Redirects unauthenticated users to `/login`
- Clears invalid tokens on verification failure

#### 4. Frontend Pages

**Public Pages**
- `/login` - Login page with role selector
- `/register/driver` - Driver registration form
- `/register/seller` - Seller registration form
- `/register/business` - Business registration form
- `/` - Home page (if exists)

**Protected Pages**
- `/driver/*` - All driver dashboard pages
- `/seller/*` - All seller dashboard pages
- `/business/*` - All business dashboard pages

### How It Works

#### Registration Flow
1. User navigates to registration page (e.g., `/register/driver`)
2. User fills in required information
3. Form submitted to relevant API endpoint (e.g., `/api/auth/register/driver`)
4. API:
   - Validates input
   - Hashes password with bcryptjs
   - Creates user in database
   - Creates wallet for user
   - Generates JWT token
   - Sets HTTP-only cookie with token
   - Returns user object
5. AuthContext updates with user
6. User automatically redirected to dashboard (e.g., `/driver/overview`)

#### Login Flow
1. User navigates to `/login`
2. User selects role and enters credentials
3. Form submitted to `/api/auth/login`
4. API:
   - Validates email and password
   - Verifies password hash
   - Generates JWT token
   - Sets HTTP-only cookie
   - Returns user object
5. AuthContext updates with user
6. User redirected to dashboard based on role

#### Navigation with Auth
1. User accesses protected route (e.g., `/driver/overview`)
2. Middleware checks for valid token in cookies
3. If valid: user accesses page
4. If invalid/missing: user redirected to `/login`
5. Role validation ensures user can only access their own dashboard

#### Logout Flow
1. User clicks logout button in navbar
2. Handler calls `logout()` from useAuth hook
3. `/api/auth/logout` endpoint clears cookies
4. AuthContext sets user to null
5. User redirected to `/login`

## Security Features

### Password Security
- Passwords hashed with bcryptjs (10 salt rounds)
- Never stored as plaintext
- Verified using bcryptjs.compare() on login

### JWT Tokens
- Signed with `JWT_SECRET` environment variable
- 24-hour expiration
- Verified on every authenticated request
- Invalidated on logout

### HTTP-Only Cookies
- Tokens stored in HTTP-only cookies (not accessible via JavaScript)
- Secure flag set in production
- SameSite=Lax to prevent CSRF attacks
- Automatically sent with every request

### Role-Based Access Control (RBAC)
- Users can only access their role's dashboard
- Driver cannot access `/seller/*` or `/business/*`
- Seller cannot access `/driver/*` or `/business/*`
- Business cannot access `/driver/*` or `/seller/*`
- Middleware enforces this before component renders

## Integration with Layouts

All three layout components (DriverLayout, SellerLayout, BusinessLayout) have been updated with:

1. **useAuth Hook** - Access current user and logout function
2. **Logout Handler** - Async function that calls logout API and redirects
3. **Navbar Integration** - Logout button in top-right corner
4. **Loading State** - Prevents multiple logout attempts

Example logout handler:
```tsx
const handleLogout = async () => {
  setIsLoggingOut(true);
  try {
    await logout();
    router.push('/login');
  } catch (error) {
    console.error('[v0] Logout error:', error);
    setIsLoggingOut(false);
  }
};
```

## Environment Variables Required

```env
JWT_SECRET=your-secret-key-here
NODE_ENV=production (for secure cookies)
DATABASE_URL=postgresql://user:password@localhost:5432/delivery_db
```

## Usage Example

### Using useAuth in a Component

```tsx
'use client';

import { useAuth } from '@/lib/context/AuthContext';

export function MyComponent() {
  const { user, isAuthenticated, login, logout, error, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {user?.name}!</p>
      <p>Your role: {user?.role}</p>
      <button onClick={() => logout()}>Sign Out</button>
    </div>
  );
}
```

### Login Example

```tsx
const { login } = useAuth();

const handleLogin = async (email: string, password: string, role: string) => {
  try {
    await login(email, password, role);
    // User is now logged in, redirect happens automatically
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Register Example

```tsx
const { registerDriver } = useAuth();

const handleRegister = async (formData) => {
  try {
    await registerDriver(formData);
    // User is now registered and logged in
  } catch (error) {
    console.error('Registration failed:', error);
  }
};
```

## Testing the Auth System

### Local Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/login`

3. Try registration:
   - Click "Register as Driver"
   - Fill in all fields
   - Submit form
   - Should redirect to `/driver/overview` on success

4. Try logout:
   - Click the logout button (power icon) in top-right
   - Should redirect to `/login`

5. Try login:
   - Enter credentials
   - Select role
   - Click "Sign In"
   - Should redirect to appropriate dashboard

6. Test role protection:
   - Login as driver
   - Try accessing `/seller/overview`
   - Should redirect to `/login`

### Database Setup

Before testing, ensure:
1. PostgreSQL is running
2. `DATABASE_URL` is set in `.env.local`
3. Migrations are run: `npm run prisma:migrate`
4. Prisma is generated: `npm run prisma:generate`

## Troubleshooting

### Users getting redirected to login after page refresh
- Check if `DATABASE_URL` is correctly set
- Verify JWT_SECRET is set and consistent
- Check browser cookies are being stored

### Logout not working
- Ensure `/api/auth/logout` endpoint is accessible
- Check browser console for errors
- Verify cookies are being deleted

### Registration failing
- Check all required fields are filled
- Verify database connection
- Check password requirements (min 6 characters)
- Check for duplicate email addresses

### "Unauthorized" errors
- JWT token may have expired (24 hours)
- Clear browser cookies and login again
- Check if JWT_SECRET changed (invalidates all tokens)

## Future Enhancements

1. **Token Refresh** - Implement 15-minute access tokens with refresh tokens
2. **Email Verification** - Verify email before account activation
3. **Two-Factor Authentication** - Add 2FA for enhanced security
4. **OAuth Integration** - Support Google/Facebook login
5. **Password Reset** - Implement forgot password flow
6. **Session Management** - Track multiple sessions per user
7. **Audit Logging** - Log all authentication events

