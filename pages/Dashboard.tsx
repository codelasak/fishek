import React, { useMemo } from 'react';
import { getTransactions, getCategories } from '../services/storageService';
import { TransactionType } from '../types';
import TransactionCard from '../components/TransactionCard';

const Dashboard: React.FC = () => {
  const transactions = getTransactions();
  const categories = getCategories();

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, curr) => acc + curr.amount, 0);
    const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, curr) => acc + curr.amount, 0);
    return {
      income,
      expense,
      balance: income - expense
    };
  }, [transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="pb-24 pt-safe">
      {/* Header */}
      <div className="flex items-center p-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <span className="material-symbols-outlined text-3xl text-primary">receipt_long</span>
        </div>
        <h2 className="text-lg font-bold flex-1 ml-3">Fishek</h2>
        <div className="flex items-center justify-end">
          <button className="flex items-center justify-center overflow-hidden rounded-full h-10 w-10 bg-gray-200 dark:bg-gray-800">
            <span className="material-symbols-outlined text-2xl text-gray-600 dark:text-gray-300">account_circle</span>
          </button>
        </div>
      </div>

      {/* Greeting */}
      <h1 className="text-3xl font-bold px-4 pt-2 pb-6">Merhaba, Ali!</h1>

      {/* Stats Cards */}
      <div className="flex gap-4 px-4 overflow-x-auto no-scrollbar pb-2">
        <div className="min-w-[160px] flex-1 flex flex-col gap-1 rounded-2xl bg-white dark:bg-surface-dark p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Gelir</p>
          <p className="text-xl font-bold text-primary">{formatCurrency(stats.income)}</p>
        </div>
        <div className="min-w-[160px] flex-1 flex flex-col gap-1 rounded-2xl bg-white dark:bg-surface-dark p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Gider</p>
          <p className="text-xl font-bold text-red-500">{formatCurrency(stats.expense)}</p>
        </div>
      </div>
      
      <div className="px-4 mt-4">
        <div className="w-full rounded-2xl bg-primary p-5 text-[#102216] shadow-lg shadow-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 backdrop-blur-3xl"></div>
            <p className="text-sm font-medium opacity-80 mb-1 relative z-10">Mevcut Bakiye</p>
            <p className="text-4xl font-bold tracking-tight relative z-10">{formatCurrency(stats.balance)}</p>
        </div>
      </div>

      {/* Budget Progress */}
      <div className="flex flex-col gap-3 p-4 mt-2">
        <div className="flex gap-6 justify-between items-end">
          <p className="text-base font-bold">Aylık Bütçe</p>
          <p className="text-sm font-medium opacity-70">₺1.950 / ₺3.000</p>
        </div>
        <div className="w-full rounded-full bg-gray-200 dark:bg-gray-800 h-3">
          <div className="bg-primary h-3 rounded-full transition-all duration-500" style={{ width: '65%' }}></div>
        </div>
        <p className="text-sm opacity-60 text-right">Kalan: ₺1.050</p>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar mb-6">
        <button className="flex h-9 shrink-0 items-center justify-center rounded-full bg-primary px-5 text-[#102216] font-bold text-sm">
          Bu Ay
        </button>
        <button className="flex h-9 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-surface-dark px-5 text-sm font-medium">
          Bu Hafta
        </button>
        <button className="flex h-9 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-surface-dark px-5 text-sm font-medium">
          Tümü
        </button>
      </div>

      {/* Recent Transactions */}
      <div className="flex flex-col gap-2 px-4">
        <h3 className="text-xl font-bold mb-2">Son Hareketler</h3>
        <div className="flex flex-col gap-1">
          {transactions.map(transaction => {
            const category = categories.find(c => c.id === transaction.categoryId) || categories[0];
            return <TransactionCard key={transaction.id} transaction={transaction} category={category} />;
          })}
          {transactions.length === 0 && (
            <div className="text-center py-10 opacity-50">
                Henüz işlem yok.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
