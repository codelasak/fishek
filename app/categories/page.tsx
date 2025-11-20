'use client';

import React, { useState, useEffect } from 'react';
import { categoriesApi } from '@/services/apiClient';
import { TransactionType, Category } from '@/types';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<TransactionType>(TransactionType.EXPENSE);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newIcon, setNewIcon] = useState('category');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loadCategories = async () => {
    try {
      const categoriesData = await categoriesApi.getAll();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = categories.filter(c => c.type === activeTab);

  const iconOptions = activeTab === TransactionType.EXPENSE
    ? ['shopping_cart', 'restaurant', 'directions_bus', 'receipt_long', 'sell', 'payments']
    : ['work', 'payments', 'attach_money', 'savings'];

  const handleAddCategory = async () => {
    if (!newName.trim()) {
      setError('Kategori adı zorunlu');
      return;
    }

    setSaving(true);
    setError(null);

    const budgetNum = newBudget ? parseFloat(newBudget) : undefined;

    try {
      await categoriesApi.create({
        name: newName.trim(),
        icon: newIcon,
        type: activeTab,
        budgetLimit: budgetNum,
        color: undefined,
      });

      setNewName('');
      setNewBudget('');
      setNewIcon(iconOptions[0] || 'category');
      setShowForm(false);
      await loadCategories();
    } catch (err) {
      console.error('Error adding category:', err);
      setError('Kategori eklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
          <header className="sticky top-0 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur z-10">
              <div className="flex items-center p-4 justify-between">
                  <button onClick={() => router.push('/')} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                       <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <h1 className="text-lg font-bold">Kategorileri Yönet</h1>
                  <div className="w-10"></div>
              </div>

              <div className="flex border-b border-gray-200 dark:border-white/10">
                  <button
                      onClick={() => setActiveTab(TransactionType.EXPENSE)}
                      className={`flex-1 pb-3 font-bold text-sm transition-colors relative ${activeTab === TransactionType.EXPENSE ? 'text-primary' : 'text-gray-500'}`}
                  >
                      Giderler
                      {activeTab === TransactionType.EXPENSE && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full"></div>}
                  </button>
                  <button
                      onClick={() => setActiveTab(TransactionType.INCOME)}
                      className={`flex-1 pb-3 font-bold text-sm transition-colors relative ${activeTab === TransactionType.INCOME ? 'text-primary' : 'text-gray-500'}`}
                  >
                      Gelirler
                      {activeTab === TransactionType.INCOME && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full"></div>}
                  </button>
              </div>
          </header>

          <div className="p-4 space-y-4">
              {/* Search */}
              <div className="bg-gray-100 dark:bg-surface-dark rounded-xl flex items-center h-12 px-4 gap-2">
                  <span className="material-symbols-outlined text-gray-500">search</span>
                  <input type="text" placeholder="Kategorilerde ara..." className="bg-transparent flex-1 outline-none text-sm" />
              </div>

              {/* List */}
              <div className="space-y-3">
                  {filteredCategories.map(category => (
                      <div key={category.id} className="flex items-center gap-4 p-4 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-50 dark:border-white/5">
                          <div className={`size-12 rounded-xl flex items-center justify-center ${category.type === TransactionType.EXPENSE ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                              <span className="material-symbols-outlined">{category.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                              <div className="flex justify-between mb-1">
                                  <h3 className="font-bold truncate">{category.name}</h3>
                                  {category.budgetLimit ? (
                                      <span className="text-xs font-medium text-gray-500">
                                          ₺{category.currentSpent} / ₺{category.budgetLimit}
                                      </span>
                                  ) : null}
                              </div>
                              {category.budgetLimit ? (
                                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                      <div
                                          className={`h-full rounded-full ${category.currentSpent && category.currentSpent > category.budgetLimit ? 'bg-red-500' : 'bg-primary'}`}
                                          style={{ width: `${Math.min(100, ((category.currentSpent || 0) / category.budgetLimit) * 100)}%` }}
                                      ></div>
                                  </div>
                              ) : null}
                          </div>
                          <button className="text-gray-400">
                              <span className="material-symbols-outlined">more_vert</span>
                          </button>
                      </div>
                  ))}
              </div>
          </div>

          <div className="fixed bottom-24 right-6">
               <button
                  onClick={() => setShowForm(true)}
                  className="h-14 w-14 bg-primary text-[#102216] rounded-full shadow-lg shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform"
               >
                  <span className="material-symbols-outlined text-3xl">add</span>
               </button>
          </div>

          {/* Add Category Sheet */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
              <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-t-3xl p-5 shadow-2xl animate-[slideUp_0.25s_ease-out]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Yeni Kategori</h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setError(null);
                    }}
                    className="text-gray-400"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="text-sm text-gray-600 dark:text-gray-300">Tip: {activeTab === TransactionType.EXPENSE ? 'Gider' : 'Gelir'}</div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Kategori Adı</label>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Örn: Market, Maaş..."
                      className="w-full h-12 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Bütçe Limiti (opsiyonel)</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      placeholder="Örn: 2000"
                      className="w-full h-12 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Simge</label>
                    <div className="flex flex-wrap gap-2">
                      {iconOptions.map((icon) => (
                        <button
                          key={icon}
                          onClick={() => setNewIcon(icon)}
                          className={`flex items-center justify-center h-11 w-11 rounded-xl border transition ${
                            newIcon === icon
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          <span className="material-symbols-outlined">{icon}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-3">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleAddCategory}
                    disabled={saving}
                    className="w-full h-12 bg-primary text-[#102216] rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition disabled:opacity-70"
                  >
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
      <BottomNav />
    </>
  );
}
