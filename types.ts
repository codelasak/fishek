export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Category {
  id: string;
  userId?: string;
  name: string;
  icon: string;
  type: TransactionType;
  budgetLimit?: number;
  currentSpent?: number; // Calculated dynamically usually, but kept here for UI simplicity
  color?: string;
}

export interface Transaction {
  id: string;
  userId?: string;
  amount: number;
  description: string; // Merchant or Description
  date: string; // ISO Date string YYYY-MM-DD
  categoryId: string;
  type: TransactionType;
  notes?: string;
  receiptImage?: string; // Base64 data URI
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  monthlyBudget: number;
  monthlySpent: number;
}
