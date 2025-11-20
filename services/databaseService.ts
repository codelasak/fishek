import { db } from '@/db';
import { categories, transactions } from '@/db/schema';
import { eq, desc, and, sql as drizzleSql } from 'drizzle-orm';
import { Transaction, Category, TransactionType } from '../types';

const defaultCategories: Array<{
  name: string;
  icon: string;
  type: TransactionType;
  budgetLimit?: number;
  color?: string;
}> = [
  { name: 'Market', icon: 'shopping_cart', type: TransactionType.EXPENSE, budgetLimit: 3000, color: 'bg-green-100 text-green-700' },
  { name: 'Yeme & İçme', icon: 'restaurant', type: TransactionType.EXPENSE, budgetLimit: 2000, color: 'bg-orange-100 text-orange-700' },
  { name: 'Ulaşım', icon: 'directions_bus', type: TransactionType.EXPENSE, budgetLimit: 1000, color: 'bg-blue-100 text-blue-700' },
  { name: 'Fatura', icon: 'receipt_long', type: TransactionType.EXPENSE, budgetLimit: 1500, color: 'bg-red-100 text-red-700' },
  { name: 'Diğer', icon: 'sell', type: TransactionType.EXPENSE, budgetLimit: 500 },
  { name: 'Maaş', icon: 'work', type: TransactionType.INCOME, color: 'bg-primary/20 text-primary-dark' },
];

// ==================== CATEGORIES ====================

