-- Family Mode Migration
-- Adds family tables to existing database

-- Create family_role enum if it doesn't exist
DO $$ BEGIN
 CREATE TYPE family_role AS ENUM('ADMIN', 'MEMBER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Families Table
CREATE TABLE IF NOT EXISTS families (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	name varchar(100) NOT NULL,
	invite_code varchar(20) NOT NULL UNIQUE,
	created_by text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_families_invite_code ON families(invite_code);
CREATE INDEX IF NOT EXISTS idx_families_created_by ON families(created_by);

-- Family Members Junction Table
CREATE TABLE IF NOT EXISTS family_members (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
	user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	role family_role NOT NULL DEFAULT 'MEMBER',
	joined_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_family_members_family ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_family_members_unique ON family_members(family_id, user_id);

-- Family Categories Table
CREATE TABLE IF NOT EXISTS family_categories (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
	name varchar(100) NOT NULL,
	icon varchar(50) NOT NULL,
	type transaction_type NOT NULL,
	budget_limit numeric(10, 2),
	color varchar(100),
	created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_family_categories_family ON family_categories(family_id);
CREATE INDEX IF NOT EXISTS idx_family_categories_type ON family_categories(type);

-- Family Transactions Table
CREATE TABLE IF NOT EXISTS family_transactions (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
	user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	amount numeric(10, 2) NOT NULL,
	description text NOT NULL,
	date date NOT NULL,
	category_id uuid NOT NULL REFERENCES family_categories(id) ON DELETE CASCADE,
	type transaction_type NOT NULL,
	notes text,
	receipt_image text,
	created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_family_transactions_family ON family_transactions(family_id);
CREATE INDEX IF NOT EXISTS idx_family_transactions_user ON family_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_family_transactions_date ON family_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_family_transactions_category ON family_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_family_transactions_created_at ON family_transactions(created_at DESC);

-- Spending Limits Table
CREATE TABLE IF NOT EXISTS spending_limits (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
	category_id uuid REFERENCES family_categories(id) ON DELETE CASCADE,
	user_id text REFERENCES users(id) ON DELETE CASCADE,
	limit_amount numeric(10, 2) NOT NULL,
	period varchar(20) NOT NULL DEFAULT 'MONTHLY',
	alert_threshold integer NOT NULL DEFAULT 80,
	created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_spending_limits_family ON spending_limits(family_id);
CREATE INDEX IF NOT EXISTS idx_spending_limits_category ON spending_limits(category_id);
CREATE INDEX IF NOT EXISTS idx_spending_limits_user ON spending_limits(user_id);

-- Budget Alerts Table
CREATE TABLE IF NOT EXISTS budget_alerts (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
	spending_limit_id uuid NOT NULL REFERENCES spending_limits(id) ON DELETE CASCADE,
	user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	alert_type varchar(20) NOT NULL,
	current_amount numeric(10, 2) NOT NULL,
	limit_amount numeric(10, 2) NOT NULL,
	is_read boolean NOT NULL DEFAULT false,
	created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_budget_alerts_family ON budget_alerts(family_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_user ON budget_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_is_read ON budget_alerts(is_read);
