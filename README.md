# Project Overview

**Fishek** is a Turkish-language, mobile-first personal finance web app built on **Next.js 16 (App Router) + NextAuth v5 + Drizzle ORM**. It features Gemini-powered receipt scanning, per-user categories/transactions, and JWT sessions.

## Run Locally

**Prerequisites:** Node.js 20+ and pnpm (recommended)

1) Install dependencies  
   `pnpm install`
2) Add environment variables in `.env.local` (example values already provided):  
   - `AUTH_SECRET` (generated)  
   - `AUTH_TRUST_HOST=true`  
   - `DATABASE_URL` (Neon/Postgres)  
   - `GEMINI_API_KEY` and `NEXT_PUBLIC_GEMINI_API_KEY`
3) Initialize the database (creates tables, seeds demo user + sample data)  
   `pnpm run db:init`
4) Run the app (localhost:3000)  
   `pnpm run dev`
5) Production build  
   `pnpm run build`


## Deployment (Coolify/Nixpacks)
- A `nixpacks.toml` is included to force a Node/Next.js build (`pnpm install --no-frozen-lockfile`, `pnpm run build`, `pnpm run start`).  
- Ensure the same env vars from `.env.local` are configured in the platform.

## Project Credits

This project is developed by Eshagh Shahnavazi with FebLabs.
