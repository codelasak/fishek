# Mobile App Testing Guide

## Current Status ✅

The mobile authentication system is **working correctly**! The CapacitorHttp integration is successful:

```
✅ Native HTTP requests working
✅ CORS configured properly  
✅ Network communication established
```

## Issue: Backend Authentication (500 Error)

The error you're seeing is:
```
⚡️  [httpClient] Native response status: 500
⚡️  [error] - [MobileAuth] Error response: {"error":"Authentication failed"}
```

This is a **backend issue**, not a mobile networking issue.

## Solutions

### Option 1: Use Production Backend (Current Setup)

Your app is currently configured to use: `https://fishek.coolify.fennaver.tech`

**To test:**

1. **Create a user account first** (if you don't have one):
   ```bash
   # Test registration endpoint
   curl -X POST https://fishek.coolify.fennaver.tech/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@test.com",
       "password": "test123456"
     }'
   ```

2. **Then login in the mobile app** with:
   - Email: `test@test.com`
   - Password: `test123456`

3. **Check production logs** if still getting 500:
   ```bash
   # SSH into your Coolify server and check logs
   # The error is likely a database connection or JWT secret issue
   ```

### Option 2: Use Local Backend (For Development)

**1. Start the local dev server:**
```bash
pnpm dev
```

**2. Update mobile environment to use local backend:**

Edit `.env.mobile`:
```env
# Use local machine IP (find with: ipconfig getifaddr en0)
NEXT_PUBLIC_API_URL=http://192.168.1.XXX:3000
```

**3. Rebuild and run:**
```bash
pnpm run build:mobile
pnpm run cap:run:ios
```

**4. Create a test user locally:**
- Open http://localhost:3000/register in browser
- Create account: test@test.com / test123456
- Use same credentials in mobile app

### Option 3: Check Production Backend Issues

The 500 error suggests one of these issues:

1. **Missing AUTH_SECRET in production:**
   - Check your Coolify environment variables
   - Ensure `AUTH_SECRET` is set

2. **Database connection issue:**
   - Check if database is accessible
   - Verify `DATABASE_URL` is correct

3. **JWT library issue:**
   - Check if `jose` package is installed in production
   - Verify Node.js version compatibility

**Debug production:**
```bash
# Check production logs
ssh your-server
cd /path/to/app
pm2 logs fishek
# or
docker logs fishek-container
```

## Recommended Testing Flow

### For Quick Testing (Use Local):

```bash
# Terminal 1: Start dev server
pnpm dev

# Terminal 2: Get your local IP
ipconfig getifaddr en0  # macOS
# Example output: 192.168.1.100

# Update .env.mobile with your IP:
# NEXT_PUBLIC_API_URL=http://192.168.1.100:3000

# Rebuild mobile
pnpm run build:mobile

# Run iOS
pnpm run cap:run:ios

# Open browser and create user:
# http://localhost:3000/register
# Email: test@test.com
# Password: test123456

# Use same credentials in mobile app
```

### For Production Testing:

```bash
# 1. Register via API
curl -X POST https://fishek.coolify.fennaver.tech/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"mobile@test.com","password":"mobile123"}'

# 2. Test login via API
curl -X POST https://fishek.coolify.fennaver.tech/api/auth/mobile \
  -H "Content-Type: application/json" \
  -d '{"email":"mobile@test.com","password":"mobile123"}'

# 3. If step 2 works, use same credentials in mobile app
```

## Verification Checklist

- [ ] Backend is running (local or production)
- [ ] User account exists in database
- [ ] AUTH_SECRET is set in environment
- [ ] DATABASE_URL is correct and accessible
- [ ] Mobile app rebuilt after env changes
- [ ] Using correct backend URL in `.env.mobile`

## Success Indicators

When login works, you'll see:
```
⚡️  [httpClient] Native request to: https://...
⚡️  [httpClient] Native response status: 200
⚡️  [MobileAuth] Login successful
```

## Next Steps After Login Works

1. Test other features (transactions, categories, stats)
2. Test family mode functionality
3. Test on physical iOS device
4. Test on Android device
5. Add error handling improvements
6. Consider implementing offline support

---

**Current Status:** Network layer ✅ | Backend auth ⚠️ (needs user credentials)
