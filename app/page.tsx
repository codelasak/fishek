'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { transactionsApi, categoriesApi, statsApi } from '../services/apiClient';
import { Transaction, Category, TransactionType } from '../types';
import TransactionCard from '../components/TransactionCard';
import BottomNav from '../components/BottomNav';
import { useFamily } from '@/lib/FamilyContext';
import { FamilyModeToggle } from '@/components/FamilyModeToggle';
import Onboarding from '@/components/Onboarding';
import { onboardingStorage } from '@/lib/onboardingStorage';
import { useMobileAuth } from '@/lib/MobileAuthContext';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated, isMobile, logout: mobileLogout } = useMobileAuth();
  const status = authLoading ? 'loading' : isAuthenticated ? 'authenticated' : 'unauthenticated';
  const { mode, activeFamily } = useFamily();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0, monthlyBudget: 0, monthlySpent: 0 });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'month' | 'week' | 'all'>('month');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [language, setLanguage] = useState<'TR' | 'EN'>('TR');
  const [currency, setCurrency] = useState<'TRY' | 'USD'>('TRY');
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Check onboarding status
  useEffect(() => {
    if (status === 'authenticated' && !onboardingStorage.isCompleted()) {
      setShowOnboarding(true);
    }
  }, [status]);

  const handleOnboardingComplete = () => {
    onboardingStorage.setCompleted();
    setShowOnboarding(false);
  };

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
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background-light to-background-light dark:from-primary/5 dark:via-background-dark dark:to-background-dark pb-nav-safe">
        {/* Header Skeleton */}
        <div className="flex items-center p-4 gap-3 bg-white/60 dark:bg-surface-dark/60 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse"></div>
          <div className="flex-1 h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-xl animate-pulse" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
          <div className="w-20 h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-xl animate-pulse" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
        </div>

        <div className="p-4 space-y-4">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
                  <div className="flex-1 h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
                </div>
                <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg w-3/4" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
              </div>
            ))}
          </div>

          {/* Balance Card Skeleton */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-xl rounded-3xl p-6 border border-primary/20 shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-32 mb-3" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
              <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-xl w-48 mb-2" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
            </div>
          </div>

          {/* Budget Card Skeleton */}
          <div className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
              <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-24" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full mb-2"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-32" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
          </div>

          {/* Filter Chips Skeleton */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-2xl shrink-0" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
            ))}
          </div>

          {/* Transaction Cards Skeleton */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-surface-dark rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-3/4" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-1/2" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
                  </div>
                  <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-20" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pb-nav-safe pt-safe bg-gradient-to-b from-primary/5 via-background-light to-background-light dark:from-primary/5 dark:via-background-dark dark:to-background-dark min-h-screen">
        {/* Header */}
        <div className="flex items-center p-4 gap-3 bg-white/60 dark:bg-surface-dark/60 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-50">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
            <span className="material-symbols-outlined text-3xl text-white">receipt_long</span>
          </div>
          <h2 className="text-lg font-bold flex-1 ml-1 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Fishek</h2>
          <FamilyModeToggle />
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu((p) => !p)}
              className="flex items-center justify-center overflow-hidden rounded-2xl h-11 w-11 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 border border-gray-300/60 dark:border-gray-600 shadow-sm active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-2xl text-gray-600 dark:text-gray-300">account_circle</span>
            </button>
            {showProfileMenu && (
              <>
                <button
                  aria-label="Kapat"
                  className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-72 rounded-3xl bg-white/95 dark:bg-surface-dark/95 backdrop-blur-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 z-[70] animate-scaleIn">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-base font-bold">Profil</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Hızlı ayarlar</p>
                    </div>
                    <button
                      onClick={() => setShowProfileMenu(false)}
                      className="h-9 w-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors active:scale-95"
                    >
                      <span className="material-symbols-outlined text-gray-500">close</span>
                    </button>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Dil</p>
                    <div className="flex gap-2">
                      {(['TR', 'EN'] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setLanguage(lang)}
                          className={`flex-1 h-11 rounded-xl text-sm font-semibold border-2 transition-all ${
                            language === lang
                              ? 'border-primary bg-primary/10 text-primary shadow-sm'
                              : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Para Birimi</p>
                    <div className="flex gap-2">
                      {(['TRY', 'USD'] as const).map((cur) => (
                        <button
                          key={cur}
                          onClick={() => setCurrency(cur)}
                          className={`flex-1 h-11 rounded-xl text-xs font-semibold border-2 transition-all ${
                            currency === cur
                              ? 'border-primary bg-primary/10 text-primary shadow-sm'
                              : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          {cur === 'TRY' ? '₺ Türk Lirası' : '$ Dolar'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      if (isMobile) {
                        await mobileLogout();
                        window.location.href = '/login';
                      } else {
                        signOut({ callbackUrl: '/login' });
                      }
                    }}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 text-white dark:from-white dark:to-gray-100 dark:text-gray-900 font-semibold flex items-center gap-2 justify-center hover:opacity-90 transition shadow-lg active:scale-95"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    Çıkış Yap
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Greeting */}
        <div className="px-4 pt-6 pb-5">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            Merhaba{user?.name ? `, ${user.name}` : ''}!
          </h1>
          {mode === 'family' && activeFamily && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-lg">groups</span>
              {activeFamily.name} - Aile Modu
            </p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-2">
          <div className="min-w-[170px] flex-1 flex flex-col gap-2 rounded-2xl bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl p-5 shadow-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-lg">trending_up</span>
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Toplam Gelir</p>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(stats.income)}</p>
          </div>
          <div className="min-w-[170px] flex-1 flex flex-col gap-2 rounded-2xl bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl p-5 shadow-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-lg">trending_down</span>
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Toplam Gider</p>
            </div>
            <p className="text-2xl font-bold text-red-500">{formatCurrency(stats.expense)}</p>
          </div>
        </div>

        <div className="px-4 mt-4">
          <div className="w-full rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/90 p-6 text-white shadow-xl shadow-primary/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-16 backdrop-blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-12 -mb-12 backdrop-blur-3xl"></div>
              <div className="flex items-center gap-2 mb-2 relative z-10">
                <span className="material-symbols-outlined text-2xl opacity-90">account_balance_wallet</span>
                <p className="text-sm font-semibold opacity-90">Mevcut Bakiye</p>
              </div>
              <p className="text-5xl font-bold tracking-tight relative z-10">{formatCurrency(stats.balance)}</p>
          </div>
        </div>

        {/* Budget Progress */}
        <div className="flex flex-col gap-3 px-4 py-5 mt-3 mx-4 rounded-2xl bg-white/60 dark:bg-surface-dark/60 backdrop-blur-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex gap-6 justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-lg">account_balance_wallet</span>
              </div>
              <p className="text-base font-bold">Aylık Bütçe</p>
            </div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              {formatCurrency(stats.monthlySpent)} / {formatCurrency(stats.monthlyBudget)}
            </p>
          </div>
          <div className="w-full rounded-full bg-gray-200 dark:bg-gray-800 h-3 shadow-inner">
            <div
              className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 text-right">
            Kalan: <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(Math.max(budgetRemaining, 0))}</span>
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar mb-5 mt-6">
          <button
            onClick={() => setActiveFilter('month')}
            className={`flex h-10 shrink-0 items-center justify-center rounded-full px-6 text-sm font-bold transition-all ${
              activeFilter === 'month'
                ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/30'
                : 'bg-white dark:bg-surface-dark text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            Bu Ay
          </button>
          <button
            onClick={() => setActiveFilter('week')}
            className={`flex h-10 shrink-0 items-center justify-center rounded-full px-6 text-sm font-bold transition-all ${
              activeFilter === 'week'
                ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/30'
                : 'bg-white dark:bg-surface-dark text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            Bu Hafta
          </button>
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex h-10 shrink-0 items-center justify-center rounded-full px-6 text-sm font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/30'
                : 'bg-white dark:bg-surface-dark text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            Tümü
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="flex flex-col gap-3 px-4 pb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Son Hareketler</h3>
            <button className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              Tümünü Gör
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {filteredTransactions.map(transaction => {
              const category = categories.find(c => c.id === transaction.categoryId) || categories[0];
              return <TransactionCard key={transaction.id} transaction={transaction} category={category} />;
            })}
            {filteredTransactions.length === 0 && (
              <div className="text-center py-16 px-6">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-4xl text-gray-400">receipt_long</span>
                </div>
                <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">İşlem bulunamadı</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Bu filtrede gösterilecek işlem yok.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      
      <BottomNav />
    </>
  );
}
