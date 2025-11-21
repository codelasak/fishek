# Capacitor iOS Setup Guide

## 🎯 Overview

**Fishek** is now configured for iOS development using **Capacitor v7**. Your Next.js app uses a **hybrid architecture** where:

- **Frontend**: Static Next.js export bundled in the mobile app
- **Backend**: API routes deployed separately (e.g., Vercel, Railway)  
- **Mobile App**: Communicates with your deployed backend via HTTPS

---

## ⚠️ Important: Dynamic Routes Limitation

### The Challenge

Next.js static export (`output: 'export'`) **does not support dynamic routes** like `/transaction/[id]`. This is a fundamental limitation because:

1. Static export generates HTML files at build time
2. Dynamic routes require runtime parameter handling
3. Capacitor needs a fully static build

### Current Workaround

The `/transaction/[id]` route is currently **excluded** from the mobile build. You have two options:

#### Option 1: Remove Dynamic Route (Recommended for Now)
- Navigate to transaction details via modals/sheets instead of separate pages
- Keep all functionality on the dashboard page
- This is common in mobile apps

#### Option 2: Implement Client-Side Routing
- Use a single `/transaction` page with client-side state management
- Pass transaction data via React Context or URL params
- Handle all rendering client-side

#### Option 3: Generate All Possible Routes
- If you have a limited number of transactions, generate static pages for each
- Add `generateStaticParams()` in a server component wrapper
- **Not practical** for user-generated content

---

## 📁 Project Structure

```
fishek/
├── app/                    # Next.js App Router pages
│   ├── api/               # ⚠️ Excluded from mobile build
│   ├── page.tsx           # Dashboard (included in mobile)
│   ├── categories/        # Categories page (included)
│   ├── add-transaction/   # Add transaction (included)
│   └── transaction/[id]/  # ⚠️ Dynamic route (currently excluded)
├── capacitor.config.ts    # Capacitor configuration
├── .env.mobile            # Mobile build environment
├── out/                   # Static export output (generated)
├── ios/                   # Native iOS project (after `cap add ios`)
└── scripts/
    └── buildMobile.js     # Custom build script
```

---

## 🔧 Configuration Files

### 1. `capacitor.config.ts`

```typescript
{
  appId: 'com.fishek.app',
  appName: 'Fishek',
  webDir: 'out',  // Next.js static export directory
}
```

### 2. `.env.mobile`

```bash
# Your deployed backend URL
NEXT_PUBLIC_API_URL=https://your-production-url.vercel.app
```

**⚠️ Important**: Update this with your actual deployed backend URL!

### 3. `services/apiClient.ts`

Automatically uses `NEXT_PUBLIC_API_URL` when set:

```typescript
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '') + '/api'
```

---

## 🚀 Build & Run Commands

### Build for Mobile
```bash
pnpm run build:mobile
```

This script:
1. Copies `.env.mobile` to `.env.local`
2. Temporarily moves `app/api` and `middleware.ts` outside build
3. Builds Next.js static export
4. Restores API routes
5. Syncs with Capacitor

### Add iOS Platform (First Time Only)
```bash
pnpm run cap:add:ios
```

### Open in Xcode
```bash
pnpm run cap:open:ios
```

### Run on iOS Simulator/Device
```bash
pnpm run cap:run:ios
```

### Sync Changes
```bash
pnpm run cap:sync
```

---

## 📱 Development Workflow

### Initial Setup

1. **Deploy your backend**:
   ```bash
   # Deploy to Vercel, Railway, or another platform
   vercel deploy
   ```

2. **Update `.env.mobile`**:
   ```bash
   NEXT_PUBLIC_API_URL=https://fishek-backend.vercel.app
   ```

3. **Build mobile app**:
   ```bash
   pnpm run build:mobile
   ```

4. **Add iOS platform** (first time):
   ```bash
   pnpm run cap:add:ios
   ```

5. **Open in Xcode**:
   ```bash
   pnpm run cap:open:ios
   ```

6. **Run on simulator/device** from Xcode

### Making Changes

