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
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background-light to-background-light dark:from-primary/5 dark:via-background-dark dark:to-background-dark pb-nav-safe">
      {/* Header */}
      <div className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 px-4 py-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Aile Ayarları</h1>
          </div>
          <FamilyModeToggle />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Success/Error Messages */}
        {success && (
          <div className="bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10 border-2 border-green-200 dark:border-green-800 rounded-2xl p-4 flex items-center gap-3 text-green-800 dark:text-green-200 shadow-lg animate-scaleIn">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600">check_circle</span>
            </div>
            <span className="font-medium">{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-900/10 border-2 border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3 text-red-800 dark:text-red-200 shadow-lg animate-shake">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-600">error</span>
            </div>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Create Family Section */}
        <div className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg">
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                <span className="material-symbols-outlined text-2xl text-white">add_circle</span>
              </div>
              <span className="font-bold text-base">Yeni Aile Oluştur</span>
            </div>
            <span className="material-symbols-outlined text-2xl">
              {isCreating ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {isCreating && (
            <form onSubmit={handleCreateFamily} className="px-5 py-5 border-t border-gray-200 dark:border-gray-800 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-surface-dark space-y-4 animate-scaleIn">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">family_restroom</span>
                  Aile Adı
                </label>
                <input
                  type="text"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white dark:bg-surface-dark border-2 border-gray-300 dark:border-gray-700 rounded-2xl focus:border-green-500 dark:focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-500/20 transition-all text-base font-medium placeholder:text-gray-400 backdrop-blur-sm shadow-sm"
                  placeholder="örn: Smith Ailesi"
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-bold shadow-xl shadow-green-500/25 hover:shadow-2xl hover:shadow-green-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">check_circle</span>
                <span>Oluştur</span>
              </button>
            </form>
          )}
        </div>

        {/* Join Family Section */}
        <div className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg">
          <button
            onClick={() => setIsJoining(!isJoining)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <span className="material-symbols-outlined text-2xl text-white">group_add</span>
              </div>
              <span className="font-bold text-base">Aileye Katıl</span>
            </div>
            <span className="material-symbols-outlined text-2xl">
              {isJoining ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {isJoining && (
            <form onSubmit={handleJoinFamily} className="px-5 py-5 border-t border-gray-200 dark:border-gray-800 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-surface-dark space-y-4 animate-scaleIn">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">vpn_key</span>
                  Davet Kodu
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) =>
                    setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))
                  }
                  placeholder="ABC-DEFG-HIJ"
                  maxLength={13}
                  className="w-full px-4 py-3.5 bg-white dark:bg-surface-dark border-2 border-gray-300 dark:border-gray-700 rounded-2xl focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all text-base font-mono font-bold placeholder:text-gray-400 backdrop-blur-sm shadow-sm tracking-wider"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 ml-1">
                  <span className="material-symbols-outlined text-sm">info</span>
                  Aile yöneticisinden davet kodunu isteyin
                </p>
              </div>
              <button
                type="submit"
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">login</span>
                <span>Katıl</span>
              </button>
            </form>
          )}
        </div>

        {/* My Families Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold px-2 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Ailelerim</h2>

          {families.length === 0 ? (
            <div className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center shadow-lg">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="material-symbols-outlined text-4xl text-gray-400">groups</span>
              </div>
              <p className="font-bold text-gray-700 dark:text-gray-300">Henüz bir aileye katılmadınız</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Yeni bir aile oluşturun veya davet koduyla katılın
              </p>
            </div>
          ) : (
            families.map((family) => (
              <div
                key={family.id}
                className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                      <span className="material-symbols-outlined text-2xl text-white">family_restroom</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{family.name}</h3>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl mt-1.5 shadow-sm ${
                          family.role === 'ADMIN'
                            ? 'bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-700 dark:text-purple-300'
                            : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {family.role === 'ADMIN' ? 'shield_person' : 'person'}
                        </span>
                        {family.role === 'ADMIN' ? 'Yönetici' : 'Üye'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Invite Code */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 backdrop-blur-sm rounded-xl p-4 mb-3 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">vpn_key</span>
                        Davet Kodu
                      </p>
                      <p className="font-mono font-bold text-lg tracking-wider">{family.inviteCode}</p>
                    </div>
                    <button
                      onClick={() => copyInviteCode(family.inviteCode)}
                      className="px-4 py-2.5 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500 hover:shadow-lg rounded-xl transition-all active:scale-95 flex items-center gap-2 font-bold text-sm shadow-sm"
                    >
                      <span className="material-symbols-outlined text-base">content_copy</span>
                      <span>Kopyala</span>
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <a
                    href={`/family-settings/${family.id}`}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:shadow-lg rounded-xl text-center transition-all active:scale-[0.98] flex items-center justify-center gap-2 font-bold text-sm shadow-sm"
                  >
                    <span className="material-symbols-outlined text-lg">settings</span>
                    <span>Yönet</span>
                  </a>

                  {family.role === 'ADMIN' ? (
                    <button
                      onClick={() => handleDeleteFamily(family.id, family.name)}
                      className="px-4 py-3 bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 hover:shadow-lg text-red-700 dark:text-red-300 rounded-xl transition-all active:scale-95 flex items-center gap-2 font-bold text-sm shadow-sm"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                      <span>Sil</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLeaveFamily(family.id, family.name)}
                      className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:shadow-lg rounded-xl transition-all active:scale-95 flex items-center gap-2 font-bold text-sm shadow-sm"
                    >
                      <span className="material-symbols-outlined text-lg">logout</span>
                      <span>Ayrıl</span>
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
