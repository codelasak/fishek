'use client';

import { useState } from 'react';

interface FamilyOnboardingProps {
  onComplete: () => void;
  mode: 'create' | 'join';
}

const createSteps = [
  {
    title: 'Aile Hesabı Oluşturun 🏠',
    description: 'Aileniz için ortak bir bütçe hesabı oluşturun ve birlikte finansal hedeflerinize ulaşın.',
    icon: '👨‍👩‍👧‍👦',
    color: 'from-pink-400 to-red-500',
  },
  {
    title: 'Davet Kodu Alın ��',
    description: 'Aile üyelerinizi davet etmek için özel bir kod oluşturacağız.',
    icon: '🎫',
    color: 'from-blue-400 to-blue-600',
  },
  {
    title: 'Ortak Kategoriler 📋',
    description: 'Aile harcamaları için kategoriler oluşturun. Market, faturalar, tatil gibi.',
    icon: '✅',
    color: 'from-green-400 to-primary',
  },
  {
    title: 'Harcama Limitleri 💳',
    description: 'Aile üyeleri için harcama limitleri belirleyin ve bütçenizi kontrol altında tutun.',
    icon: '🎯',
    color: 'from-purple-400 to-purple-600',
  },
];

const joinSteps = [
  {
    title: 'Bir Aileye Katılın 🤝',
    description: 'Aile davet kodunu girerek ailenizin bütçe yönetim sistemine katılın.',
    icon: '🏡',
    color: 'from-blue-400 to-blue-600',
  },
  {
    title: 'Ortak Harcamalar 💰',
    description: 'Aile harcamalarını görüntüleyin ve kendi harcamalarınızı ekleyin.',
    icon: '👀',
    color: 'from-green-400 to-primary',
  },
  {
    title: 'Şeffaflık 📊',
    description: 'Ailenizin toplam gelir, gider ve bütçe durumunu gerçek zamanlı takip edin.',
    icon: '📈',
    color: 'from-purple-400 to-purple-600',
  },
  {
    title: 'Birlikte Başarın 🎉',
    description: 'Finansal hedeflerinize aile olarak ulaşın, birlikte tasarruf edin.',
    icon: '🏆',
    color: 'from-pink-400 to-red-500',
  },
];

export default function FamilyOnboarding({ onComplete, mode }: FamilyOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = mode === 'create' ? createSteps : joinSteps;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] bg-background-light dark:bg-background-dark">
      <div className="flex flex-col h-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              {mode === 'create' ? 'add_circle' : 'group_add'}
            </span>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              {mode === 'create' ? 'Aile Oluştur' : 'Aileye Katıl'}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
          >
            Geç
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
          {/* Animated Icon */}
          <div
            className={`size-32 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center mb-8 animate-[scaleIn_0.5s_ease-out] shadow-2xl`}
          >
            <span className="text-6xl">{step.icon}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center mb-4 animate-[slideUp_0.5s_ease-out]">
            {step.title}
          </h1>

          {/* Description */}
          <p className="text-base text-gray-600 dark:text-gray-400 text-center max-w-sm animate-[slideUp_0.6s_ease-out]">
            {step.description}
          </p>

          {/* Additional Info */}
          {mode === 'create' && currentStep === 1 && (
            <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl max-w-sm animate-[slideUp_0.7s_ease-out]">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-sm">info</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Örnek Davet Kodu
                </span>
              </div>
              <div className="text-center font-mono text-lg font-bold text-primary tracking-wider">
                ABC-DEFG-HIJ
              </div>
            </div>
          )}

          {mode === 'join' && currentStep === 0 && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl max-w-sm animate-[slideUp_0.7s_ease-out]">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-blue-600 text-sm">info</span>
                <span className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                  Davet kodunu nasıl alırım?
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Ailenizin yöneticisinden davet kodunu isteyin. Kod ABC-DEFG-HIJ formatında olacaktır.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="p-6 pb-8 space-y-4">
          {/* Progress Indicators */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, index) => (
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
            className="w-full h-14 bg-primary text-[#102216] rounded-xl font-bold text-lg shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] transition"
          >
            {currentStep === steps.length - 1 ? 'Anladım' : 'Devam'}
          </button>
        </div>
      </div>
    </div>
  );
}
