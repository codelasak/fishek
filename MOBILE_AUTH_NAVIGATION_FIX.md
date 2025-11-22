# Mobile Authentication Navigation Fix

## Problem
After successful login (200 OK response), the user remained stuck on the login page. The dashboard would immediately redirect back to login because `isAuthenticated` was false.

## Root Cause
1. **Platform Detection**: `MobileAuthContext` was using the old platform detection method (`window.location.protocol === 'capacitor:'`) instead of `isNativePlatform()` from `httpClient.ts`.

2. **State Not Updating**: The login page called `mobileAuth.login()` directly, which stored the token in Capacitor Preferences, but the `MobileAuthContext` wasn't notified of this change. When navigating to dashboard, the context still had `user = null` and `isAuthenticated = false`.

## Solution

### 1. Updated MobileAuthContext Platform Detection
**File**: `lib/MobileAuthContext.tsx`

- Changed from `window.location.protocol === 'capacitor:'` to `isNativePlatform()`
- Added `refreshUser()` function to re-load user from storage:
  ```typescript
  const refreshUser = async () => {
    setLoading(true);
    try {
      const storedUser = await mobileAuth.getUser();
      setUser(storedUser);
    } catch (error) {
      console.error('[MobileAuth] Failed to refresh user', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  ```

### 2. Updated Login Page to Refresh Context
**File**: `app/login/page.tsx`

- Imported `useMobileAuth` hook
- Call `refreshUser()` after successful login to update auth context:
  ```typescript
  if (isMobile) {
    const result = await mobileAuth.login(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    console.log('[Mobile Login] Success');
    // Refresh auth context so dashboard knows we're authenticated
    await refreshUser();
    // Keep loading state while redirecting
    router.push('/');
    router.refresh();
  }
  ```

## Flow After Fix

1. **Login**: User submits credentials
2. **Store Token**: `mobileAuth.login()` → Stores JWT + user in Capacitor Preferences
3. **Refresh Context**: `refreshUser()` → Loads user from storage, sets `isAuthenticated = true`
4. **Navigate**: `router.push('/')` → Redirects to dashboard
5. **Dashboard**: Checks `isAuthenticated` → Now `true`, shows dashboard instead of redirecting to login

## Testing Steps

1. **Build Mobile App**:
   ```bash
   pnpm run build:mobile
   ```

2. **Open in Xcode**:
   ```bash
   pnpm run cap:open:ios
   ```

3. **Test Login Flow**:
   - Launch app in simulator (iPhone 16 Pro, iOS 18.2)
   - Navigate to login page
   - Enter credentials:
     - Email: `mobile-test@fishek.app`
     - Password: `TestPassword123!`
   - Click "Giriş Yap"
   - **Expected**: Successfully navigate to dashboard
   - **Log Output**:
     ```
     ⚡️ [log] - [Mobile Login] Success
     ⚡️ [log] - [MobileAuth] Refreshing user state
     ⚡️ [log] - [MobileAuth] User loaded from storage: {...}
     ⚡️ To Native -> Capacitor.getPlatform()
     ⚡️ TO JS Object
     ```

4. **Verify Dashboard Loads**:
   - Dashboard should display transaction list
   - Bottom navigation should be visible
   - User should NOT be redirected back to login

5. **Test Persistence**:
   - Force-close app
   - Reopen app
   - **Expected**: User remains logged in, dashboard loads immediately

## Files Changed

1. ✅ `lib/MobileAuthContext.tsx` - Platform detection + refreshUser function
2. ✅ `app/login/page.tsx` - Call refreshUser after login
3. ✅ `lib/httpClient.ts` - Already had isNativePlatform() (from previous fix)

## Related Fixes

This fix builds on the previous HTTP client refactoring:
- **MOBILE_AUTH_FIX.md** - CapacitorHttp integration + Content-Type header fix
- **MOBILE_TESTING_GUIDE.md** - Testing procedures

## Next Steps

1. ✅ Test login navigation (this fix)
2. 🔲 Test API calls from dashboard (transactions, stats)
3. 🔲 Test logout flow
4. 🔲 Test family mode on mobile
5. 🔲 Test registration flow

## Rollback Instructions

If this causes issues, revert these changes:

```bash
git checkout HEAD -- lib/MobileAuthContext.tsx app/login/page.tsx
pnpm run build:mobile
pnpm run cap:sync
```
