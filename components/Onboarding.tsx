'use client';

import { useState } from 'react';
import { TransactionType } from '@/types';

interface OnboardingProps {
  onComplete: () => void;
}

const defaultCategories = {
  expense: [
    { name: 'Market', icon: 'shopping_cart' },
    { name: 'Yeme & İçme', icon: 'restaurant' },
    { name: 'Ulaşım', icon: 'directions_bus' },
    { name: 'Fatura', icon: 'receipt_long' },
    { name: 'Giyim', icon: 'checkroom' },
    { name: 'Sağlık', icon: 'local_hospital' },
    { name: 'Eğlence', icon: 'movie' },
    { name: 'Teknoloji', icon: 'devices' },
  ],
  income: [
    { name: 'Maaş', icon: 'work' },
    { name: 'Freelance', icon: 'payments' },
    { name: 'Yatırım', icon: 'trending_up' },
    { name: 'Ek Gelir', icon: 'attach_money' },
  ],
};

const onboardingSteps = [
  {
    title: 'Hoş Geldiniz!',
    description: 'Fishek ile gelir ve giderlerinizi kolayca takip edin, bütçenizi yönetin.',
    icon: 'account_balance_wallet',
    color: 'from-green-400 to-primary',
    type: 'intro',
  },
  {
    title: 'Gider Kategorileri',
    description: 'Harcamalarınızı takip etmek için kategoriler seçin',
    icon: 'receipt_long',
    color: 'from-red-400 to-red-600',
    type: 'expense-categories',
  },
  {
    title: 'Gelir Kategorileri',
    description: 'Gelirlerinizi organize etmek için kategoriler seçin',
    icon: 'paid',
    color: 'from-green-400 to-primary',
    type: 'income-categories',
  },
  {
    title: 'Akıllı Fiş Okuma',
    description: 'Fişlerinizi fotoğraflayın, AI otomatik olarak tutarı ve kategoriyi belirlesin.',
    icon: 'photo_camera',
    color: 'from-blue-400 to-blue-600',
    type: 'info',
  },
  {
    title: 'Aile Modu',
    description: 'Ailenizle birlikte bütçenizi yönetin, ortak harcamaları takip edin.',
    icon: 'family_restroom',
    color: 'from-pink-400 to-red-500',
    type: 'info',
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedExpenseCategories, setSelectedExpenseCategories] = useState<Set<string>>(new Set());
  const [selectedIncomeCategories, setSelectedIncomeCategories] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  const step = onboardingSteps[currentStep];

  const toggleCategory = (categoryName: string, type: 'expense' | 'income') => {
    if (type === 'expense') {
      const newSelected = new Set(selectedExpenseCategories);
      if (newSelected.has(categoryName)) {
        newSelected.delete(categoryName);
      } else {
        newSelected.add(categoryName);
      }
      setSelectedExpenseCategories(newSelected);
    } else {
      const newSelected = new Set(selectedIncomeCategories);
      if (newSelected.has(categoryName)) {
        newSelected.delete(categoryName);
      } else {
        newSelected.add(categoryName);
      }
      setSelectedIncomeCategories(newSelected);
    }
  };

  const createCategories = async () => {
    if (selectedExpenseCategories.size === 0 && selectedIncomeCategories.size === 0) {
      return; // Nothing to create
    }

    setIsCreating(true);
    try {
      // Get existing categories first
      const existingResponse = await fetch('/api/categories');
      const existingData = await existingResponse.json();
      const existingCategories = existingData.categories || [];
      const existingNames = new Set(existingCategories.map((c: any) => c.name.toLowerCase()));

      const categoriesToCreate = [
        ...Array.from(selectedExpenseCategories).map(name => {
          const cat = defaultCategories.expense.find(c => c.name === name);
          return { name, icon: cat?.icon || 'category', type: TransactionType.EXPENSE };
        }),
        ...Array.from(selectedIncomeCategories).map(name => {
          const cat = defaultCategories.income.find(c => c.name === name);
          return { name, icon: cat?.icon || 'category', type: TransactionType.INCOME };
        }),
      ].filter(cat => !existingNames.has(cat.name.toLowerCase())); // Filter out duplicates

      // Only create categories that don't exist
      for (const category of categoriesToCreate) {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(category),
        });
      }
    } catch (error) {
      console.error('Error creating categories:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === onboardingSteps.length - 1) {
      await createCategories();
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = async () => {
    await createCategories();
    onComplete();
  };

  const canProceed = () => {
    if (step.type === 'expense-categories') {
      return selectedExpenseCategories.size > 0;
    }
    if (step.type === 'income-categories') {
      return selectedIncomeCategories.size > 0;
    }
    return true;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-background-dark overflow-y-auto">
      <div className="flex flex-col min-h-full max-w-md mx-auto">
        {/* Skip button */}
        <div className="flex justify-end p-5 sticky top-0 bg-white/95 dark:bg-background-dark/95 backdrop-blur-xl z-10">
          <button
            onClick={handleSkip}
            disabled={isCreating}
            className="px-4 py-2 rounded-full text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold disabled:opacity-50 transition-all active:scale-95"
          >
            Geç
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center px-6 pb-8 pt-4">
          {/* Animated Icon */}
          <div
            className={`size-32 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-8 animate-scaleIn shadow-2xl`}
          >
            <span className="material-symbols-outlined text-7xl text-white drop-shadow-lg">{step.icon}</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-4 animate-fadeIn bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {step.title}
          </h1>

          {/* Description */}
          <p className="text-base text-gray-600 dark:text-gray-400 text-center max-w-sm mb-8 animate-fadeIn leading-relaxed">
            {step.description}
          </p>

          {/* Category Selection */}
          {step.type === 'expense-categories' && (
            <div className="w-full animate-fadeIn">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-500 text-lg">check_circle</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {selectedExpenseCategories.size} kategori seçildi
                  </p>
                </div>
                {selectedExpenseCategories.size > 0 && (
                  <button
                    onClick={() => setSelectedExpenseCategories(new Set())}
                    className="text-xs font-semibold text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    Temizle
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {defaultCategories.expense.map((cat) => {
                  const isSelected = selectedExpenseCategories.has(cat.name);
                  return (
                    <button
                      key={cat.name}
                      onClick={() => toggleCategory(cat.name, 'expense')}
                      className={`flex flex-col items-center gap-3 p-4 border-2 rounded-2xl transition-all ${
                        isSelected
                          ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20 scale-105'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark hover:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-900/10'
                      } active:scale-95`}
                    >
                      <div
                        className={`size-12 rounded-2xl flex items-center justify-center shadow-sm ${
                          isSelected ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white text-center">{cat.name}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-red-500 text-xl absolute top-2 right-2">
                          check_circle
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step.type === 'income-categories' && (
            <div className="w-full animate-fadeIn">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {selectedIncomeCategories.size} kategori seçildi
                  </p>
                </div>
                {selectedIncomeCategories.size > 0 && (
                  <button
                    onClick={() => setSelectedIncomeCategories(new Set())}
                    className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Temizle
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {defaultCategories.income.map((cat) => {
                  const isSelected = selectedIncomeCategories.has(cat.name);
                  return (
                    <button
                      key={cat.name}
                      onClick={() => toggleCategory(cat.name, 'income')}
                      className={`flex flex-col items-center gap-3 p-4 border-2 rounded-2xl transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-105'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark hover:border-primary/50 hover:bg-primary/5'
                      } active:scale-95`}
                    >
                      <div
                        className={`size-12 rounded-2xl flex items-center justify-center shadow-sm ${
                          isSelected ? 'bg-gradient-to-br from-primary to-primary/80 text-white' : 'bg-primary/10 text-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white text-center">{cat.name}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-primary text-xl absolute top-2 right-2">
                          check_circle
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="p-6 pb-8 space-y-4 sticky bottom-0 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800">
          {/* Progress Indicators */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-500 ${
                  index === currentStep
                    ? 'w-10 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/30'
                    : index < currentStep
                    ? 'w-2 bg-primary/60'
                    : 'w-2 bg-gray-300 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={!canProceed() || isCreating}
            className="w-full h-14 bg-gradient-to-r from-primary to-primary/90 text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></span>
                <span>Ayarlanıyor...</span>
              </>
            ) : currentStep === onboardingSteps.length - 1 ? (
              <>
                <span>Başlayalım</span>
                <span className="material-symbols-outlined text-2xl">arrow_forward</span>
              </>
            ) : (
              <>
                <span>Devam</span>
                <span className="material-symbols-outlined text-2xl">arrow_forward</span>
              </>
            )}
          </button>

          {!canProceed() && (step.type === 'expense-categories' || step.type === 'income-categories') && (
            <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2 animate-shake">
              <span className="material-symbols-outlined text-sm">info</span>
              <p className="text-xs font-semibold">
                Devam etmek için en az 1 kategori seçin
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
