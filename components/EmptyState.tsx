'use client';

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
  ],
  [TransactionType.INCOME]: [
    { name: 'Maaş', icon: 'work' },
    { name: 'Freelance', icon: 'payments' },
    { name: 'Yatırım', icon: 'trending_up' },
    { name: 'Ek Gelir', icon: 'attach_money' },
  ],
};

export default function EmptyState({ type, onQuickAdd }: EmptyStateProps) {
  const suggestions = defaultCategories[type];

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

      <div className="w-full max-w-sm">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 text-center">
          Hızlı Ekle
        </p>
        <div className="grid grid-cols-2 gap-3">
          {suggestions.map((cat) => (
            <button
              key={cat.name}
              onClick={() => onQuickAdd(cat.name, cat.icon)}
              className="flex items-center gap-3 p-4 bg-white dark:bg-surface-dark border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary hover:bg-primary/5 active:scale-95 transition"
            >
              <div
                className={`size-10 rounded-lg flex items-center justify-center ${
                  type === TransactionType.EXPENSE
                    ? 'bg-red-500/10 text-red-500'
                    : 'bg-primary/10 text-primary'
                }`}
              >
                <span className="material-symbols-outlined">{cat.icon}</span>
              </div>
              <span className="text-sm font-semibold">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
