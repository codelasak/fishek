-- Fishek Database Schema for Neon PostgreSQL

-- Create ENUM for transaction types
CREATE TYPE transaction_type AS ENUM ('INCOME', 'EXPENSE');

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  notes TEXT,
  receipt_image TEXT, -- Base64 encoded image data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_categories_type ON categories(type);

-- Insert initial categories
INSERT INTO categories (id, name, icon, type, budget_limit, color) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Market', 'shopping_cart', 'EXPENSE', 3000.00, 'bg-green-100 text-green-700'),
  ('00000000-0000-0000-0000-000000000002', 'Yeme & İçme', 'restaurant', 'EXPENSE', 2000.00, 'bg-orange-100 text-orange-700'),
  ('00000000-0000-0000-0000-000000000003', 'Ulaşım', 'directions_bus', 'EXPENSE', 1000.00, 'bg-blue-100 text-blue-700'),
  ('00000000-0000-0000-0000-000000000004', 'Fatura', 'receipt_long', 'EXPENSE', 1500.00, 'bg-red-100 text-red-700'),
  ('00000000-0000-0000-0000-000000000005', 'Maaş', 'work', 'INCOME', NULL, 'bg-primary/20 text-primary-dark'),
  ('00000000-0000-0000-0000-000000000006', 'Diğer', 'sell', 'EXPENSE', 500.00, NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert sample transactions
INSERT INTO transactions (id, amount, description, date, category_id, type) VALUES
  ('10000000-0000-0000-0000-000000000001', 245.50, 'Market Alışverişi', CURRENT_DATE, '00000000-0000-0000-0000-000000000001', 'EXPENSE'),
  ('10000000-0000-0000-0000-000000000002', 12500.00, 'Maaş', '2024-07-01', '00000000-0000-0000-0000-000000000005', 'INCOME'),
  ('10000000-0000-0000-0000-000000000003', 450.00, 'Akşam Yemeği', '2024-07-03', '00000000-0000-0000-0000-000000000002', 'EXPENSE')
ON CONFLICT (id) DO NOTHING;
