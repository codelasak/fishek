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

  const formattedAmount = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(transaction.amount);

  return (
    <div
      onClick={() => router.push(`/transaction/${transaction.id}`)}
      className="flex items-center gap-4 rounded-2xl p-3 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isIncome ? 'bg-primary/20 text-primary-700' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'}`}>
        <span className="material-symbols-outlined">{category.icon}</span>
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white truncate">{transaction.description}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{new Date(transaction.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</p>
      </div>
      <p className={`text-base font-bold whitespace-nowrap ${isIncome ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
        {isIncome ? '+' : '-'}{formattedAmount}
      </p>
    </div>
  );
};

export default TransactionCard;
