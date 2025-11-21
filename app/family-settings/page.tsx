'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFamily } from '@/lib/FamilyContext';
import { FamilyModeToggle } from '@/components/FamilyModeToggle';
import FamilyOnboarding from '../../components/FamilyOnboarding';
import { onboardingStorage } from '@/lib/onboardingStorage';

export default function FamilySettingsPage() {
  const router = useRouter();
  const { families, refreshFamilies } = useFamily();

  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showFamilyOnboarding, setShowFamilyOnboarding] = useState(false);
  const [onboardingMode, setOnboardingMode] = useState<'create' | 'join'>('create');

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newFamilyName.trim()) {
      setError('Aile adı gerekli');
      return;
    }

    try {
      const response = await fetch('/api/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFamilyName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Aile oluşturuldu! Davet kodu: ${data.family.inviteCode}`);
        setNewFamilyName('');
        setIsCreating(false);
        await refreshFamilies();
        
        // Show onboarding if first time
        if (!onboardingStorage.isFamilyCompleted()) {
          setOnboardingMode('create');
          setShowFamilyOnboarding(true);
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Aile oluşturulamadı');
      }
    } catch (err) {
      setError('Bir hata oluştu');
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!inviteCode.trim()) {
      setError('Davet kodu gerekli');
      return;
    }

    try {
      const response = await fetch('/api/families/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.toUpperCase().trim() }),
      });

      if (response.ok) {
        setSuccess('Aileye başarıyla katıldınız!');
        setInviteCode('');
        setIsJoining(false);
        await refreshFamilies();
        
        // Show onboarding if first time
        if (!onboardingStorage.isFamilyCompleted()) {
          setOnboardingMode('join');
          setShowFamilyOnboarding(true);
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Aileye katılınamadı');
      }
    } catch (err) {
      setError('Bir hata oluştu');
    }
  };

  const handleLeaveFamily = async (familyId: string, familyName: string) => {
    if (!confirm(`${familyName} ailesinden ayrılmak istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/families/${familyId}/leave`, {
        method: 'POST',
      });

      if (response.ok) {
        setSuccess('Aileden başarıyla ayrıldınız');
        await refreshFamilies();
      } else {
        const data = await response.json();
        setError(data.error || 'Aileden ayrılınamadı');
      }
    } catch (err) {
      setError('Bir hata oluştu');
    }
  };

  const handleDeleteFamily = async (familyId: string, familyName: string) => {
    if (
      !confirm(
        `${familyName} ailesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm aile verileri silinecektir.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/families/${familyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Aile başarıyla silindi');
        await refreshFamilies();
      } else {
        const data = await response.json();
        setError(data.error || 'Aile silinemedi');
      }
    } catch (err) {
      setError('Bir hata oluştu');
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setSuccess('Davet kodu kopyalandı!');
    setTimeout(() => setSuccess(''), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-nav-safe">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="material-symbols-outlined text-2xl"
            >
              arrow_back
            </button>
            <h1 className="text-xl font-bold">Aile Ayarları</h1>
          </div>
          <FamilyModeToggle />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-2 text-green-800 dark:text-green-200">
            <span className="material-symbols-outlined">check_circle</span>
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-2 text-red-800 dark:text-red-200">
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Create Family Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl text-green-600">
                add_circle
              </span>
              <span className="font-medium">Yeni Aile Oluştur</span>
            </div>
            <span className="material-symbols-outlined">
              {isCreating ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {isCreating && (
            <form onSubmit={handleCreateFamily} className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Aile Adı</label>
                  <input
                    type="text"
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                    placeholder="örn: Smith Ailesi"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-colors"
                >
                  Oluştur
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Join Family Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setIsJoining(!isJoining)}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl text-blue-600">
                group_add
              </span>
              <span className="font-medium">Aileye Katıl</span>
            </div>
            <span className="material-symbols-outlined">
              {isJoining ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {isJoining && (
            <form onSubmit={handleJoinFamily} className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Davet Kodu</label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) =>
                      setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))
                    }
                    placeholder="ABC-DEFG-HIJ"
                    maxLength={13}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Aile yöneticisinden davet kodunu isteyin
                  </p>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
                >
                  Katıl
                </button>
              </div>
            </form>
          )}
        </div>

        {/* My Families Section */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold px-2">Ailelerim</h2>

          {families.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <span className="material-symbols-outlined text-5xl text-gray-400 mb-2">
                groups
              </span>
              <p className="text-gray-500">Henüz bir aileye katılmadınız</p>
              <p className="text-sm text-gray-400 mt-1">
                Yeni bir aile oluşturun veya davet koduyla katılın
              </p>
            </div>
          ) : (
            families.map((family) => (
              <div
                key={family.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{family.name}</h3>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                        family.role === 'ADMIN'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {family.role === 'ADMIN' ? 'Yönetici' : 'Üye'}
                    </span>
                  </div>
                </div>

                {/* Invite Code */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Davet Kodu
                      </p>
                      <p className="font-mono font-bold text-lg">{family.inviteCode}</p>
                    </div>
                    <button
                      onClick={() => copyInviteCode(family.inviteCode)}
                      className="px-3 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                      <span className="text-sm">Kopyala</span>
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <a
                    href={`/family-settings/${family.id}`}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-center transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">settings</span>
                    <span className="text-sm font-medium">Yönet</span>
                  </a>

                  {family.role === 'ADMIN' ? (
                    <button
                      onClick={() => handleDeleteFamily(family.id, family.name)}
                      className="px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      <span className="text-sm font-medium">Sil</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLeaveFamily(family.id, family.name)}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">logout</span>
                      <span className="text-sm font-medium">Ayrıl</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {showFamilyOnboarding && (
        <FamilyOnboarding 
          mode={onboardingMode}
          onComplete={() => {
            onboardingStorage.setFamilyCompleted();
            setShowFamilyOnboarding(false);
          }}
        />
      )}
    </div>
  );
}