export const getCategories = async (userId: string): Promise<Category[]> => {
  try {
    // Use raw SQL for complex query with subquery
    const result = await db.execute(drizzleSql`
      SELECT
        id::text,
        user_id as "userId",
        name,
        icon,
        type,
        budget_limit as "budgetLimit",
        color,
        COALESCE(
          (SELECT SUM(amount)
           FROM transactions
           WHERE category_id = categories.id
           AND user_id = ${userId}
           AND type = 'EXPENSE'
           AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
           AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)),
          0
        ) as "currentSpent"
      FROM categories
      WHERE user_id = ${userId}
      ORDER BY created_at ASC
    `);

    let mapped = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      type: row.type as TransactionType,
      userId: row.userId,
      budgetLimit: row.budgetLimit ? parseFloat(row.budgetLimit) : undefined,
      currentSpent: parseFloat(row.currentSpent) || 0,
      color: row.color || undefined,
    }));

    // Seed defaults for new users if none exist
    if (mapped.length === 0) {
      await db.insert(categories).values(
        defaultCategories.map((c) => ({
          userId,
          name: c.name,
          icon: c.icon,
          type: c.type,
          budgetLimit: c.budgetLimit?.toString() ?? null,
          color: c.color ?? null,
        }))
      );

      const seeded = await db.execute(drizzleSql`
        SELECT
          id::text,
          user_id as "userId",
          name,
          icon,
          type,
          budget_limit as "budgetLimit",
          color,
          0 as "currentSpent"
        FROM categories
        WHERE user_id = ${userId}
        ORDER BY created_at ASC
      `);

      mapped = seeded.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        icon: row.icon,
        type: row.type as TransactionType,
        userId: row.userId,
        budgetLimit: row.budgetLimit ? parseFloat(row.budgetLimit) : undefined,
        currentSpent: 0,
        color: row.color || undefined,
      }));
    }

    return mapped;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const addCategory = async (category: Omit<Category, 'id' | 'currentSpent'>): Promise<Category> => {
  try {
    const result = await db.insert(categories)
      .values({
        userId: category.userId!,
        name: category.name,
        icon: category.icon,
        type: category.type,
        budgetLimit: category.budgetLimit?.toString() || null,
        color: category.color || null,
      })
      .returning();

    const row = result[0];
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      icon: row.icon,
      type: row.type as TransactionType,
      budgetLimit: row.budgetLimit ? parseFloat(row.budgetLimit) : undefined,
      currentSpent: 0,
      color: row.color || undefined,
    };
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

export const updateCategory = async (category: Category): Promise<void> => {
  try {
    await db.update(categories)
      .set({
        name: category.name,
        icon: category.icon,
        type: category.type,
        budgetLimit: category.budgetLimit?.toString() || null,
        color: category.color || null,
      })
      .where(and(eq(categories.id, category.id), eq(categories.userId, category.userId!)));
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (userId: string, id: string): Promise<void> => {
  try {
    await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// ==================== TRANSACTIONS ====================

export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    // Use raw SQL for EXTRACT(EPOCH) function
    const result = await db.execute(drizzleSql`
      SELECT
        id::text,
        user_id as "userId",
        amount,
        description,
        date::text,
        category_id::text as "categoryId",
        type,
        notes,
        receipt_image as "receiptImage",
        EXTRACT(EPOCH FROM created_at) * 1000 as "createdAt"
      FROM transactions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `);

    return result.rows.map((row: any) => ({
      id: row.id,
      userId: row.userId,
      amount: parseFloat(row.amount),
      description: row.description,
      date: row.date,
      categoryId: row.categoryId,
      type: row.type as TransactionType,
      notes: row.notes || undefined,
      receiptImage: row.receiptImage || undefined,
      createdAt: parseInt(row.createdAt),
    }));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

export const getTransactionById = async (userId: string, id: string): Promise<Transaction | null> => {
  try {
    const result = await db.execute(drizzleSql`
      SELECT
        id::text,
        user_id as "userId",
        amount,
        description,
        date::text,
        category_id::text as "categoryId",
        type,
        notes,
        receipt_image as "receiptImage",
        EXTRACT(EPOCH FROM created_at) * 1000 as "createdAt"
      FROM transactions
      WHERE id = ${id}::uuid AND user_id = ${userId}
    `);

    if (result.rows.length === 0) return null;

    const row: any = result.rows[0];
    return {
      id: row.id,
      userId: row.userId,
      amount: parseFloat(row.amount),
      description: row.description,
      date: row.date,
      categoryId: row.categoryId,
      type: row.type as TransactionType,
      notes: row.notes || undefined,
      receiptImage: row.receiptImage || undefined,
      createdAt: parseInt(row.createdAt),
    };
  } catch (error) {
    console.error('Error fetching transaction:', error);
    throw error;
  }
};

export const saveTransaction = async (transaction: Transaction): Promise<void> => {
  try {
    // Check if transaction exists
    const existing = await db.select({ id: transactions.id })
      .from(transactions)
      .where(and(eq(transactions.id, transaction.id), eq(transactions.userId, transaction.userId!)))
      .limit(1);

    if (existing.length > 0) {
      // Update existing transaction
      await db.update(transactions)
        .set({
          userId: transaction.userId!,
          amount: transaction.amount.toString(),
          description: transaction.description,
          date: transaction.date,
          categoryId: transaction.categoryId,
          type: transaction.type,
          notes: transaction.notes || null,
          receiptImage: transaction.receiptImage || null,
        })
        .where(and(eq(transactions.id, transaction.id), eq(transactions.userId, transaction.userId!)));
    } else {
      // Insert new transaction
      await db.insert(transactions)
        .values({
          id: transaction.id,
          userId: transaction.userId!,
          amount: transaction.amount.toString(),
          description: transaction.description,
          date: transaction.date,
          categoryId: transaction.categoryId,
          type: transaction.type,
          notes: transaction.notes || null,
          receiptImage: transaction.receiptImage || null,
        });
    }
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
};

export const deleteTransaction = async (userId: string, id: string): Promise<void> => {
  try {
    await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

// ==================== DASHBOARD STATS ====================

export const getDashboardStats = async (userId: string) => {
  try {
    // Use raw SQL for complex aggregations
    const result = await db.execute(drizzleSql`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as total_expense,
        COALESCE(
          SUM(CASE WHEN type = 'EXPENSE'
            AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
            THEN amount ELSE 0 END),
          0
        ) as monthly_spent
      FROM transactions
      WHERE user_id = ${userId}
    `);

    const stats: any = result.rows[0];
    const totalIncome = parseFloat(stats.total_income) || 0;
    const totalExpense = parseFloat(stats.total_expense) || 0;
    const monthlySpent = parseFloat(stats.monthly_spent) || 0;

    // Get total monthly budget from categories
    const budgetResult = await db.execute(drizzleSql`
      SELECT COALESCE(SUM(budget_limit), 0) as total_budget
      FROM categories
      WHERE user_id = ${userId} AND type = 'EXPENSE' AND budget_limit IS NOT NULL
    `);

    const monthlyBudget = parseFloat((budgetResult.rows[0] as any).total_budget) || 0;

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      monthlyBudget,
      monthlySpent,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};
