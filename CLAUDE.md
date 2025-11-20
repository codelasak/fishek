# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Fishek** is a Turkish-language personal finance tracking mobile web app built with React, TypeScript, and Vite. The app features AI-powered receipt scanning using Google Gemini API for automatic transaction entry.

## Development Commands

**Package Manager**: This project uses `npm` (not yarn or pnpm, despite pnpm-lock.yaml presence)

```bash
# Install dependencies
npm install

# Run development server (localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Setup

**Required**: Create `.env.local` in the root directory:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

The Vite config (vite.config.ts:14-15) exposes this as both `process.env.API_KEY` and `process.env.GEMINI_API_KEY` for the Gemini service.

## Architecture

### Data Flow & State Management

**No state management library** - uses React local state and localStorage for persistence:

1. **Storage Layer** (`services/storageService.ts`):
   - localStorage keys: `fishek_transactions`, `fishek_categories`
   - All CRUD operations go through this service
   - Initial mock data auto-populated on first load
   - Transactions sorted by `createdAt` timestamp (desc)

2. **AI Service** (`services/geminiService.ts`):
   - Uses `@google/genai` SDK with `gemini-2.5-flash` model
   - Structured output with JSON schema for receipt extraction
   - Critical: If receipt total is cut off, AI sums individual line items
   - Returns Turkish-language summaries even for English receipts
   - Category mapping: Market, Yeme & İçme, Ulaşım, Fatura, Diğer (Turkish categories)

### Routing Architecture

Uses **HashRouter** (not BrowserRouter) for deployment compatibility:
- `/login` - Login page (UI only, no real auth)
- `/` - Dashboard with stats and recent transactions
- `/add-transaction` - Transaction form with camera/receipt scanning
- `/transaction/:id` - Transaction detail/edit view
- `/categories` - Category management with budget tracking

### Type System

All core types defined in `types.ts`:
- `TransactionType` enum: `INCOME | EXPENSE`
- `Category`: includes `budgetLimit`, `currentSpent`, Material icon name, Tailwind color classes
- `Transaction`: supports optional `receiptImage` (base64 data URI), `notes`
- `DashboardStats`: aggregated financial metrics

### Styling System

**Tailwind CDN** (not npm package) configured in `index.html`:
- Custom theme colors: `primary` (#13ec5b green), dark mode support
- Uses `class` attribute for dark mode toggle
- Material Symbols Outlined for icons (accessed via class name strings)
- Mobile-first design with max-width constraint
- Custom font: Inter from Google Fonts

### Path Alias

TypeScript path alias `@/*` maps to project root (not `src/`):
```typescript
import { getTransactions } from '@/services/storageService';
```

## Key Implementation Details

**Receipt Scanning Workflow**:
1. User captures image in AddTransaction page
2. Image converted to base64 data URI
3. Sent to `geminiService.scanReceipt()` with structured prompt
4. AI returns JSON with amount, merchant, date, category (Turkish), summary
5. Auto-populates transaction form fields
6. Receipt image optionally stored with transaction

**Category Budget System**:
- Categories have optional `budgetLimit`
- `currentSpent` calculated from transactions (but stored in Category object for UI simplicity)
- Visual indicators show budget usage percentage
- Only EXPENSE categories have budgets

**Transaction Card Display**:
- Shows category icon (Material Symbols), amount, description, date
- Color-coded by category
- Swipe actions may be implemented in TransactionCard component

## Language & Localization

- **UI Language**: Turkish (categories, labels, summaries)
- **Date Format**: ISO format (YYYY-MM-DD) for data, localized display in UI
- **Currency**: No currency symbol specified (assumes TRY/Turkish Lira implied)

## Import Map

Uses browser import maps (index.html:58-68) for CDN dependencies:
- React/ReactDOM from aistudiocdn.com
- React Router from aistudiocdn.com
- @google/genai from aistudiocdn.com

This enables ESM imports without bundling these dependencies.

## Mobile Optimizations

- Viewport locked: `user-scalable=no` for app-like experience
- Pull-to-refresh disabled: `overscroll-behavior-y: none`
- Scrollbar hidden with `.no-scrollbar` utility class
- Fixed bottom navigation bar
- Max-width container for mobile screen constraint
