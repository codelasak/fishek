'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { transactionsApi, categoriesApi } from '@/services/apiClient';
import { TransactionType, Transaction, Category } from '@/types';

export default function TransactionDetail() {
  const router = useRouter();
  const params = useParams();
  const transactionId = useMemo(() => {
    const id = params?.id;
    return Array.isArray(id) ? id[0] : id;
  }, [params]);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizeTransaction = (t: Transaction): Transaction => ({
    ...t,
    amount: typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount),
  });

  const loadFromCache = () => {
    if (!transactionId || typeof window === 'undefined') return false;
    try {
      const cached = sessionStorage.getItem(`tx:${transactionId}`);
      if (!cached) return false;
      const parsed = JSON.parse(cached) as { transaction: Transaction; category: Category };
      setTransaction(normalizeTransaction(parsed.transaction));
      setCategory(parsed.category);
      return true;
    } catch (error) {
      console.warn('[TransactionDetail] Failed to read cache', error);
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!transactionId) {
        router.push('/');
        return;
      }

      const hadCache = loadFromCache();
      if (hadCache) setLoading(false);

      try {
        const [transactionData, categoriesData] = await Promise.all([
          transactionsApi.getById(transactionId),
          categoriesApi.getAll()
        ]);

        if (!transactionData) {
          console.warn('[TransactionDetail] Transaction not found, using cache if available');
          if (!loadFromCache()) {
            router.push('/');
          }
          return;
        }

        setTransaction(normalizeTransaction(transactionData));
        const cat = categoriesData.find(c => c.id === transactionData.categoryId);
        setCategory(cat || null);
      } catch (error) {
        console.error('Error loading transaction:', error);
        if (!loadFromCache()) {
          router.push('/');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [transactionId, router]);

  const handleDelete = async () => {
    if (!transaction) return;

    if (confirm('Bu işlemi silmek istediğinize emin misiniz?')) {
      try {
        await transactionsApi.delete(transaction.id);
        router.push('/');
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('İşlem silinemedi. Lütfen tekrar deneyin.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 via-background-light to-background-light dark:from-primary/5 dark:via-background-dark dark:to-background-dark">
        {/* Header Skeleton */}
        <header className="flex items-center justify-between p-4 sticky top-0 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl z-10 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
          <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-xl w-32" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
        </header>

        <main className="flex-1 p-5 space-y-5">
          {/* Icon Badge Skeleton */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
          </div>

          {/* Amount Skeleton */}
          <div className="text-center space-y-2">
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-24 mx-auto" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
            <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-xl w-48 mx-auto" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
          </div>

          {/* Info Card Skeleton */}
          <div className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-lg space-y-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-24" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
                <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-32" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 via-background-light to-background-light dark:from-primary/5 dark:via-background-dark dark:to-background-dark p-10">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl text-gray-400">receipt_long</span>
          </div>
          <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">İşlem bulunamadı</p>
          <p className="text-sm text-gray-500">Bu işlem silinmiş olabilir.</p>
        </div>
      </div>
    );
  }

  const isIncome = transaction.type === TransactionType.INCOME;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 via-background-light to-background-light dark:from-primary/5 dark:via-background-dark dark:to-background-dark">
      <header className="flex items-center justify-between p-4 sticky top-0 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl z-10 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">İşlem Detayı</h1>
        <button onClick={handleDelete} className="p-2 -mr-2 rounded-full text-red-500 hover:bg-red-500/10 active:scale-95 transition-all">
          <span className="material-symbols-outlined">delete</span>
        </button>
      </header>

      <div className="flex-1 p-4 overflow-y-auto pb-nav-safe">
        <div className="text-center py-10">
             <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 shadow-xl ${isIncome ? 'bg-gradient-to-br from-primary to-primary/80 text-white shadow-primary/30' : 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-500/30'}`}>
                <span className="material-symbols-outlined text-4xl">{isIncome ? 'trending_up' : 'trending_down'}</span>
             </div>
             <h2 className={`text-5xl font-bold tracking-tight mb-3 ${isIncome ? 'text-primary' : 'text-red-500'}`}>
                {isIncome ? '+' : '-'}₺{Number(transaction.amount || 0).toFixed(2)}
             </h2>
             <p className="text-base font-medium text-gray-500 dark:text-gray-400">
                {new Date(transaction.date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </p>
        </div>

        <div className="space-y-4">
             <div className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl p-5 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4 shadow-lg">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Mağaza/Açıklama</span>
                    <span className="font-bold text-gray-900 dark:text-white">{transaction.description}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Kategori</span>
                    <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${isIncome ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>
                            <span className="material-symbols-outlined text-xl">{category?.icon === 'savings' ? 'account_balance_wallet' : category?.icon}</span>
                         </div>
                         <span className="font-bold text-gray-900 dark:text-white">{category?.name}</span>
                    </div>
                </div>
             </div>

             {transaction.receiptImage && (
                 <div className="mt-6">
                    <p className="text-sm font-bold mb-3 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">image</span>
                        Fiş Görüntüsü
                    </p>
                    <div className="rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-800 shadow-xl">
                        <img src={transaction.receiptImage} alt="Receipt" className="w-full h-auto" />
                    </div>
                 </div>
             )}
        </div>
      </div>

      <div className="p-4 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800">
           <button onClick={() => router.back()} className="w-full h-14 bg-gradient-to-r from-primary to-primary/90 text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
               <span>Tamam</span>
               <span className="material-symbols-outlined text-2xl">check_circle</span>
           </button>
      </div>
    </div>
  );
}
