'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { Capacitor } from '@capacitor/core';
import { mobileAuth } from '@/lib/mobileAuth';
import { useMobileAuth } from '@/lib/MobileAuthContext';

const LoginContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = Capacitor.isNativePlatform();
  const { refreshUser } = useMobileAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams?.get('error');
    if (errorParam && !error) {
      setError('Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
    }
  }, [searchParams, error]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isMobile) {
        // Mobile login with JWT
        const result = await mobileAuth.login(email, password);
        if (result.error) {
          setError(result.error);
          setLoading(false);
          return;
        }
        console.log('[Mobile Login] Success');
        // Refresh auth context so dashboard knows we're authenticated
        await refreshUser();
        // Keep loading state while redirecting
        router.push('/');
        router.refresh();
      } else {
        // Web login with NextAuth
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
          callbackUrl: '/',
        });

        console.log('[Login] signIn result:', result);
        setLoading(false);

        if (result?.error) {
          console.log('[Login] Error:', result.error);
          setError('E-posta veya şifre hatalı.');
          return;
        }

        if (result?.ok) {
          console.log('[Login] Success, redirecting...');
          router.push('/');
          router.refresh();
        }
      }
    } catch (err) {
      console.error('[Login] Exception:', err);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-background-light dark:from-primary/10 dark:to-background-dark">
      {/* Safe area top padding for iOS */}
      <div className="pt-safe"></div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-12">
        <div className="w-full max-w-md">
          {/* App Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] blur-2xl"></div>
              <div className="relative inline-flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary to-primary/80 text-[#102216] shadow-2xl shadow-primary/30">
                <span className="material-symbols-outlined text-6xl font-light">receipt_long</span>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Tekrar hoş geldin!
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Kişisel finansını takip etmeye devam et.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 p-4 animate-shake">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-red-500 text-xl">error</span>
                <p className="flex-1 text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300 px-1">
                E-posta
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                  mail
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-base placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300 px-1">
                Şifre
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 pl-12 pr-14 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-base placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors active:scale-95"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end pt-1">
              <button 
                type="button" 
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors active:scale-95"
              >
                Şifremi Unuttum
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-primary to-primary/90 text-[#102216] rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-lg mt-6 relative overflow-hidden"
            >
              {loading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-[#102216]/30 border-t-[#102216]"></span>
                </span>
              )}
              <span className={loading ? 'opacity-0' : ''}>
                Giriş Yap
              </span>
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Hesabın yok mu?{' '}
              <Link 
                href="/register" 
                className="text-primary font-bold hover:text-primary/80 transition-colors active:scale-95 inline-block"
              >
                Hesap Oluştur
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Safe area bottom padding for iOS */}
      <div className="pb-safe"></div>
    </div>
  );
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-sm text-gray-500">Yükleniyor...</div>}>
      <LoginContent />
    </Suspense>
  );
}
