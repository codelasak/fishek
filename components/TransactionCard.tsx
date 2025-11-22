'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Transaction, Category, TransactionType } from '../types';

interface TransactionCardProps {
  transaction: Transaction;
  category: Category;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, category }) => {
  const router = useRouter();
  const isIncome = transaction.type === TransactionType.INCOME;
  const iconName = category.icon === 'savings' ? 'account_balance_wallet' : category.icon;

  const handleClick = () => {
    // Cache transaction details for detail page fallback (helps if API 404s)
    try {
      sessionStorage.setItem(
        `tx:${transaction.id}`,
        JSON.stringify({
          transaction: { ...transaction, amount: Number(transaction.amount) },
          category: { ...category, icon: iconName },
        })
      );
    } catch (error) {
      console.warn('Failed to cache transaction', error);
    }

    router.push(`/transaction/${transaction.id}`);
  };

  const formattedAmount = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(transaction.amount);

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-4 rounded-2xl p-4 bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer transition-all active:scale-[0.98]"
    >
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${isIncome ? 'bg-gradient-to-br from-primary to-primary/80 text-white' : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-200'}`}>
        <span className="material-symbols-outlined text-2xl">{iconName}</span>
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <p className="font-bold text-gray-900 dark:text-white truncate text-base">{transaction.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(transaction.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{category.name}</span>
        </div>
      </div>
      <p className={`text-lg font-bold whitespace-nowrap ${isIncome ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
        {isIncome ? '+' : '-'}{formattedAmount}
      </p>
    </div>
  );
};

export default TransactionCard;
