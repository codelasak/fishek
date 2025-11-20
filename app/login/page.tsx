'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';

const LoginContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

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

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl: '/',
    });

    setLoading(false);

    if (result?.error) {
      setError('E-posta veya şifre hatalı.');
      return;
    }

    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background-light dark:bg-background-dark text-center">
      <div className="w-full max-w-md">
        <div className="mb-10">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-6">
            <span className="material-symbols-outlined text-5xl">receipt_long</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Tekrar hoş geldin!</h1>
          <p className="text-gray-500 dark:text-gray-400">Kişisel finansını takip etmeye devam et.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 text-red-700 p-3 text-sm border border-red-100 dark:bg-red-900/30 dark:border-red-800 dark:text-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="text-left">
            <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">E-posta</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e-posta adresinizi girin"
              className="w-full h-14 px-4 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <div className="text-left">
            <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">Şifre</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="şifrenizi girin"
                className="w-full h-14 px-4 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          <div className="text-right">
            <button type="button" className="text-sm font-bold text-primary">
              Şifremi Unuttum
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-primary text-[#102216] rounded-xl font-bold text-lg shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="mt-8">
          <p className="text-gray-500 dark:text-gray-400">
            Hesabın yok mu?{' '}
            <Link href="/register" className="text-primary font-bold ml-1">
              Hesap Oluştur
            </Link>
          </p>
        </div>
      </div>
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
