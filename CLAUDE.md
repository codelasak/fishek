# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Fishek** is a Turkish-language, mobile-first personal finance web application featuring:
- **Next.js 16** with App Router
- **NextAuth v5** (beta) with JWT sessions and credentials provider
- **Drizzle ORM** with PostgreSQL (Neon database)
- **Gemini AI** for receipt scanning and transaction extraction
- **Family Mode** for shared household finance management
- **React 19** with TypeScript

## Development Commands

### Essential Commands
```bash
# Install dependencies (pnpm preferred)
pnpm install

# Development server (localhost:3000)
pnpm run dev

# Production build
pnpm run build

# Start production server
pnpm run start

# Linting
pnpm run lint

# Database initialization (creates schema + seeds demo data)
pnpm run db:init
```

### Database Operations
```bash
# Initialize database with schema and seed data
node scripts/initDatabase.js

# Generate Drizzle migration
npx drizzle-kit generate

# Push schema changes directly to database
npx drizzle-kit push
```

## Architecture

### Authentication System
- **NextAuth v5 (beta.30)** with Drizzle adapter
- JWT-based sessions (strategy: 'jwt')
- Credentials provider with bcrypt password hashing
- Split configuration: `auth.config.ts` (edge-compatible) and `auth.ts` (full config with database)
- Middleware protection on all routes except `/api`, `/_next/*`, and static assets
- User registration via `/api/auth/register` with password hashing in `lib/password.ts`

### Database Schema (db/schema.ts)
**Auth Tables** (NextAuth standard):
- `users` - User accounts with email/password
- `accounts` - OAuth provider accounts
- `sessions` - Session tokens
- `verification_tokens` - Email verification
- `authenticators` - WebAuthn credentials

**Personal Finance Tables**:
- `categories` - User-specific transaction categories with budget limits
- `transactions` - User transactions with category references and optional receipt images

**Family Mode Tables** (multi-user finance management):
- `families` - Family groups with invite codes
- `family_members` - Junction table with roles (ADMIN/MEMBER)
- `family_categories` - Shared categories for family groups
- `family_transactions` - Transactions visible to all family members
- `family_spending_limits` - Per-member spending limits set by admins

### Family Mode Context System
- **FamilyContext** (`lib/FamilyContext.tsx`) - Client-side context provider
- Modes: `'personal'` (default) | `'family'` (shared)
- LocalStorage persistence for mode and active family selection
- API routes under `/api/families`, `/api/family-transactions`, `/api/family-categories`
- Family admins can set per-member spending limits
- Invite code system for family member onboarding via `/api/families/join`

### Gemini AI Receipt Scanning
- **Service**: `services/geminiService.ts`
- Model: `gemini-2.5-flash`
- Capabilities:
  - Extract transaction amounts (sums line items if total is cut off)
  - Merchant name detection
  - Date extraction (defaults to current date)
  - Auto-categorization to Turkish categories (Market, Yeme & İçme, Ulaşım, Fatura, Diğer)
  - Summary generation in Turkish regardless of receipt language
- Uses structured JSON output with response schema validation

### API Structure (app/api)
```
/api
├── auth/           # NextAuth handlers + custom registration
├── categories/     # Personal categories CRUD
├── transactions/   # Personal transactions CRUD
├── stats/          # Dashboard statistics calculation
├── families/       # Family management (create, join, list)
│   ├── [id]/       # Family-specific operations
│   └── join/       # Invite code validation and joining
├── family-categories/      # Family-wide categories
├── family-transactions/    # Family-wide transactions
└── spending-limits/        # Admin-set member spending limits
```

### Services Layer (services/)
- `apiClient.ts` - Frontend API wrappers for transactions, categories, stats
- `databaseService.ts` - Server-side Drizzle ORM data access layer (CRUD operations)
- `geminiService.ts` - Google Gemini AI integration for receipt scanning
- `db.ts` - Drizzle database instance initialization

### Import Aliases
- `@/*` - Root directory alias (configured in tsconfig.json)
- Example: `import { db } from '@/db'`

### TypeScript Configuration
- **Target**: ES2022
- **Strict mode**: Disabled (but strictNullChecks enabled)
- **Module**: ESNext with bundler resolution
- **JSX**: react-jsx (React 19)
- Project uses `"type": "module"` for ES modules

## Key Patterns

### Route Handler Pattern
API routes use Next.js 15+ App Router conventions:
```typescript
// app/api/[resource]/route.ts
import { auth } from '@/auth';
import { databaseService } from '@/services/databaseService';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await databaseService.someMethod(session.user.id);
  return Response.json({ data });
}
```

### Family Mode Filtering
Components and API routes check `mode` and `activeFamily` context:
```typescript
const { mode, activeFamily } = useFamily();

if (mode === 'family' && activeFamily) {
  // Load family data from /api/family-* endpoints
} else {
  // Load personal data from /api/* endpoints
}
```

### Transaction Type System
- Enum: `'INCOME' | 'EXPENSE'` (defined in both `types.ts` and `db/schema.ts`)
- Category type must match transaction type
- Dashboard calculates balance as `income - expense`

## Environment Variables

Required in `.env.local` or deployment platform:
```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# NextAuth
AUTH_SECRET=generated-secret-32-chars-min
AUTH_TRUST_HOST=true
NEXTAUTH_URL=http://localhost:3000  # Production URL in deployment

# Gemini AI
GEMINI_API_KEY=your-api-key
NEXT_PUBLIC_GEMINI_API_KEY=your-api-key  # For client-side usage
```

## Deployment

### Coolify/Nixpacks Configuration
- Uses Node.js 22 (specified in `nixpacks.toml`)
- Build caching for `.next/cache` and `node_modules/.cache`
- Build command: `npm run build` (no frozen lockfile)
- Start command: `npm run start`
- Ensure environment variables are configured in platform settings

### Database Initialization
After deploying, run database initialization:
```bash
pnpm run db:init
```
This creates all tables and seeds a demo user:
- Email: `demo@fishek.com`
- Password: `demo123`

## Testing User Workflows

### Personal Finance Flow
1. Register: POST `/api/auth/register` with `{email, password, name}`
2. Login: Use NextAuth signIn with credentials
3. View dashboard: GET `/` (server-side session check)
4. Add transaction: POST `/api/transactions` with amount, description, date, categoryId
5. Scan receipt: Use camera, call `scanReceipt()` from `geminiService.ts`

### Family Mode Flow
1. Create family: POST `/api/families` with family name
2. Share invite code: Family admin receives unique code
3. Join family: POST `/api/families/join` with invite code
4. Switch mode: Use `FamilyModeToggle` component or context methods
5. Set spending limits: POST `/api/spending-limits` (admin only)
6. View family transactions: GET `/api/family-transactions?familyId={id}`

## UI Components

Located in `components/`:
- `TransactionCard.tsx` - Individual transaction display
- `BottomNav.tsx` - Mobile navigation bar
- `FamilyModeToggle.tsx` - Switch between personal/family modes

## Styling

- **Tailwind CSS 3.4** with custom config
- **Plugins**: `@tailwindcss/forms`, `@tailwindcss/container-queries`
- **Mobile-first**: Responsive design for Turkish mobile users
- Global styles in `app/globals.css`

## Development Notes

- Turkish language throughout UI (form labels, error messages, categories)
- Currency display defaults to TRY (₺)
- Date format: YYYY-MM-DD (ISO standard)
- Receipt images stored as base64 in `receipt_image` column
- NextAuth session accessible via `useSession()` hook or `auth()` helper
- All database queries use Drizzle ORM (never raw SQL except in `schema.sql`)
- Server actions not used - API routes preferred for data mutations
