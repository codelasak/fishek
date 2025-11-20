'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { transactionsApi, categoriesApi } from '@/services/apiClient';
import { TransactionType, Transaction, Category } from '@/types';

export default function TransactionDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!params.id) {
        router.push('/');
        return;
      }

      try {
        const [transactionData, categoriesData] = await Promise.all([
          transactionsApi.getById(params.id),
          categoriesApi.getAll()
        ]);

        if (!transactionData) {
          router.push('/');
          return;
        }

        setTransaction(transactionData);
        const cat = categoriesData.find(c => c.id === transactionData.categoryId);
        setCategory(cat || null);
      } catch (error) {
        console.error('Error loading transaction:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.id, router]);

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!transaction) {
    return <div className="p-10 text-center">İşlem bulunamadı.</div>;
  }

  const isIncome = transaction.type === TransactionType.INCOME;

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      <header className="flex items-center justify-between p-4 sticky top-0 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur z-10">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">İşlem Detayı</h1>
        <button onClick={handleDelete} className="p-2 -mr-2 rounded-full text-red-500 hover:bg-red-500/10">
          <span className="material-symbols-outlined">delete</span>
        </button>
      </header>

      <div className="flex-1 p-4 overflow-y-auto pb-24">
        <div className="text-center py-8">
             <h2 className={`text-4xl font-bold tracking-tight ${isIncome ? 'text-primary' : 'text-red-500'}`}>
                {isIncome ? '+' : '-'}₺{transaction.amount.toFixed(2)}
             </h2>
             <p className="text-gray-500 mt-2">{new Date(transaction.date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="space-y-4">
             <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Mağaza/Açıklama</span>
                    <span className="font-medium">{transaction.description}</span>
                </div>
                <div className="h-px bg-gray-100 dark:bg-white/5"></div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Kategori</span>
                    <div className="flex items-center gap-2">
                         <span className="material-symbols-outlined text-lg">{category?.icon}</span>
                         <span className="font-medium">{category?.name}</span>
                    </div>
                </div>
             </div>

             {transaction.receiptImage && (
                 <div className="mt-6">
                    <p className="text-sm font-bold mb-3 text-gray-600 dark:text-gray-400">Fiş Görüntüsü</p>
                    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                        <img src={transaction.receiptImage} alt="Receipt" className="w-full h-auto" />
                    </div>
                 </div>
             )}
        </div>
      </div>

      <div className="p-4 bg-background-light dark:bg-background-dark border-t border-gray-200 dark:border-gray-800">
           <button onClick={() => router.back()} className="w-full h-14 bg-primary text-[#102216] rounded-xl font-bold text-lg">
               Tamam
           </button>
      </div>
    </div>
  );
}
