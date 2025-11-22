'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { categoriesApi, transactionsApi } from '@/services/apiClient';
import { scanReceipt } from '@/services/geminiService';
import { TransactionType, Category } from '@/types';
import { useFamily } from '@/lib/FamilyContext';

const quickAmounts = [50, 100, 250, 500];

export default function AddTransaction() {
  const router = useRouter();
  const { mode, activeFamily } = useFamily();
  const [categories, setCategories] = useState<Category[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        let categoriesData;

        if (mode === 'family' && activeFamily) {
          // Load family categories
          const response = await fetch(`/api/family-categories?familyId=${activeFamily.id}`);
          const data = await response.json();
          categoriesData = data.categories || [];
        } else {
          // Load personal categories
          categoriesData = await categoriesApi.getAll();
        }

        setCategories(categoriesData);
        if (categoriesData.length > 0) {
          const defaultCategory = categoriesData.find(c => c.type === TransactionType.EXPENSE) || categoriesData[0];
          if (defaultCategory) setCategoryId(defaultCategory.id);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [mode, activeFamily]);

  // Keep category selection valid when type changes
  useEffect(() => {
    if (categories.length === 0) return;
    const filtered = categories.filter(c => c.type === type);
    if (filtered.length === 0) {
      setCategoryId('');
      return;
    }
    if (!filtered.find(c => c.id === categoryId)) {
      setCategoryId(filtered[0].id);
    }
  }, [type, categories, categoryId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanError(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setReceiptImage(base64String);

        try {
          const data = await scanReceipt(base64String);
          if (data) {
            setAmount(data.amount.toString());
            setDescription(data.merchant || data.summary || '');
            if (data.date) setDate(data.date);

            // Try to match category
            const matchedCat = categories.find(c =>
                c.name.toLowerCase() === data.category.toLowerCase() ||
                (data.category.toLowerCase().includes('market') && c.name.toLowerCase() === 'market') ||
                (data.category.toLowerCase().includes('food') && c.name.toLowerCase().includes('yeme'))
            );

            if (matchedCat) {
                setCategoryId(matchedCat.id);
                setType(matchedCat.type);
            }
          }
        } catch (err) {
          console.error(err);
          setScanError("Fiş taranamadı, lütfen bilgileri manuel girin.");
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsScanning(false);
      setScanError("Resim yüklenirken hata oluştu.");
    }
  };

  const handleSave = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      setScanError('Lütfen geçerli bir tutar girin.');
      return;
    }
    if (!categoryId) {
      setScanError('Lütfen kategori seçin.');
      return;
    }

    try {
      if (mode === 'family' && activeFamily) {
        // Save to family transactions
        const response = await fetch('/api/family-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            familyId: activeFamily.id,
            amount: parseFloat(amount),
            description: description || (type === TransactionType.INCOME ? 'Gelir' : 'Gider'),
            date,
            categoryId,
            type,
            receiptImage: receiptImage || null,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create family transaction');
        }
      } else {
        // Save to personal transactions
        await transactionsApi.create({
          id: crypto.randomUUID(),
          amount: parseFloat(amount),
          description: description || (type === TransactionType.INCOME ? 'Gelir' : 'Gider'),
          date,
          categoryId,
          type,
          receiptImage: receiptImage || undefined,
          createdAt: Date.now()
        });
      }

      router.push('/');
    } catch (error) {
      console.error('Error saving transaction:', error);
      setScanError('İşlem kaydedilemedi. Lütfen tekrar deneyin.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-primary/5 via-background-light to-background-light dark:from-primary/5 dark:via-background-dark dark:to-background-dark">
        {/* Header Skeleton */}
        <div className="sticky top-0 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl z-10 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
            <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-xl w-40" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Scan Card Skeleton */}
          <div className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
              <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-32" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
            </div>
            <div className="h-14 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-2xl" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
          </div>

          {/* Type Selector Skeleton */}
          <div className="flex gap-2">
            <div className="flex-1 h-14 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-2xl" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
            <div className="flex-1 h-14 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-2xl" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
          </div>

          {/* Amount Skeleton */}
          <div className="space-y-3">
            <div className="h-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-2xl" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
            <div className="flex gap-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex-1 h-11 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-xl" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
              ))}
            </div>
          </div>

          {/* Form Fields Skeleton */}
          {[1,2,3].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-24" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
              <div className="h-14 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-2xl" style={{backgroundSize: '1000px 100%', animation: 'shimmer 2s infinite linear'}}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-primary/5 via-background-light to-background-light dark:from-primary/5 dark:via-background-dark dark:to-background-dark">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl z-10 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Yeni İşlem Ekle</h1>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`p-2 -mr-2 rounded-full transition-all ${isScanning ? 'animate-pulse text-primary' : 'hover:bg-black/5 dark:hover:bg-white/10 active:scale-95'}`}
            disabled={isScanning}
          >
            <span className="material-symbols-outlined">
              {isScanning ? 'hourglass_top' : 'photo_camera'}
            </span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
          />
        </div>
        {/* Mode Indicator */}
        {mode === 'family' && activeFamily && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10 rounded-2xl border-2 border-green-200 dark:border-green-800 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-600 text-xl">groups</span>
              </div>
              <span className="text-sm text-green-900 dark:text-green-200 font-medium">
                <span className="font-bold">{activeFamily.name}</span> ailesine kaydediliyor
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 px-4 pb-nav-safe overflow-y-auto space-y-5 pt-2">
        {scanError && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-900/30 dark:to-red-900/20 text-red-800 dark:text-red-200 text-sm border-2 border-red-200 dark:border-red-800 flex items-center gap-3 shadow-sm animate-shake">
            <span className="material-symbols-outlined text-red-500">error</span>
            <span className="font-medium">{scanError}</span>
          </div>
        )}

        {/* Scan Card */}
        <div className="rounded-2xl bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="material-symbols-outlined text-2xl">receipt_long</span>
            </div>
            <div>
              <p className="text-base font-bold text-gray-900 dark:text-white">Fiş Tara</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Tutar, tarih ve kategori otomatik dolsun.</p>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="w-full h-14 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-sm font-bold flex items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all disabled:opacity-70 active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">{isScanning ? 'hourglass_top' : 'photo_camera'}</span>
            {isScanning ? 'Taranıyor...' : 'Kamera veya galeriden fiş ekle'}
          </button>
          {receiptImage && (
            <div className="mt-4 relative h-40 w-full rounded-2xl overflow-hidden shadow-lg">
              <img src={receiptImage} alt="Receipt" className="w-full h-full object-cover" />
              <button
                onClick={() => setReceiptImage(null)}
                className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/80 transition-colors active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          )}
        </div>

        {/* Type Segment Control */}
        <div className="flex p-1.5 bg-gray-200 dark:bg-gray-800 rounded-2xl shadow-inner">
          <button
            onClick={() => setType(TransactionType.EXPENSE)}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${type === TransactionType.EXPENSE ? 'bg-white dark:bg-surface-dark shadow-lg text-gray-900 dark:text-white' : 'text-gray-500'}`}
          >
            🔻 Gider
          </button>
          <button
            onClick={() => setType(TransactionType.INCOME)}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${type === TransactionType.INCOME ? 'bg-white dark:bg-surface-dark shadow-lg text-gray-900 dark:text-white' : 'text-gray-500'}`}
          >
            🔺 Gelir
          </button>
        </div>

        {/* Amount Input */}
        <div className="rounded-2xl bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Tutar</label>
            <span className="text-xs font-semibold text-gray-500 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">TRY</span>
          </div>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`w-full h-24 bg-transparent text-6xl font-bold text-center outline-none placeholder:text-gray-300 dark:placeholder:text-gray-700 ${type === TransactionType.EXPENSE ? 'text-red-500' : 'text-primary'}`}
            />
            <span className={`absolute top-1/2 -translate-y-1/2 right-4 text-3xl font-bold text-gray-400 ${!amount && 'opacity-0'}`}>₺</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {quickAmounts.map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val.toString())}
                className="px-4 py-2 rounded-full text-sm font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-primary/10 hover:text-primary border border-gray-200 dark:border-gray-700 transition-all active:scale-95"
              >
                ₺{val}
              </button>
            ))}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 rounded-2xl bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 p-5 shadow-lg">
          <div>
            <label className="block text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">Kategori</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <span className="material-symbols-outlined text-xl">category</span>
              </span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-14 pl-12 pr-10 appearance-none bg-gray-50 dark:bg-gray-900 rounded-2xl outline-none border-2 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all"
              >
                {categories.filter(c => c.type === type).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <span className="material-symbols-outlined text-2xl">arrow_drop_down</span>
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">Tarih</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                <span className="material-symbols-outlined text-xl">event</span>
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-gray-50 dark:bg-gray-900 rounded-2xl outline-none border-2 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">Açıklama</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === TransactionType.EXPENSE ? "Örn: Akşam yemeği" : "Örn: Freelance iş"}
              className="w-full h-14 px-4 bg-gray-50 dark:bg-gray-900 rounded-2xl outline-none border-2 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-gray-400 font-medium transition-all"
            />
          </div>
        </div>

      </div>

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-white/90 dark:bg-surface-dark/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-20">
        <button
          onClick={handleSave}
          disabled={!amount || isScanning}
          className={`w-full h-14 rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-2
                ${!amount || isScanning ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-primary/40 active:scale-[0.98] hover:shadow-2xl'}`}
        >
          {isScanning ? (
            <>
              <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></span>
              <span>Taranıyor...</span>
            </>
          ) : (
            <>
              <span>İşlemi Kaydet</span>
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
