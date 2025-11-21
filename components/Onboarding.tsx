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
    <div className="fixed inset-0 z-[100] bg-background-light dark:bg-background-dark overflow-y-auto">
      <div className="flex flex-col min-h-full max-w-md mx-auto">
        {/* Skip button */}
        <div className="flex justify-end p-4 sticky top-0 bg-background-light dark:bg-background-dark z-10">
          <button
            onClick={handleSkip}
            disabled={isCreating}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium disabled:opacity-50"
          >
            Geç
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center px-6 pb-8">
          {/* Animated Icon */}
          <div
            className={`size-24 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 animate-[scaleIn_0.5s_ease-out] shadow-2xl`}
          >
            <span className="material-symbols-outlined text-6xl text-white">{step.icon}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center mb-3 animate-[slideUp_0.5s_ease-out]">
            {step.title}
          </h1>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-sm mb-6 animate-[slideUp_0.6s_ease-out]">
            {step.description}
          </p>

          {/* Category Selection */}
          {step.type === 'expense-categories' && (
            <div className="w-full animate-[slideUp_0.7s_ease-out]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {selectedExpenseCategories.size} kategori seçildi
                </p>
                {selectedExpenseCategories.size > 0 && (
                  <button
                    onClick={() => setSelectedExpenseCategories(new Set())}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Temizle
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {defaultCategories.expense.map((cat) => {
                  const isSelected = selectedExpenseCategories.has(cat.name);
                  return (
                    <button
                      key={cat.name}
                      onClick={() => toggleCategory(cat.name, 'expense')}
                      className={`flex items-center gap-2 p-3 border-2 rounded-xl transition ${
                        isSelected
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-red-500/50'
                      } active:scale-95`}
                    >
                      <div
                        className={`size-8 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-red-500/20 text-red-600' : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                      </div>
                      <span className="text-xs font-semibold flex-1 text-left">{cat.name}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-red-500 text-lg">
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
            <div className="w-full animate-[slideUp_0.7s_ease-out]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {selectedIncomeCategories.size} kategori seçildi
                </p>
                {selectedIncomeCategories.size > 0 && (
                  <button
                    onClick={() => setSelectedIncomeCategories(new Set())}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Temizle
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {defaultCategories.income.map((cat) => {
                  const isSelected = selectedIncomeCategories.has(cat.name);
                  return (
                    <button
                      key={cat.name}
                      onClick={() => toggleCategory(cat.name, 'income')}
                      className={`flex items-center gap-2 p-3 border-2 rounded-xl transition ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                      } active:scale-95`}
                    >
                      <div
                        className={`size-8 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                      </div>
                      <span className="text-xs font-semibold flex-1 text-left">{cat.name}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-primary text-lg">
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
        <div className="p-6 pb-8 space-y-4 sticky bottom-0 bg-background-light dark:bg-background-dark">
          {/* Progress Indicators */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : index < currentStep
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-gray-300 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={!canProceed() || isCreating}
            className="w-full h-14 bg-primary text-[#102216] rounded-xl font-bold text-lg shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <span className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></span>
                Ayarlanıyor...
              </>
            ) : currentStep === onboardingSteps.length - 1 ? (
              'Başlayalım'
            ) : (
              'Devam'
            )}
          </button>

          {!canProceed() && (step.type === 'expense-categories' || step.type === 'income-categories') && (
            <p className="text-xs text-center text-gray-500">
              Devam etmek için en az 1 kategori seçin
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
