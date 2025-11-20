import { Transaction, Category, TransactionType } from '../types';

const TRANSACTIONS_KEY = 'fishek_transactions';
const CATEGORIES_KEY = 'fishek_categories';

// Initial Mock Data
const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Market', icon: 'shopping_cart', type: TransactionType.EXPENSE, budgetLimit: 3000, currentSpent: 1200, color: 'bg-green-100 text-green-700' },
  { id: '2', name: 'Yeme & İçme', icon: 'restaurant', type: TransactionType.EXPENSE, budgetLimit: 2000, currentSpent: 850, color: 'bg-orange-100 text-orange-700' },
  { id: '3', name: 'Ulaşım', icon: 'directions_bus', type: TransactionType.EXPENSE, budgetLimit: 1000, currentSpent: 400, color: 'bg-blue-100 text-blue-700' },
  { id: '4', name: 'Fatura', icon: 'receipt_long', type: TransactionType.EXPENSE, budgetLimit: 1500, currentSpent: 1450, color: 'bg-red-100 text-red-700' },
  { id: '5', name: 'Maaş', icon: 'work', type: TransactionType.INCOME, color: 'bg-primary/20 text-primary-dark' },
  { id: '6', name: 'Diğer', icon: 'sell', type: TransactionType.EXPENSE, budgetLimit: 500, currentSpent: 100 },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', amount: 245.50, description: 'Market Alışverişi', date: new Date().toISOString().split('T')[0], categoryId: '1', type: TransactionType.EXPENSE, createdAt: Date.now() },
  { id: 't2', amount: 12500, description: 'Maaş', date: '2024-07-01', categoryId: '5', type: TransactionType.INCOME, createdAt: Date.now() - 100000 },
  { id: 't3', amount: 450.00, description: 'Akşam Yemeği', date: '2024-07-03', categoryId: '2', type: TransactionType.EXPENSE, createdAt: Date.now() - 50000 },
];

export const getCategories = (): Category[] => {
  const stored = localStorage.getItem(CATEGORIES_KEY);
  if (!stored) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(INITIAL_CATEGORIES));
    return INITIAL_CATEGORIES;
  }
  return JSON.parse(stored);
};

export const addCategory = (category: Category): void => {
  const categories = getCategories();
  categories.push(category);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};

export const getTransactions = (): Transaction[] => {
  const stored = localStorage.getItem(TRANSACTIONS_KEY);
  if (!stored) {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
    return INITIAL_TRANSACTIONS;
  }
  return JSON.parse(stored).sort((a: Transaction, b: Transaction) => b.createdAt - a.createdAt);
};

export const saveTransaction = (transaction: Transaction): void => {
  const transactions = getTransactions();
  const existingIndex = transactions.findIndex(t => t.id === transaction.id);
  
  if (existingIndex >= 0) {
    transactions[existingIndex] = transaction;
  } else {
    transactions.unshift(transaction);
  }
  
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};

export const deleteTransaction = (id: string): void => {
  const transactions = getTransactions().filter(t => t.id !== id);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};
