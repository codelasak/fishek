'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { transactionsApi, categoriesApi, statsApi } from '../services/apiClient';
import { Transaction, Category, TransactionType } from '../types';
import TransactionCard from '../components/TransactionCard';
import BottomNav from '../components/BottomNav';
import { useFamily } from '@/lib/FamilyContext';
import { FamilyModeToggle } from '@/components/FamilyModeToggle';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const { mode, activeFamily } = useFamily();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0, monthlyBudget: 0, monthlySpent: 0 });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'month' | 'week' | 'all'>('month');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [language, setLanguage] = useState<'TR' | 'EN'>('TR');
  const [currency, setCurrency] = useState<'TRY' | 'USD'>('TRY');

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        if (mode === 'family' && activeFamily) {
          // Load family data
          const [transactionsRes, categoriesRes] = await Promise.all([
            fetch(`/api/family-transactions?familyId=${activeFamily.id}`),
            fetch(`/api/family-categories?familyId=${activeFamily.id}`)
          ]);

          const transactionsData = await transactionsRes.json();
          const categoriesData = await categoriesRes.json();

          setTransactions(transactionsData.transactions || []);
          setCategories(categoriesData.categories || []);

          // Calculate family stats
          const income = transactionsData.transactions
            ?.filter((t: any) => t.type === 'INCOME')
            .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0) || 0;
          const expense = transactionsData.transactions
            ?.filter((t: any) => t.type === 'EXPENSE')
            .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0) || 0;

          setStats({
            income,
            expense,
            balance: income - expense,
            monthlyBudget: 0, // TODO: Calculate from family categories budgets
            monthlySpent: expense
          });
        } else {
          // Load personal data (existing logic)
          const [transactionsData, categoriesData, dashboardStats] = await Promise.all([
            transactionsApi.getAll(),
            categoriesApi.getAll(),
            statsApi.getDashboard()
          ]);
          setTransactions(transactionsData);
          setCategories(categoriesData);
          setStats({
            income: dashboardStats.totalIncome,
            expense: dashboardStats.totalExpense,
            balance: dashboardStats.balance,
            monthlyBudget: dashboardStats.monthlyBudget,
            monthlySpent: dashboardStats.monthlySpent
          });
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [status, mode, activeFamily]);

  const formatCurrency = (amount: number) => {
    const currencyCode = currency === 'TRY' ? 'TRY' : 'USD';
    const locale = language === 'TR' ? 'tr-TR' : 'en-US';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const budgetPercentage = stats.monthlyBudget > 0 ? (stats.monthlySpent / stats.monthlyBudget) * 100 : 0;
  const budgetRemaining = stats.monthlyBudget - stats.monthlySpent;

  const filteredTransactions = React.useMemo(() => {
    const now = new Date();

    const isSameMonth = (date: Date) =>
      date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();

    const isSameWeek = (date: Date) => {
      const current = new Date(now);
      const target = new Date(date);
      current.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);
      const dayOfWeek = current.getDay() || 7; // Sunday=0 -> 7
      const startOfWeek = new Date(current);
      startOfWeek.setDate(current.getDate() - (dayOfWeek - 1));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return target >= startOfWeek && target <= endOfWeek;
    };

    return transactions.filter((tx) => {
      if (activeFilter === 'all') return true;
      const date = new Date(`${tx.date}T00:00:00`);
      if (activeFilter === 'month') return isSameMonth(date);
      return isSameWeek(date);
    });
  }, [transactions, activeFilter]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <>
      <div className="pb-nav-safe pt-safe">
        {/* Header */}
        <div className="flex items-center p-4 gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <span className="material-symbols-outlined text-3xl text-primary">receipt_long</span>
          </div>
          <h2 className="text-lg font-bold flex-1 ml-1">Fishek</h2>
          <FamilyModeToggle />
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu((p) => !p)}
              className="flex items-center justify-center overflow-hidden rounded-full h-10 w-10 bg-gray-200 dark:bg-gray-800 border border-gray-300/60 dark:border-gray-700"
            >
              <span className="material-symbols-outlined text-2xl text-gray-600 dark:text-gray-300">account_circle</span>
            </button>
            {showProfileMenu && (
              <>
                <button
                  aria-label="Kapat"
                  className="fixed inset-0 z-30 bg-black/30"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-surface-dark shadow-2xl border border-gray-100 dark:border-gray-800 p-4 z-40">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold">Profil</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Hızlı ayarlar</p>
                    </div>
                    <button
                      onClick={() => setShowProfileMenu(false)}
                      className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-gray-500">close</span>
                    </button>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Dil</p>
                    <div className="flex gap-2">
                      {(['TR', 'EN'] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setLanguage(lang)}
                          className={`flex-1 h-10 rounded-xl text-xs font-semibold border transition ${
                            language === lang
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Para Birimi</p>
                    <div className="flex gap-2">
                      {(['TRY', 'USD'] as const).map((cur) => (
                        <button
                          key={cur}
                          onClick={() => setCurrency(cur)}
                          className={`flex-1 h-10 rounded-xl text-xs font-semibold border transition ${
                            currency === cur
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {cur === 'TRY' ? '₺ Türk Lirası' : '$ Dolar'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full h-11 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold flex items-center gap-2 justify-center hover:opacity-90 transition"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    Çıkış Yap
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Greeting */}
        <div className="px-4 pt-2 pb-6">
          <h1 className="text-3xl font-bold">
            Merhaba{session?.user?.name ? `, ${session.user.name}` : ''}!
          </h1>
          {mode === 'family' && activeFamily && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-base">groups</span>
              {activeFamily.name} - Aile Modu
            </p>
          )}
        </div>

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
            <p className="text-sm font-medium opacity-70">
              {formatCurrency(stats.monthlySpent)} / {formatCurrency(stats.monthlyBudget)}
            </p>
          </div>
          <div className="w-full rounded-full bg-gray-200 dark:bg-gray-800 h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm opacity-60 text-right">
            Kalan: {formatCurrency(Math.max(budgetRemaining, 0))}
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar mb-6">
          <button
            onClick={() => setActiveFilter('month')}
            className={`flex h-9 shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold transition ${
              activeFilter === 'month'
                ? 'bg-primary text-[#102216]'
                : 'bg-gray-200 dark:bg-surface-dark text-gray-700 dark:text-gray-200'
            }`}
          >
            Bu Ay
          </button>
          <button
            onClick={() => setActiveFilter('week')}
            className={`flex h-9 shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold transition ${
              activeFilter === 'week'
                ? 'bg-primary text-[#102216]'
                : 'bg-gray-200 dark:bg-surface-dark text-gray-700 dark:text-gray-200'
            }`}
          >
            Bu Hafta
          </button>
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex h-9 shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold transition ${
              activeFilter === 'all'
                ? 'bg-primary text-[#102216]'
                : 'bg-gray-200 dark:bg-surface-dark text-gray-700 dark:text-gray-200'
            }`}
          >
            Tümü
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="flex flex-col gap-2 px-4">
          <h3 className="text-xl font-bold mb-2">Son Hareketler</h3>
          <div className="flex flex-col gap-1">
            {filteredTransactions.map(transaction => {
              const category = categories.find(c => c.id === transaction.categoryId) || categories[0];
              return <TransactionCard key={transaction.id} transaction={transaction} category={category} />;
            })}
            {filteredTransactions.length === 0 && (
              <div className="text-center py-10 opacity-50">
                  Bu filtrede gösterilecek işlem yok.
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
