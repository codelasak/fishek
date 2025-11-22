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
import Modal from '@/components/Modal';
import { useFamily } from '@/lib/FamilyContext';

export default function Categories() {
  const { mode, activeFamily } = useFamily();
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

  const resolveIcon = (icon: string) => (icon === 'savings' ? 'account_balance_wallet' : icon);

  const loadCategories = async () => {
    try {
      let categoriesData;
      
      if (mode === 'family' && activeFamily) {
        // Load family categories
        const response = await fetch(`/api/family-categories?familyId=${activeFamily.id}`);
        const data = await response.json();
        categoriesData = data.categories || [];
      } else {
        // Load personal categories
        categoriesData = await categoriesApi.getAll();
      }
      
      setCategories(categoriesData.map((c: Category) => ({ ...c, icon: resolveIcon(c.icon) })));
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [mode, activeFamily]);

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
    : ['work', 'payments', 'attach_money', 'account_balance_wallet'];

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
      if (mode === 'family' && activeFamily) {
        // Family mode operations
        if (editingCategory) {
          // Update family category
          const response = await fetch('/api/family-categories', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: editingCategory.id,
              familyId: activeFamily.id,
              name: newName.trim(),
              icon: newIcon,
              budgetLimit: budgetNum,
              color: newColor,
            }),
          });
          if (!response.ok) throw new Error('Failed to update category');
          setToast({ open: true, message: 'Kategori güncellendi', type: 'success' });
        } else {
          // Create family category
          const response = await fetch('/api/family-categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              familyId: activeFamily.id,
              name: newName.trim(),
              icon: newIcon,
              type: activeTab,
              budgetLimit: budgetNum,
              color: newColor,
            }),
          });
          if (!response.ok) throw new Error('Failed to create category');
          setToast({ open: true, message: 'Kategori oluşturuldu', type: 'success' });
        }
      } else {
        // Personal mode operations
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
    setNewIcon(resolveIcon(category.icon));
    setNewColor(category.color);
    setActiveTab(category.type);
    setShowForm(true);
  };

  const handleDeleteCategory = async () => {
    if (!deleteConfirm.category) return;

    setDeleting(true);
    try {
      if (mode === 'family' && activeFamily) {
        // Delete family category
        const response = await fetch(`/api/family-categories?id=${deleteConfirm.category.id}&familyId=${activeFamily.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete category');
      } else {
        // Delete personal category
        await categoriesApi.delete(deleteConfirm.category.id);
      }
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
      if (mode === 'family' && activeFamily) {
        // Create family category
        const response = await fetch('/api/family-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            familyId: activeFamily.id,
            name,
            icon,
            type: activeTab,
            budgetLimit: undefined,
            color: undefined,
          }),
        });
        if (!response.ok) throw new Error('Failed to create category');
      } else {
        // Create personal category
        await categoriesApi.create({
          name,
          icon,
          type: activeTab,
          budgetLimit: undefined,
          color: undefined,
        });
      }
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
      if (mode === 'family' && activeFamily) {
        // Delete family categories
        await Promise.all(
          Array.from(selectedIds).map(id =>
            fetch(`/api/family-categories?id=${id}&familyId=${activeFamily.id}`, {
              method: 'DELETE',
            })
          )
        );
      } else {
        // Delete personal categories
        await Promise.all(
          Array.from(selectedIds).map(id => categoriesApi.delete(id))
        );
      }
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
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background-light to-background-light dark:from-primary/5 dark:via-background-dark dark:to-background-dark pb-nav-safe">
        <header className="sticky top-0 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl z-10 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center p-4 justify-between">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
            <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
          </div>
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            <div className="flex-1 h-11 bg-gray-100 dark:bg-gray-800/50 animate-pulse"></div>
            <div className="flex-1 h-11 bg-gray-100 dark:bg-gray-800/50 animate-pulse"></div>
          </div>
        </header>

        <div className="p-4 space-y-4">
          <div className="h-12 bg-white dark:bg-surface-dark rounded-2xl animate-pulse shadow-sm"></div>

          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse shadow-sm">
              <div className="size-14 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
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
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background-light to-background-light dark:from-primary/5 dark:via-background-dark dark:to-background-dark pb-nav-safe">
          <header className="sticky top-0 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl z-10 border-b border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center p-4 justify-between">
                  <button onClick={() => router.push('/')} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all">
                       <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Kategorileri Yönet</h1>
                  <button
                    onClick={() => {
                      setBulkMode(!bulkMode);
                      setSelectedIds(new Set());
                    }}
                    className={`p-2 -mr-2 rounded-full transition-all ${
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

              <div className="flex border-b border-gray-200 dark:border-gray-800">
                  <button
                      onClick={() => setActiveTab(TransactionType.EXPENSE)}
                      className={`flex-1 pb-3 font-bold text-sm transition-all relative ${activeTab === TransactionType.EXPENSE ? 'text-primary' : 'text-gray-500'}`}
                  >
                      Giderler
                      {activeTab === TransactionType.EXPENSE && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent rounded-t-full"></div>}
                  </button>
                  <button
                      onClick={() => setActiveTab(TransactionType.INCOME)}
                      className={`flex-1 pb-3 font-bold text-sm transition-all relative ${activeTab === TransactionType.INCOME ? 'text-primary' : 'text-gray-500'}`}
                  >
                      Gelirler
                      {activeTab === TransactionType.INCOME && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent rounded-t-full"></div>}
                  </button>
              </div>
          </header>

          <div className="p-4 space-y-4">
              {/* Search */}
              <div className="bg-white dark:bg-surface-dark rounded-2xl flex items-center h-12 px-4 gap-3 shadow-sm border border-gray-200 dark:border-gray-800">
                  <span className="material-symbols-outlined text-gray-400">search</span>
                  <input
                      type="text"
                      placeholder="Kategorilerde ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent flex-1 outline-none text-sm placeholder:text-gray-400"
                  />
                  {searchQuery && (
                      <button
                          onClick={() => setSearchQuery('')}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 active:scale-90 transition-all"
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
                              <div className="flex items-center gap-4 p-4 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all">
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
                                          className="size-5 rounded-lg border-gray-300 text-primary focus:ring-primary"
                                      />
                                  )}
                                  <div className="relative">
                                      <div className={`size-14 rounded-2xl flex items-center justify-center shadow-sm ${category.type === TransactionType.EXPENSE ? 'bg-gradient-to-br from-red-500/10 to-red-500/5 text-red-500' : 'bg-gradient-to-br from-primary/10 to-primary/5 text-primary'}`}>
                                          <span className="material-symbols-outlined text-2xl">{resolveIcon(category.icon)}</span>
                                      </div>
                                      {(() => {
                                          const warningLevel = getBudgetWarningLevel(category);
                                          if (warningLevel === 'none') return null;

                                          return (
                                              <div className={`absolute -top-1 -right-1 size-5 rounded-full flex items-center justify-center shadow-lg ${
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
                                      <div className="flex justify-between mb-1.5">
                                          <h3 className="font-bold text-base truncate">{category.name}</h3>
                                          {category.budgetLimit ? (
                                              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                                  ₺{category.currentSpent} / ₺{category.budgetLimit}
                                              </span>
                                          ) : null}
                                      </div>
                                      {category.budgetLimit ? (
                                          <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                              <div
                                                  className={`h-full rounded-full transition-all duration-500 ${category.currentSpent && category.currentSpent > category.budgetLimit ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-primary to-primary/80'}`}
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
                  className="h-16 w-16 bg-gradient-to-br from-primary to-primary/90 text-white rounded-full shadow-xl shadow-primary/40 flex items-center justify-center active:scale-90 transition-transform hover:shadow-2xl"
               >
                  <span className="material-symbols-outlined text-3xl">add</span>
               </button>
          </div>

          {/* Bulk action bar */}
          {bulkMode && selectedIds.size > 0 && (
              <div className="fixed bottom-nav-safe left-4 right-4 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between animate-scaleIn">
                  <span className="text-sm font-bold">
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
                      className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold text-sm hover:from-red-600 hover:to-red-700 active:scale-95 transition-all shadow-lg"
                  >
                      Sil
                  </button>
              </div>
          )}

          {/* Add/Edit Category Modal */}
          <Modal
            isOpen={showForm}
            onClose={() => {
              setShowForm(false);
              setEditingCategory(null);
              setError(null);
            }}
            title={editingCategory ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}
            footer={
              <button
                onClick={handleSaveCategory}
                disabled={saving}
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:from-primary/90 hover:to-primary active:scale-[0.98] transition-all disabled:opacity-70"
              >
                {saving ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Kaydediliyor...</span>
                  </div>
                ) : (
                  editingCategory ? 'Güncelle' : 'Kaydet'
                )}
              </button>
            }
          >
            <div className="space-y-5">
              <div className="px-4 py-3 bg-primary/5 rounded-2xl border border-primary/10">
                <p className="text-sm font-semibold text-primary">
                  Tip: {activeTab === TransactionType.EXPENSE ? '🔻 Gider' : '🔺 Gelir'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Kategori Adı</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Örn: Market, Maaş..."
                  className="w-full h-14 px-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Bütçe Limiti (opsiyonel)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₺</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    placeholder="2000"
                    className="w-full h-14 pl-8 pr-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Simge</label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setNewIcon(icon)}
                      className={`flex items-center justify-center h-14 w-14 rounded-2xl border-2 transition-all ${
                        newIcon === icon
                          ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/20 scale-105'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Renk (opsiyonel)</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewColor(color.value)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all ${
                        newColor === color.value
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-105'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className={`size-7 rounded-xl ${color.bg} shadow-sm`}></div>
                      <span className="text-sm font-semibold">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-2 animate-shake">
                  <span className="material-symbols-outlined text-lg">error</span>
                  {error}
                </div>
              )}
            </div>
          </Modal>

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
