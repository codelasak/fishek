# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js 16 App Router pages (dashboard, login/register, family settings, add-transaction) plus `layout.tsx`, `providers.tsx`, and Tailwind styles in `globals.css`.
- `components/`: Shared UI such as `BottomNav`, `TransactionCard`, onboarding and family-mode widgets.
- `services/`: API wrappers for transactions/categories/stats, Gemini client, storage helpers, and database bootstrap logic.
- `lib/`: Auth/family/mobile contexts, JWT helpers, onboarding storage utilities.
- `db/`: Drizzle schema entrypoint and SQL; `drizzle/` holds generated migrations; `scripts/` covers database init, family migration, and mobile build helpers.
- `public/` for static assets; `auth.ts`/`auth.config.ts` configure NextAuth.

## Build, Test, and Development Commands
- Install: `pnpm install`
- Dev server: `pnpm dev` (localhost:3000)
- Production build: `pnpm build`; serve with `pnpm start`
- Linting: `pnpm lint` (Next + ESLint)
- Database seed/init: `pnpm run db:init`
- Mobile bundle: `pnpm run build:mobile`; Capacitor sync/open/run for iOS via `pnpm run cap:sync`, `cap:open:ios`, `cap:run:ios`

## Coding Style & Naming Conventions
- TypeScript + App Router; prefer server components—add `use client` only when hooks/state are required.
- 2-space indentation, single quotes, and semicolons consistent with `eslint-config-next`.
- Components in PascalCase; hooks prefixed with `use`; route handlers live under `app/api/*` and should return typed JSON.
- Tailwind-first styling; add shared styles to `app/globals.css` sparingly instead of ad-hoc CSS files.
- Keep copy Turkish-friendly and mobile-first; reuse existing contexts (`FamilyContext`, `MobileAuthContext`) for shared state.

## Testing Guidelines
- No automated runner is checked in; current checks are `pnpm lint` plus manual QA of auth, onboarding, family mode, and transaction flows.
- If adding tests, co-locate `*.test.ts`/`*.test.tsx` near the module, document the runner in the PR, and favor React Testing Library for UI; mock Drizzle calls or use seed data to avoid touching prod databases.
- Keep fixtures small and anonymized; capture regression cases around currency formatting and family toggles.

## Commit & Pull Request Guidelines
- Follow the existing conventional style (`feat: ...`, `fix: ...`, `chore: ...`).
- For schema changes, update `db/schema.ts`, include generated SQL in `drizzle/`, and note any manual steps in the PR.
- PRs should include: brief summary, before/after screenshots for UI (mobile views preferred), steps to validate, and linked issues/tasks.
- Do not commit `.env*`, `dist/`, `out/`, `ios/`, or other build artifacts; keep secrets out of logs and diffs.

## Security & Configuration Tips
- Required env vars: `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, `DATABASE_URL`, `GEMINI_API_KEY`, `NEXT_PUBLIC_GEMINI_API_KEY` (and any platform-specific keys). Store them in `.env.local`; never commit.
- When touching auth/session, keep `auth.ts`, `auth.config.ts`, and `middleware.ts` aligned and retest both web and Capacitor flows.
- Validate and sanitize request payloads in `services/apiClient.ts` and API routes; avoid logging PII or tokens.
