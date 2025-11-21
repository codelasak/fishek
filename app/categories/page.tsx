'use client';

import React, { useState, useEffect } from 'react';
import { categoriesApi } from '@/services/apiClient';
import { TransactionType, Category } from '@/types';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import ConfirmDialog from '@/components/ConfirmDialog';
import SwipeableCard from '@/components/SwipeableCard';
import EmptyState from '@/components/EmptyState';
import Toast from '@/components/Toast';

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
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; category: Category | null }>({
    open: false,
    category: null,
  });
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newColor, setNewColor] = useState<string | undefined>(undefined);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({
    open: false,
    message: '',
    type: 'success',
  });
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

  const filteredCategories = categories
    .filter(c => c.type === activeTab)
    .filter(c =>
      searchQuery.trim() === '' ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getBudgetWarningLevel = (category: Category): 'none' | 'warning' | 'danger' => {
    if (!category.budgetLimit || !category.currentSpent) return 'none';
    const percentage = (category.currentSpent / category.budgetLimit) * 100;
    if (percentage >= 100) return 'danger';
    if (percentage >= 80) return 'warning';
    return 'none';
  };

  const iconOptions = activeTab === TransactionType.EXPENSE
    ? ['shopping_cart', 'restaurant', 'directions_bus', 'receipt_long', 'sell', 'payments']
    : ['work', 'payments', 'attach_money', 'savings'];

  const colorOptions = [
    { name: 'Yeşil', bg: 'bg-green-100', text: 'text-green-700', value: 'bg-green-100 text-green-700' },
    { name: 'Turuncu', bg: 'bg-orange-100', text: 'text-orange-700', value: 'bg-orange-100 text-orange-700' },
    { name: 'Mavi', bg: 'bg-blue-100', text: 'text-blue-700', value: 'bg-blue-100 text-blue-700' },
    { name: 'Kırmızı', bg: 'bg-red-100', text: 'text-red-700', value: 'bg-red-100 text-red-700' },
    { name: 'Mor', bg: 'bg-purple-100', text: 'text-purple-700', value: 'bg-purple-100 text-purple-700' },
    { name: 'Pembe', bg: 'bg-pink-100', text: 'text-pink-700', value: 'bg-pink-100 text-pink-700' },
  ];

  const handleSaveCategory = async () => {
    if (!newName.trim()) {
      setError('Kategori adı zorunlu');
      return;
    }

    setSaving(true);
    setError(null);

    const budgetNum = newBudget ? parseFloat(newBudget) : undefined;

    try {
      if (editingCategory) {
        // Optimistic update for edit
        const updatedCategory = {
          ...editingCategory,
          name: newName.trim(),
          icon: newIcon,
          budgetLimit: budgetNum,
          color: newColor,
        };

        setCategories(prev =>
          prev.map(c => c.id === editingCategory.id ? updatedCategory : c)
        );

        await categoriesApi.update(updatedCategory);
        setToast({ open: true, message: 'Kategori güncellendi', type: 'success' });
      } else {
        // Create new category
        await categoriesApi.create({
          name: newName.trim(),
          icon: newIcon,
          type: activeTab,
          budgetLimit: budgetNum,
          color: newColor,
        });
        setToast({ open: true, message: 'Kategori oluşturuldu', type: 'success' });
      }

      setNewName('');
      setNewBudget('');
      setNewIcon(iconOptions[0] || 'category');
      setNewColor(undefined);
      setShowForm(false);
      setEditingCategory(null);
      await loadCategories(); // Refresh to get accurate data
    } catch (err) {
      console.error('Error saving category:', err);
      setToast({
        open: true,
        message: editingCategory ? 'Kategori güncellenemedi' : 'Kategori eklenemedi',
        type: 'error'
      });
      // Revert optimistic update on error
      if (editingCategory) {
        await loadCategories();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewName(category.name);
    setNewBudget(category.budgetLimit?.toString() || '');
    setNewIcon(category.icon);
    setNewColor(category.color);
    setActiveTab(category.type);
    setShowForm(true);
  };

  const handleDeleteCategory = async () => {
    if (!deleteConfirm.category) return;

    setDeleting(true);
    try {
      await categoriesApi.delete(deleteConfirm.category.id);
      await loadCategories();
      setDeleteConfirm({ open: false, category: null });
      setToast({ open: true, message: 'Kategori silindi', type: 'success' });
    } catch (err) {
      console.error('Error deleting category:', err);
      setToast({ open: true, message: 'Kategori silinemedi', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleQuickAdd = async (name: string, icon: string) => {
    try {
      await categoriesApi.create({
        name,
        icon,
        type: activeTab,
        budgetLimit: undefined,
        color: undefined,
      });
      await loadCategories();
      setToast({ open: true, message: `${name} kategorisi eklendi`, type: 'success' });
    } catch (err) {
      console.error('Error quick-adding category:', err);
      setToast({ open: true, message: 'Kategori eklenemedi', type: 'error' });
    }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    const count = selectedIds.size;
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => categoriesApi.delete(id))
      );
      await loadCategories();
      setSelectedIds(new Set());
      setBulkMode(false);
      setDeleteConfirm({ open: false, category: null });
      setToast({ open: true, message: `${count} kategori silindi`, type: 'success' });
    } catch (err) {
      console.error('Error bulk deleting:', err);
      setToast({ open: true, message: 'Kategoriler silinemedi', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark pb-nav-safe">
        <header className="sticky top-0 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur z-10">
          <div className="flex items-center p-4 justify-between">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse"></div>
            <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse"></div>
          </div>
          <div className="flex border-b border-gray-200 dark:border-white/10">
            <div className="flex-1 h-10 bg-gray-100 dark:bg-gray-800/50 animate-pulse"></div>
            <div className="flex-1 h-10 bg-gray-100 dark:bg-gray-800/50 animate-pulse"></div>
          </div>
        </header>

        <div className="p-4 space-y-4">
          <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>

          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-surface-dark rounded-2xl border border-gray-50 dark:border-white/5 animate-pulse">
              <div className="size-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full"></div>
              </div>
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background-light dark:bg-background-dark pb-nav-safe">
          <header className="sticky top-0 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur z-10">
              <div className="flex items-center p-4 justify-between">
                  <button onClick={() => router.push('/')} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                       <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <h1 className="text-lg font-bold">Kategorileri Yönet</h1>
                  <button
                    onClick={() => {
                      setBulkMode(!bulkMode);
                      setSelectedIds(new Set());
                    }}
                    className={`p-2 -mr-2 rounded-full transition ${
                      bulkMode
                        ? 'bg-primary/20 text-primary'
                        : 'hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    <span className="material-symbols-outlined">
                      {bulkMode ? 'close' : 'checklist'}
                    </span>
                  </button>
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
                  <input
                      type="text"
                      placeholder="Kategorilerde ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent flex-1 outline-none text-sm"
                  />
                  {searchQuery && (
                      <button
                          onClick={() => setSearchQuery('')}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 active:scale-90 transition"
                      >
                          <span className="material-symbols-outlined text-xl">close</span>
                      </button>
                  )}
              </div>

              {/* List */}
              <div className="space-y-3">
                  {filteredCategories.length === 0 ? (
                      <EmptyState type={activeTab} onQuickAdd={handleQuickAdd} />
                  ) : (
                      filteredCategories.map(category => (
                          <SwipeableCard
                              key={category.id}
                              onEdit={() => handleEditCategory(category)}
                              onDelete={() => setDeleteConfirm({ open: true, category })}
                          >
                              <div className="flex items-center gap-4 p-4 shadow-sm border border-gray-50 dark:border-white/5">
                                  {bulkMode && (
                                      <input
                                          type="checkbox"
                                          checked={selectedIds.has(category.id)}
                                          onChange={(e) => {
                                              const newSelected = new Set(selectedIds);
                                              if (e.target.checked) {
                                                  newSelected.add(category.id);
                                              } else {
                                                  newSelected.delete(category.id);
                                              }
                                              setSelectedIds(newSelected);
                                          }}
                                          className="size-5 rounded border-gray-300 text-primary focus:ring-primary"
                                      />
                                  )}
                                  <div className="relative">
                                      <div className={`size-12 rounded-xl flex items-center justify-center ${category.type === TransactionType.EXPENSE ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                                          <span className="material-symbols-outlined">{category.icon}</span>
                                      </div>
                                      {(() => {
                                          const warningLevel = getBudgetWarningLevel(category);
                                          if (warningLevel === 'none') return null;

                                          return (
                                              <div className={`absolute -top-1 -right-1 size-5 rounded-full flex items-center justify-center ${
                                                  warningLevel === 'danger' ? 'bg-red-500' : 'bg-orange-500'
                                              }`}>
                                                  <span className="material-symbols-outlined text-white text-xs">
                                                      {warningLevel === 'danger' ? 'error' : 'warning'}
                                                  </span>
                                              </div>
                                          );
                                      })()}
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
                              </div>
                          </SwipeableCard>
                      ))
                  )}
              </div>
          </div>

          <div className="fixed bottom-nav-safe right-6">
               <button
                  onClick={() => setShowForm(true)}
                  className="h-14 w-14 bg-primary text-[#102216] rounded-full shadow-lg shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform"
               >
                  <span className="material-symbols-outlined text-3xl">add</span>
               </button>
          </div>

          {/* Bulk action bar */}
          {bulkMode && selectedIds.size > 0 && (
              <div className="fixed bottom-nav-safe left-4 right-4 bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 p-4 flex items-center justify-between animate-[slideUp_0.3s_ease-out]">
                  <span className="text-sm font-semibold">
                      {selectedIds.size} kategori seçildi
                  </span>
                  <button
                      onClick={() => {
                          setDeleteConfirm({
                              open: true,
                              category: {
                                  name: `${selectedIds.size} kategori`,
                                  id: 'bulk'
                              } as Category
                          });
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 active:scale-95 transition"
                  >
                      Sil
                  </button>
              </div>
          )}

          {/* Add Category Sheet */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
              <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-t-3xl shadow-2xl animate-[slideUp_0.25s_ease-out] max-h-[90vh] flex flex-col">
                {/* Header - Fixed */}
                <div className="flex items-center justify-between p-5 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="text-lg font-bold">
                    {editingCategory ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingCategory(null);
                      setError(null);
                    }}
                    className="text-gray-400"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
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

                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Renk (opsiyonel)</label>
                      <div className="flex flex-wrap gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setNewColor(color.value)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition ${
                              newColor === color.value
                                ? 'border-primary bg-primary/10'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div className={`size-6 rounded-full ${color.bg}`}></div>
                            <span className="text-xs font-medium">{color.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {error && (
                      <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-3">
                        {error}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer - Fixed */}
                <div className="p-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={handleSaveCategory}
                    disabled={saving}
                    className="w-full h-12 bg-primary text-[#102216] rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition disabled:opacity-70"
                  >
                    {saving ? 'Kaydediliyor...' : editingCategory ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <ConfirmDialog
            isOpen={deleteConfirm.open}
            onClose={() => setDeleteConfirm({ open: false, category: null })}
            onConfirm={deleteConfirm.category?.id === 'bulk' ? handleBulkDelete : handleDeleteCategory}
            title={deleteConfirm.category?.id === 'bulk' ? 'Kategorileri Sil' : 'Kategoriyi Sil'}
            message={deleteConfirm.category?.id === 'bulk'
              ? `${selectedIds.size} kategoriyi silmek istediğinize emin misiniz? Bu kategorilerdeki işlemler "Diğer" kategorisine taşınacak.`
              : `"${deleteConfirm.category?.name}" kategorisini silmek istediğinize emin misiniz? Bu kategorideki işlemler "Diğer" kategorisine taşınacak.`
            }
            confirmText="Sil"
            cancelText="İptal"
            isDestructive
            loading={deleting}
          />

          <Toast
            isOpen={toast.open}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, open: false })}
          />
      </div>
      {!showForm && <BottomNav />}
    </>
  );
}
