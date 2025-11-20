# Database Migration Guide: localStorage → Neon PostgreSQL

## Overview

This project has been migrated from using browser localStorage to a production-ready Neon PostgreSQL database. All transaction and category data now persists in a cloud database with proper relational structure and scalability.

## Architecture Changes

### Before (localStorage)
- **Storage**: Browser localStorage (synchronous, client-side only)
- **Data Format**: JSON strings
- **Limitations**: 5-10MB limit, no relationships, no querying capabilities
- **Service**: `services/storageService.ts` (synchronous operations)

### After (Neon PostgreSQL)
- **Storage**: Neon PostgreSQL (serverless, cloud-hosted)
- **Data Format**: Relational tables with proper typing
- **Benefits**: Unlimited storage, ACID compliance, complex queries, real relationships
- **Service**: `services/databaseService.ts` (async/await operations)

## Database Schema

### Tables

#### `categories`
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  type transaction_type NOT NULL,  -- ENUM: 'INCOME' | 'EXPENSE'
  budget_limit DECIMAL(10, 2),
  color VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### `transactions`
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  notes TEXT,
  receipt_image TEXT,  -- Base64 encoded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes
- `idx_transactions_date` - Optimizes date-based queries
- `idx_transactions_category` - Optimizes category filtering
- `idx_transactions_created_at` - Optimizes recent transaction queries
- `idx_categories_type` - Optimizes income/expense filtering

## API Changes

All database operations are now **asynchronous**. Components have been updated to use `async/await` patterns.

### Migration Example

**Before (localStorage):**
```typescript
import { getTransactions } from '../services/storageService';

const Dashboard = () => {
  const transactions = getTransactions();  // Synchronous
  // ...
};
```

**After (Neon PostgreSQL):**
```typescript
import { getTransactions } from '../services/databaseService';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const data = await getTransactions();  // Asynchronous
      setTransactions(data);
      setLoading(false);
    };
    loadData();
  }, []);
  // ...
};
```

## Setup Instructions

### 1. Environment Configuration

Ensure your `.env` file contains the Neon database URL:

```bash
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Initialize Database

Run the initialization script to create tables and seed initial data:

```bash
pnpm run db:init
```

This will:
- Create the `transaction_type` enum
- Create `categories` and `transactions` tables
- Add indexes for performance
- Insert initial category data (Market, Yeme & İçme, etc.)
- Insert sample transactions

### 3. Start Development Server

```bash
pnpm dev
```

The application will now connect to your Neon database instead of localStorage.

## Updated Components

### Core Services
- ✅ `services/db.ts` - Neon connection client
- ✅ `services/databaseService.ts` - All CRUD operations
- ⚠️ `services/storageService.ts` - **DEPRECATED** (kept for reference)

### Pages
- ✅ `pages/Dashboard.tsx` - Async data loading with loading states
- ✅ `pages/AddTransaction.tsx` - Async transaction creation
- ✅ `pages/TransactionDetail.tsx` - Async transaction fetching/deletion
- ✅ `pages/Categories.tsx` - Async category management

### Configuration
- ✅ `vite.config.ts` - Exposes `DATABASE_URL` to client
- ✅ `package.json` - Added `db:init` script

## New Features

### 1. Dashboard Stats Calculation
Automatically calculates:
- Total income (all-time)
- Total expense (all-time)
- Current balance
- Monthly budget (from category limits)
- Monthly spent (current month only)

### 2. Smart Category Budgets
Categories now track `currentSpent` dynamically via SQL aggregation:
```sql
SELECT SUM(amount)
FROM transactions
WHERE category_id = ? AND type = 'EXPENSE'
AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
```

### 3. Proper Data Types
- Monetary values: `DECIMAL(10, 2)` (no floating-point errors)
- Dates: `DATE` type (proper date handling)
- UUIDs: `UUID` type (globally unique identifiers)
- Timestamps: `TIMESTAMP WITH TIME ZONE` (proper timezone handling)

## Performance Optimizations

1. **Indexed Queries** - All common queries use indexed columns
2. **Parallel Fetching** - Dashboard uses `Promise.all()` for concurrent requests
3. **Connection Pooling** - Neon automatically handles connection pooling
4. **Edge Functions Ready** - Neon serverless driver works in edge environments

## Troubleshooting

### Database Connection Errors

If you see connection errors:
1. Verify `DATABASE_URL` is correct in `.env`
2. Check Neon dashboard for database status
3. Ensure SSL is enabled (`sslmode=require`)

### Type Errors

If TypeScript complains about database responses:
```typescript
// The database service handles all type conversions
const result = await getTransactions(); // Returns Transaction[]
```

### Migration from localStorage

If you had existing data in localStorage:
1. Export data from browser DevTools → Application → Local Storage
2. Transform to SQL INSERT statements
3. Run custom migration script

## Future Enhancements

Potential database improvements:
- [ ] Add user authentication with `users` table
- [ ] Implement recurring transactions
- [ ] Add transaction tags/labels (many-to-many relationship)
- [ ] Implement full-text search on descriptions
- [ ] Add data export functionality (CSV, PDF)
- [ ] Implement soft deletes for audit trail

## Resources

- **Neon Documentation**: https://neon.tech/docs
- **@neondatabase/serverless**: https://github.com/neondatabase/serverless
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

## Support

For issues related to:
- **Database connection**: Check Neon dashboard and DATABASE_URL
- **Schema changes**: Edit `db/schema.sql` and re-run `pnpm run db:init`
- **Query performance**: Review indexes in schema.sql
- **Type issues**: Check `services/databaseService.ts` type mappings
