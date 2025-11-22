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
    <div className="fixed inset-0 z-[100] bg-white dark:bg-background-dark">
      <div className="flex flex-col h-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="material-symbols-outlined text-white text-xl">
                {mode === 'create' ? 'add_circle' : 'group_add'}
              </span>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {mode === 'create' ? 'Aile Oluştur' : 'Aileye Katıl'}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="px-4 py-2 rounded-full text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold transition-all active:scale-95"
          >
            Geç
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
          {/* Animated Icon */}
          <div
            className={`size-36 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-10 animate-scaleIn shadow-2xl`}
          >
            <span className="text-8xl drop-shadow-2xl">{step.icon}</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-5 animate-fadeIn bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent leading-tight">
            {step.title}
          </h1>

          {/* Description */}
          <p className="text-base text-gray-600 dark:text-gray-400 text-center max-w-sm animate-fadeIn leading-relaxed">
            {step.description}
          </p>

          {/* Additional Info */}
          {mode === 'create' && currentStep === 1 && (
            <div className="mt-8 p-5 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-2xl max-w-sm animate-scaleIn shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary text-lg">info</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  Örnek Davet Kodu
                </span>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center font-mono text-2xl font-bold text-primary tracking-wider shadow-inner">
                ABC-DEFG-HIJ
              </div>
            </div>
          )}

          {mode === 'join' && currentStep === 0 && (
            <div className="mt-8 p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 border-2 border-blue-200 dark:border-blue-800 rounded-2xl max-w-sm animate-scaleIn shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600 text-lg">info</span>
                </div>
                <span className="text-sm font-bold text-blue-900 dark:text-blue-300">
                  Davet kodunu nasıl alırım?
                </span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                Ailenizin yöneticisinden davet kodunu isteyin. Kod <span className="font-mono font-bold">ABC-DEFG-HIJ</span> formatında olacaktır.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="p-6 pb-8 space-y-4 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800">
          {/* Progress Indicators */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {steps.map((_, index) => (
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
            className="w-full h-14 bg-gradient-to-r from-primary to-primary/90 text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {currentStep === steps.length - 1 ? (
              <>
                <span>Anladım</span>
                <span className="material-symbols-outlined text-2xl">check_circle</span>
              </>
            ) : (
              <>
                <span>Devam</span>
                <span className="material-symbols-outlined text-2xl">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
