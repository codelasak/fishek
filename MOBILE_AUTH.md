# Mobile Authentication Implementation

## Overview
JWT-based authentication for Capacitor mobile apps, separate from NextAuth session-based web authentication.

## Architecture

### Why JWT for Mobile?
- ✅ NextAuth sessions rely on cookies which don't work reliably in Capacitor WebView
- ✅ JWT tokens stored in Capacitor Preferences (secure storage)
- ✅ Backend already configured for JWT in `auth.ts`
- ✅ Works across capacitor:// protocol and deployed backend

### Authentication Flow

```
Mobile App (capacitor://)
    ↓
Login/Register → POST /api/auth/mobile
    ↓
Backend validates credentials
    ↓
Returns JWT + user data
    ↓
Store in Capacitor Preferences
    ↓
All API requests include Bearer token
```

## Implementation Details

### 1. JWT Utilities (`lib/jwt.ts`)
```typescript
// Sign JWT tokens (7-day expiration)
await signJWT({ id, email, name })

// Verify JWT tokens
await verifyJWT(token)
```

Uses `jose` library with `AUTH_SECRET` from environment.

### 2. Mobile Auth Service (`lib/mobileAuth.ts`)
```typescript
// Login
const result = await mobileAuth.login(email, password);
// Returns: { user?, error? }

// Register
const result = await mobileAuth.register(name, email, password);
// Returns: { user?, error? }

// Logout
await mobileAuth.logout();

// Get current token
const token = await mobileAuth.getToken();

// Get current user
const user = await mobileAuth.getUser();

// Get auth header
const header = await mobileAuth.getAuthHeader();
// Returns: "Bearer eyJhbG..."
```

**Storage:**
- Mobile: `@capacitor/preferences` (secure)
- Web: `localStorage` (fallback for testing)

### 3. Mobile Auth Context (`lib/MobileAuthContext.tsx`)
React context that manages authentication state.

```typescript
const { user, loading, logout } = useMobileAuth();
```

**Features:**
- Auto-detects Capacitor environment
- Falls back to NextAuth session on web
- Provides unified interface for both platforms

### 4. Backend Endpoints

#### POST `/api/auth/mobile`
Mobile login endpoint returning JWT.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST `/api/auth/register`
Existing registration endpoint (works for both web and mobile).

**Mobile flow:**
1. Register user via `/api/auth/register`
2. Automatically login via `/api/auth/mobile`
3. Store JWT token

### 5. API Client (`services/apiClient.ts`)

All API methods updated to include authentication:

```typescript
// Automatically adds headers:
// Mobile: Authorization: Bearer <token>
// Web: Includes cookies

// Automatically sets credentials:
// Mobile: credentials: 'omit'
// Web: credentials: 'include'
```

**Updated methods:**
- `fetchTransactions()`
- `addTransaction()`
- `updateTransaction()`
- `deleteTransaction()`
- `fetchCategories()`
- `addCategory()`
- `updateCategory()`
- `deleteCategory()`
- `fetchStats()`
- All family-related methods

### 6. Login/Register Pages

Both pages now detect platform and use appropriate auth:

```typescript
if (Capacitor.isNativePlatform()) {
  // Use mobileAuth
  const result = await mobileAuth.login(email, password);
} else {
  // Use NextAuth
  const result = await signIn('credentials', {...});
}
```

## Environment Configuration

### `.env.mobile`
```bash
NEXT_PUBLIC_API_URL=https://fishek.coolify.fennaver.tech
```

This file is automatically loaded during mobile builds.

## Building Mobile App

```bash
# Build and sync
pnpm run build:mobile

# Open in Xcode
pnpm run cap:open:ios

# Run in simulator
pnpm run cap:run:ios
```

## Testing Authentication

### Test Login Flow:
1. Open app in simulator
2. Navigate to login page
3. Enter credentials
4. Check logs for "[Mobile Login] Success"
5. Verify token stored in Preferences
6. Test API calls (should include Bearer token)

### Test API Calls:
1. Login successfully
2. Navigate to home page (fetches transactions)
3. Check network logs for Authorization header
4. Add/edit/delete transactions
5. Verify all requests authenticated

### Debug Token:
```typescript
import { mobileAuth } from '@/lib/mobileAuth';

// Check token
const token = await mobileAuth.getToken();
console.log('Token:', token);

// Check user
const user = await mobileAuth.getUser();
console.log('User:', user);
```

## CORS Configuration

**Important:** Backend must allow `capacitor://localhost` origin.

In deployed backend, add CORS headers:
```typescript
Access-Control-Allow-Origin: capacitor://localhost
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Security Considerations

1. **Token Storage:**
   - ✅ Uses Capacitor Preferences (encrypted on device)
   - ✅ Not accessible from web browsers
   - ✅ Cleared on logout

2. **Token Expiration:**
   - ✅ 7-day expiration (configurable in `lib/jwt.ts`)
   - ⚠️ TODO: Implement token refresh mechanism
   - ⚠️ TODO: Handle expired token errors

3. **HTTPS:**
   - ✅ Backend uses HTTPS
   - ✅ Capacitor config uses HTTPS schemes

4. **Password Security:**
   - ✅ Passwords hashed with bcrypt
   - ✅ Never stored in plain text
   - ✅ Verified server-side only

## Next Steps

### Required for Production:
- [ ] Add token refresh mechanism
- [ ] Handle expired token errors gracefully
- [ ] Add biometric authentication (Touch ID/Face ID)
- [ ] Implement secure token rotation
- [ ] Add rate limiting on auth endpoints
- [ ] Set up proper CORS on deployed backend

### Optional Enhancements:
- [ ] Add "Remember Me" functionality
- [ ] Implement OAuth providers for mobile
- [ ] Add device fingerprinting
- [ ] Track login sessions
- [ ] Add logout all devices feature

## Troubleshooting

### AuthError in mobile app
**Cause:** NextAuth sessions don't work in Capacitor
**Solution:** ✅ Implemented JWT authentication

### "Network error" on login
**Cause:** API_URL not configured or CORS issues
**Solution:** 
1. Check `.env.mobile` has correct API_URL
2. Verify backend CORS allows capacitor://localhost

### Token not persisting
**Cause:** Preferences not saving
**Solution:** 
1. Check Capacitor Preferences plugin installed
2. Verify iOS permissions in Info.plist
3. Check console for Preferences errors

### API calls return 401
**Cause:** Token missing or invalid
**Solution:**
1. Check token exists: `await mobileAuth.getToken()`
2. Verify Bearer header in requests
3. Check token not expired
4. Re-login to get fresh token

## Files Modified/Created

### Created:
- `lib/jwt.ts` - JWT signing/verification utilities
- `lib/mobileAuth.ts` - Mobile auth service
- `lib/MobileAuthContext.tsx` - Auth state management
- `app/api/auth/mobile/route.ts` - Mobile login endpoint
- `.env.mobile` - Mobile environment config
- `MOBILE_AUTH.md` - This documentation

### Modified:
- `services/apiClient.ts` - Added Bearer token headers
- `app/providers.tsx` - Added MobileAuthProvider
- `app/login/page.tsx` - Platform-aware authentication
- `app/register/page.tsx` - Platform-aware registration

## Dependencies

```json
{
  "@capacitor/preferences": "^7.0.2",
  "jose": "^6.1.2"
}
```

## References

- [Capacitor Preferences](https://capacitorjs.com/docs/apis/preferences)
- [Jose JWT Library](https://github.com/panva/jose)
- [NextAuth JWT Strategy](https://next-auth.js.org/configuration/options#jwt)
