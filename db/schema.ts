import { pgTable, uuid, varchar, decimal, text, date, timestamp, pgEnum, index, primaryKey, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for transaction types
export const transactionTypeEnum = pgEnum('transaction_type', ['INCOME', 'EXPENSE']);

// ==================== AUTH TABLES ====================

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  image: text('image'),
  password: text('password'), // Hashed password for credentials provider
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
    oauth_token_secret: text('oauth_token_secret'),
    oauth_token: text('oauth_token'),
  },
  (table) => ({
    accountsProviderProviderAccountIdKey: primaryKey({
      columns: [table.provider, table.providerAccountId],
    }),
    userIdx: index('idx_accounts_user_id').on(table.userId),
  })
);

export const sessions = pgTable(
  'sessions',
  {
    sessionToken: text('session_token').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (table) => ({
    userIdx: index('idx_sessions_user_id').on(table.userId),
  })
);

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (table) => ({
    verificationTokensIdentifierTokenKey: primaryKey({
      columns: [table.identifier, table.token],
    }),
  })
);

export const authenticators = pgTable('authenticators', {
  credentialID: text('credential_id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  providerAccountId: text('provider_account_id').notNull(),
  credentialPublicKey: text('credential_public_key').notNull(),
  counter: integer('counter').notNull(),
  credentialDeviceType: varchar('credential_device_type', { length: 255 }).notNull(),
  credentialBackedUp: boolean('credential_backed_up').notNull(),
  transports: text('transports'),
});

// ==================== APP TABLES ====================

// Categories Table
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  type: transactionTypeEnum('type').notNull(),
  budgetLimit: decimal('budget_limit', { precision: 10, scale: 2 }),
  color: varchar('color', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  typeIdx: index('idx_categories_type').on(table.type),
  userIdx: index('idx_categories_user').on(table.userId),
}));

// Transactions Table
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description').notNull(),
  date: date('date').notNull(),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  type: transactionTypeEnum('type').notNull(),
  notes: text('notes'),
  receiptImage: text('receipt_image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dateIdx: index('idx_transactions_date').on(table.date.desc()),
  categoryIdx: index('idx_transactions_category').on(table.categoryId),
  userIdx: index('idx_transactions_user').on(table.userId),
  createdAtIdx: index('idx_transactions_created_at').on(table.createdAt.desc()),
}));

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

// ==================== FAMILY MODE TABLES ====================

// Family role enum
export const familyRoleEnum = pgEnum('family_role', ['ADMIN', 'MEMBER']);

// Families Table
export const families = pgTable('families', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  inviteCode: varchar('invite_code', { length: 20 }).notNull().unique(),
  createdBy: text('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  inviteCodeIdx: index('idx_families_invite_code').on(table.inviteCode),
  createdByIdx: index('idx_families_created_by').on(table.createdBy),
}));

// Family Members Junction Table
export const familyMembers = pgTable('family_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: familyRoleEnum('role').notNull().default('MEMBER'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  familyIdx: index('idx_family_members_family').on(table.familyId),
  userIdx: index('idx_family_members_user').on(table.userId),
  uniqueMembership: index('idx_family_members_unique').on(table.familyId, table.userId),
}));

// Family Categories Table
export const familyCategories = pgTable('family_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  type: transactionTypeEnum('type').notNull(),
  budgetLimit: decimal('budget_limit', { precision: 10, scale: 2 }),
  color: varchar('color', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  familyIdx: index('idx_family_categories_family').on(table.familyId),
  typeIdx: index('idx_family_categories_type').on(table.type),
}));

// Family Transactions Table
export const familyTransactions = pgTable('family_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description').notNull(),
  date: date('date').notNull(),
  categoryId: uuid('category_id').notNull().references(() => familyCategories.id, { onDelete: 'cascade' }),
  type: transactionTypeEnum('type').notNull(),
  notes: text('notes'),
  receiptImage: text('receipt_image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  familyIdx: index('idx_family_transactions_family').on(table.familyId),
  userIdx: index('idx_family_transactions_user').on(table.userId),
  dateIdx: index('idx_family_transactions_date').on(table.date.desc()),
  categoryIdx: index('idx_family_transactions_category').on(table.categoryId),
  createdAtIdx: index('idx_family_transactions_created_at').on(table.createdAt.desc()),
}));

