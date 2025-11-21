'use client';

import { useState } from 'react';
import { TransactionType } from '@/types';

interface EmptyStateProps {
  type: TransactionType;
  onQuickAdd: (categoryName: string, icon: string) => void;
}

const defaultCategories = {
  [TransactionType.EXPENSE]: [
    { name: 'Market', icon: 'shopping_cart' },
    { name: 'Yeme & İçme', icon: 'restaurant' },
    { name: 'Ulaşım', icon: 'directions_bus' },
    { name: 'Fatura', icon: 'receipt_long' },
    { name: 'Giyim', icon: 'checkroom' },
    { name: 'Sağlık', icon: 'local_hospital' },
    { name: 'Eğitim', icon: 'school' },
    { name: 'Eğlence', icon: 'movie' },
    { name: 'Spor', icon: 'fitness_center' },
    { name: 'Teknoloji', icon: 'devices' },
    { name: 'Ev & Yaşam', icon: 'home' },
    { name: 'Güzellik', icon: 'face' },
  ],
  [TransactionType.INCOME]: [
    { name: 'Maaş', icon: 'work' },
    { name: 'Freelance', icon: 'payments' },
    { name: 'Yatırım', icon: 'trending_up' },
    { name: 'Ek Gelir', icon: 'attach_money' },
    { name: 'Kira Geliri', icon: 'real_estate_agent' },
    { name: 'Hediye', icon: 'card_giftcard' },
    { name: 'Satış', icon: 'sell' },
    { name: 'İkramiye', icon: 'workspace_premium' },
  ],
};

export default function EmptyState({ type, onQuickAdd }: EmptyStateProps) {
  const suggestions = defaultCategories[type];
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  const toggleCategory = (categoryName: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryName)) {
      newSelected.delete(categoryName);
    } else {
      newSelected.add(categoryName);
    }
    setSelectedCategories(newSelected);
  };

  const handleAddSelected = async () => {
    if (selectedCategories.size === 0) return;
    
    setIsAdding(true);
    try {
      for (const catName of selectedCategories) {
        const cat = suggestions.find(c => c.name === catName);
        if (cat) {
          await onQuickAdd(cat.name, cat.icon);
        }
      }
      setSelectedCategories(new Set());
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="size-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-4xl text-gray-400">
          folder_open
        </span>
      </div>

      <h3 className="text-lg font-bold mb-2">Henüz kategori yok</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6 max-w-xs">
        {type === TransactionType.EXPENSE
          ? 'Gider kategorileri oluşturarak harcamalarınızı takip etmeye başlayın.'
          : 'Gelir kategorileri oluşturarak gelirlerinizi organize edin.'}
      </p>

      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            Hızlı Ekle ({selectedCategories.size} seçili)
          </p>
          {selectedCategories.size > 0 && (
            <button
              onClick={() => setSelectedCategories(new Set())}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Temizle
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          {suggestions.map((cat) => {
            const isSelected = selectedCategories.has(cat.name);
            return (
              <button
                key={cat.name}
                onClick={() => toggleCategory(cat.name)}
                className={`flex items-center gap-3 p-4 border-2 rounded-xl transition ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'bg-white dark:bg-surface-dark border-dashed border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5'
                } active:scale-95`}
              >
                <div
                  className={`size-10 rounded-lg flex items-center justify-center ${
                    isSelected
                      ? type === TransactionType.EXPENSE
                        ? 'bg-red-500/20 text-red-600'
                        : 'bg-primary/20 text-primary'
                      : type === TransactionType.EXPENSE
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                </div>
                <span className="text-sm font-semibold flex-1 text-left">{cat.name}</span>
                {isSelected && (
                  <span className="material-symbols-outlined text-primary text-xl">
                    check_circle
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selectedCategories.size > 0 && (
          <button
            onClick={handleAddSelected}
            disabled={isAdding}
            className="w-full h-12 bg-primary text-[#102216] rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isAdding ? (
              <>
                <span className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></span>
                Ekleniyor...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">add</span>
                {selectedCategories.size} Kategori Ekle
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
