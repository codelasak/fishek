-- Fishek Database Schema for Neon PostgreSQL

-- ==================== AUTH TABLES ====================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified TIMESTAMPTZ,
  image TEXT,
  password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type VARCHAR(255),
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  oauth_token_secret TEXT,
  oauth_token TEXT,
  PRIMARY KEY (provider, provider_account_id)
);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

CREATE TABLE IF NOT EXISTS sessions (
  session_token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE TABLE IF NOT EXISTS authenticators (
  credential_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_account_id TEXT NOT NULL,
  credential_public_key TEXT NOT NULL,
  counter INTEGER NOT NULL,
  credential_device_type VARCHAR(255) NOT NULL,
  credential_backed_up BOOLEAN NOT NULL,
  transports TEXT
);

-- Seed demo user (password: Eshagh611)
INSERT INTO users (id, name, email, password, email_verified)
VALUES (
  '11111111-2222-3333-4444-555555555555',
  'Eshagh',
  'eshagh@fennaver.com',
  'scrypt$16384$8$1$99c6b5a81bd3963d1c818f5aeed97ee2$95ab7917e0ed56894466f2611c58d3f71ec3df4d43dea3a050c3058930461ae29bae7c52604778a241013055962ebb858b89f389380a5aadf025878474d6d749',
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- Create ENUM for transaction types (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
    CREATE TYPE transaction_type AS ENUM ('INCOME', 'EXPENSE');
  END IF;
END$$;

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  type transaction_type NOT NULL,
  budget_limit DECIMAL(10, 2),
  color VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  notes TEXT,
  receipt_image TEXT, -- Base64 encoded image data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure user scoping columns exist (for existing tables)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;

-- Seed demo user ID to existing rows if missing
UPDATE categories SET user_id = '11111111-2222-3333-4444-555555555555' WHERE user_id IS NULL;
UPDATE transactions SET user_id = '11111111-2222-3333-4444-555555555555' WHERE user_id IS NULL;

-- Enforce not null after backfill
ALTER TABLE categories ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN user_id SET NOT NULL;

-- Indexes for performance (idempotent)
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);

-- Insert initial categories (scoped to demo user)
INSERT INTO categories (id, user_id, name, icon, type, budget_limit, color) VALUES
  ('00000000-0000-0000-0000-000000000001', '11111111-2222-3333-4444-555555555555', 'Market', 'shopping_cart', 'EXPENSE', 3000.00, 'bg-green-100 text-green-700'),
  ('00000000-0000-0000-0000-000000000002', '11111111-2222-3333-4444-555555555555', 'Yeme & İçme', 'restaurant', 'EXPENSE', 2000.00, 'bg-orange-100 text-orange-700'),
  ('00000000-0000-0000-0000-000000000003', '11111111-2222-3333-4444-555555555555', 'Ulaşım', 'directions_bus', 'EXPENSE', 1000.00, 'bg-blue-100 text-blue-700'),
  ('00000000-0000-0000-0000-000000000004', '11111111-2222-3333-4444-555555555555', 'Fatura', 'receipt_long', 'EXPENSE', 1500.00, 'bg-red-100 text-red-700'),
  ('00000000-0000-0000-0000-000000000005', '11111111-2222-3333-4444-555555555555', 'Maaş', 'work', 'INCOME', NULL, 'bg-primary/20 text-primary-dark'),
  ('00000000-0000-0000-0000-000000000006', '11111111-2222-3333-4444-555555555555', 'Diğer', 'sell', 'EXPENSE', 500.00, NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert sample transactions
INSERT INTO transactions (id, user_id, amount, description, date, category_id, type) VALUES
  ('10000000-0000-0000-0000-000000000001', '11111111-2222-3333-4444-555555555555', 245.50, 'Market Alışverişi', CURRENT_DATE, '00000000-0000-0000-0000-000000000001', 'EXPENSE'),
  ('10000000-0000-0000-0000-000000000002', '11111111-2222-3333-4444-555555555555', 12500.00, 'Maaş', '2024-07-01', '00000000-0000-0000-0000-000000000005', 'INCOME'),
  ('10000000-0000-0000-0000-000000000003', '11111111-2222-3333-4444-555555555555', 450.00, 'Akşam Yemeği', '2024-07-03', '00000000-0000-0000-0000-000000000002', 'EXPENSE')
ON CONFLICT (id) DO NOTHING;
