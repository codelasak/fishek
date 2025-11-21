'use client';

import React, { useState } from 'react';
import { useFamily } from '@/lib/FamilyContext';

export function FamilyModeToggle() {
  const { mode, activeFamily, families, setMode, setActiveFamily } = useFamily();
  const [isOpen, setIsOpen] = useState(false);

  const handleModeChange = (newMode: 'personal' | 'family', familyId?: string) => {
    if (newMode === 'personal') {
      setMode('personal');
      setActiveFamily(null);
    } else if (familyId) {
      const family = families.find((f) => f.id === familyId);
      if (family) {
        setActiveFamily(family);
      }
    }
    setIsOpen(false);
  };

  const displayText = mode === 'personal'
    ? 'Kişisel'
    : activeFamily?.name || 'Aile';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
      >
        <span className="material-symbols-outlined text-xl">
          {mode === 'personal' ? 'person' : 'groups'}
        </span>
        <span className="font-medium text-sm">{displayText}</span>
        <span className="material-symbols-outlined text-sm">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full mt-2 right-0 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            {/* Personal Mode */}
            <button
              onClick={() => handleModeChange('personal')}
              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                mode === 'personal' ? 'bg-green-50 dark:bg-green-900/20' : ''
              }`}
            >
              <span className="material-symbols-outlined text-2xl text-gray-600 dark:text-gray-400">
                person
              </span>
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">Kişisel</div>
                <div className="text-xs text-gray-500">Sadece sizin işlemleriniz</div>
              </div>
              {mode === 'personal' && (
                <span className="material-symbols-outlined text-green-600 text-xl">
                  check_circle
                </span>
              )}
            </button>

            {/* Divider */}
            {families.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700" />
            )}

            {/* Family Modes */}
            {families.map((family) => (
              <button
                key={family.id}
                onClick={() => handleModeChange('family', family.id)}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  mode === 'family' && activeFamily?.id === family.id
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : ''
                }`}
              >
                <span className="material-symbols-outlined text-2xl text-gray-600 dark:text-gray-400">
                  groups
                </span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{family.name}</div>
                  <div className="text-xs text-gray-500">
                    {family.role === 'ADMIN' ? 'Yönetici' : 'Üye'}
                  </div>
                </div>
                {mode === 'family' && activeFamily?.id === family.id && (
                  <span className="material-symbols-outlined text-green-600 text-xl">
                    check_circle
                  </span>
                )}
              </button>
            ))}

            {/* Manage Families Link */}
            <div className="border-t border-gray-200 dark:border-gray-700">
              <a
                href="/family-settings"
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-green-600 dark:text-green-400"
                onClick={() => setIsOpen(false)}
              >
                <span className="material-symbols-outlined text-2xl">settings</span>
                <span className="font-medium text-sm">Aile Ayarları</span>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