// Spending Limits Table
export const spendingLimits = pgTable('spending_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => familyCategories.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  limitAmount: decimal('limit_amount', { precision: 10, scale: 2 }).notNull(),
  period: varchar('period', { length: 20 }).notNull().default('MONTHLY'), // MONTHLY, WEEKLY, etc.
  alertThreshold: integer('alert_threshold').notNull().default(80), // Percentage for alerts
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  familyIdx: index('idx_spending_limits_family').on(table.familyId),
  categoryIdx: index('idx_spending_limits_category').on(table.categoryId),
  userIdx: index('idx_spending_limits_user').on(table.userId),
}));

// Budget Alerts Table
export const budgetAlerts = pgTable('budget_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  spendingLimitId: uuid('spending_limit_id').notNull().references(() => spendingLimits.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  alertType: varchar('alert_type', { length: 20 }).notNull(), // WARNING, EXCEEDED
  currentAmount: decimal('current_amount', { precision: 10, scale: 2 }).notNull(),
  limitAmount: decimal('limit_amount', { precision: 10, scale: 2 }).notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  familyIdx: index('idx_budget_alerts_family').on(table.familyId),
  userIdx: index('idx_budget_alerts_user').on(table.userId),
  isReadIdx: index('idx_budget_alerts_is_read').on(table.isRead),
}));

// Family Relations
export const familiesRelations = relations(families, ({ many, one }) => ({
  members: many(familyMembers),
  categories: many(familyCategories),
  transactions: many(familyTransactions),
  spendingLimits: many(spendingLimits),
  alerts: many(budgetAlerts),
  creator: one(users, {
    fields: [families.createdBy],
    references: [users.id],
  }),
}));

export const familyMembersRelations = relations(familyMembers, ({ one }) => ({
  family: one(families, {
    fields: [familyMembers.familyId],
    references: [families.id],
  }),
  user: one(users, {
    fields: [familyMembers.userId],
    references: [users.id],
  }),
}));

export const familyCategoriesRelations = relations(familyCategories, ({ one, many }) => ({
  family: one(families, {
    fields: [familyCategories.familyId],
    references: [families.id],
  }),
  transactions: many(familyTransactions),
}));

export const familyTransactionsRelations = relations(familyTransactions, ({ one }) => ({
  family: one(families, {
    fields: [familyTransactions.familyId],
    references: [families.id],
  }),
  user: one(users, {
    fields: [familyTransactions.userId],
    references: [users.id],
  }),
  category: one(familyCategories, {
    fields: [familyTransactions.categoryId],
    references: [familyCategories.id],
  }),
}));

export const spendingLimitsRelations = relations(spendingLimits, ({ one, many }) => ({
  family: one(families, {
    fields: [spendingLimits.familyId],
    references: [families.id],
  }),
  category: one(familyCategories, {
    fields: [spendingLimits.categoryId],
    references: [familyCategories.id],
  }),
  user: one(users, {
    fields: [spendingLimits.userId],
    references: [users.id],
  }),
  alerts: many(budgetAlerts),
}));

export const budgetAlertsRelations = relations(budgetAlerts, ({ one }) => ({
  family: one(families, {
    fields: [budgetAlerts.familyId],
    references: [families.id],
  }),
  spendingLimit: one(spendingLimits, {
    fields: [budgetAlerts.spendingLimitId],
    references: [spendingLimits.id],
  }),
  user: one(users, {
    fields: [budgetAlerts.userId],
    references: [users.id],
  }),
}));

// TypeScript types inferred from schema
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type User = typeof users.$inferSelect;
export type Family = typeof families.$inferSelect;
export type NewFamily = typeof families.$inferInsert;
export type FamilyMember = typeof familyMembers.$inferSelect;
export type NewFamilyMember = typeof familyMembers.$inferInsert;
export type FamilyCategory = typeof familyCategories.$inferSelect;
export type NewFamilyCategory = typeof familyCategories.$inferInsert;
export type FamilyTransaction = typeof familyTransactions.$inferSelect;
export type NewFamilyTransaction = typeof familyTransactions.$inferInsert;
export type SpendingLimit = typeof spendingLimits.$inferSelect;
export type NewSpendingLimit = typeof spendingLimits.$inferInsert;
export type BudgetAlert = typeof budgetAlerts.$inferSelect;
export type NewBudgetAlert = typeof budgetAlerts.$inferInsert;
