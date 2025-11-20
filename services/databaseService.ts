import { sql } from './db';
import { Transaction, Category, TransactionType } from '../types';

// ==================== CATEGORIES ====================

export const getCategories = async (): Promise<Category[]> => {
  try {
    const result = await sql`
      SELECT
        id::text,
        name,
        icon,
        type,
        budget_limit as "budgetLimit",
        color,
        COALESCE(
          (SELECT SUM(amount)
           FROM transactions
           WHERE category_id = categories.id
           AND type = 'EXPENSE'
           AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
           AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)),
          0
        ) as "currentSpent"
      FROM categories
      ORDER BY created_at ASC
    `;

    return result.map((row: any) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      type: row.type as TransactionType,
      budgetLimit: row.budgetLimit ? parseFloat(row.budgetLimit) : undefined,
      currentSpent: parseFloat(row.currentSpent) || 0,
      color: row.color || undefined,
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const addCategory = async (category: Omit<Category, 'id' | 'currentSpent'>): Promise<Category> => {
  try {
    const result = await sql`
      INSERT INTO categories (name, icon, type, budget_limit, color)
      VALUES (
        ${category.name},
        ${category.icon},
        ${category.type},
        ${category.budgetLimit || null},
        ${category.color || null}
      )
      RETURNING
        id::text,
        name,
        icon,
        type,
        budget_limit as "budgetLimit",
        color
    `;

    const row = result[0];
    return {
      id: row.id,
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
    await sql`
      UPDATE categories
      SET
        name = ${category.name},
        icon = ${category.icon},
        type = ${category.type},
        budget_limit = ${category.budgetLimit || null},
        color = ${category.color || null}
      WHERE id = ${category.id}::uuid
    `;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id: string): Promise<void> => {
  try {
    await sql`DELETE FROM categories WHERE id = ${id}::uuid`;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// ==================== TRANSACTIONS ====================

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const result = await sql`
      SELECT
        id::text,
        amount,
        description,
        date::text,
        category_id::text as "categoryId",
        type,
        notes,
        receipt_image as "receiptImage",
        EXTRACT(EPOCH FROM created_at) * 1000 as "createdAt"
      FROM transactions
      ORDER BY created_at DESC
    `;

    return result.map((row: any) => ({
      id: row.id,
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

export const getTransactionById = async (id: string): Promise<Transaction | null> => {
  try {
    const result = await sql`
      SELECT
        id::text,
        amount,
        description,
        date::text,
        category_id::text as "categoryId",
        type,
        notes,
        receipt_image as "receiptImage",
        EXTRACT(EPOCH FROM created_at) * 1000 as "createdAt"
      FROM transactions
      WHERE id = ${id}::uuid
    `;

    if (result.length === 0) return null;

    const row = result[0];
    return {
      id: row.id,
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
    const existing = await sql`SELECT id FROM transactions WHERE id = ${transaction.id}::uuid`;

    if (existing.length > 0) {
      // Update existing transaction
      await sql`
        UPDATE transactions
        SET
          amount = ${transaction.amount},
          description = ${transaction.description},
          date = ${transaction.date}::date,
          category_id = ${transaction.categoryId}::uuid,
          type = ${transaction.type},
          notes = ${transaction.notes || null},
          receipt_image = ${transaction.receiptImage || null}
        WHERE id = ${transaction.id}::uuid
      `;
    } else {
      // Insert new transaction
      await sql`
        INSERT INTO transactions (id, amount, description, date, category_id, type, notes, receipt_image)
        VALUES (
          ${transaction.id}::uuid,
          ${transaction.amount},
          ${transaction.description},
          ${transaction.date}::date,
          ${transaction.categoryId}::uuid,
          ${transaction.type},
          ${transaction.notes || null},
          ${transaction.receiptImage || null}
        )
      `;
    }
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  try {
    await sql`DELETE FROM transactions WHERE id = ${id}::uuid`;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

// ==================== DASHBOARD STATS ====================

export const getDashboardStats = async () => {
  try {
    const result = await sql`
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
    `;

    const stats = result[0];
    const totalIncome = parseFloat(stats.total_income) || 0;
    const totalExpense = parseFloat(stats.total_expense) || 0;
    const monthlySpent = parseFloat(stats.monthly_spent) || 0;

    // Get total monthly budget from categories
    const budgetResult = await sql`
      SELECT COALESCE(SUM(budget_limit), 0) as total_budget
      FROM categories
      WHERE type = 'EXPENSE' AND budget_limit IS NOT NULL
    `;

    const monthlyBudget = parseFloat(budgetResult[0].total_budget) || 0;

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