**For frontend changes**:
```bash
# Make your changes to React components
pnpm run build:mobile  # Rebuild static export
pnpm run cap:sync      # Sync to native project
```

**For backend changes**:
```bash
# Update API routes
vercel deploy          # Redeploy backend
# Mobile app automatically uses new API
```

---

## 🔐 Authentication

NextAuth is configured but **requires server-side sessions**. For mobile:

### Current Setup (Needs Modification)
- NextAuth uses database sessions
- API routes handle authentication
- Cookies store session tokens

### Mobile-Friendly Approach (Recommended)
Consider migrating to JWT tokens:

1. **Option A**: Use NextAuth JWT strategy
   ```typescript
   // auth.ts
   session: { strategy: "jwt" }
   ```

2. **Option B**: Implement custom JWT auth
   - Login returns access/refresh tokens
   - Store tokens in Capacitor Secure Storage
   - Send tokens in API request headers

3. **Option C**: Use Capacitor OAuth plugins
   - `@capacitor-community/apple-sign-in`
   - `@codetrix-studio/capacitor-google-auth`

---

## 🐛 Common Issues

### Issue: "API calls failing in mobile app"

**Solution**: Ensure `NEXT_PUBLIC_API_URL` is set correctly in `.env.mobile`

```bash
# Check the generated .env.local
cat .env.local

# Should contain your production URL
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

### Issue: "Build fails with API route errors"

**Solution**: The build script should automatically exclude API routes. If it fails:

```bash
# Manual cleanup
rm -rf .api.backup .middleware.ts.backup .next

# Rebuild
pnpm run build:mobile
```

### Issue: "Dynamic route /transaction/[id] not working"

**Expected**: This route is excluded from mobile builds. See "Dynamic Routes Limitation" section above for solutions.

### Issue: "Changes not reflecting in iOS app"

**Solution**: Always sync after rebuilding:

```bash
pnpm run build:mobile
pnpm run cap:sync
```

---

## 📦 Native Plugins

Capacitor provides access to native device features:

### Camera (Already Configured)
Your app uses camera for receipt scanning. Ensure permissions:

```typescript
import { Camera } from '@capacitor/camera';

const photo = await Camera.getPhoto({
  quality: 90,
  allowEditing: false,
  resultType: CameraResultType.Base64
});
```

### Recommended Plugins

```bash
# Secure storage for tokens
pnpm add @capacitor/preferences

# Camera access
pnpm add @capacitor/camera

# File system access  
pnpm add @capacitor/filesystem

# Network status
pnpm add @capacitor/network

# Push notifications
pnpm add @capacitor/push-notifications
```

---

## 🚢 Deployment

### Backend (Required First)

1. Deploy to Vercel:
   ```bash
   vercel deploy --prod
   ```

2. Note your production URL

3. Update `.env.mobile`

### Mobile App

1. Build for production:
   ```bash
   pnpm run build:mobile
   ```

2. Open Xcode:
   ```bash
   pnpm run cap:open:ios
   ```

3. Configure signing & capabilities in Xcode

4. Archive and submit to App Store

---

## 🎨 Mobile-Specific Considerations

### Safe Areas
Your app already handles safe areas with Tailwind:

```tsx
<div className="pb-safe">  {/* Bottom safe area */}
```

### Dark Mode
Fully supported via Tailwind's `dark:` classes

### Offline Support
Consider adding:
- Service worker for offline HTML/CSS/JS
- Local SQLite database (via `@capacitor-community/sqlite`)
- Cache API responses

### Performance
- Images are unoptimized for static export
- Consider using `next/image` replacement or manual optimization
- Lazy load heavy components

---

## 📚 Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)

---

## ✅ Next Steps

1. **Deploy your backend** to get a production URL
2. **Update `.env.mobile`** with the real API URL
3. **Decide on transaction details page** approach (see Dynamic Routes section)
4. **Run `pnpm run cap:add:ios`** to initialize iOS project
5. **Open in Xcode** and configure signing
6. **Test on iOS simulator** or physical device

---

**Questions?** Check the Capacitor docs or review this guide for troubleshooting steps.
