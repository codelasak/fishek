'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { categoriesApi, transactionsApi } from '@/services/apiClient';
import { scanReceipt } from '@/services/geminiService';
import { TransactionType, Category } from '@/types';

const quickAmounts = [50, 100, 250, 500];

export default function AddTransaction() {
  const router = useRouter();
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
        const categoriesData = await categoriesApi.getAll();
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
  }, []);

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

      router.push('/');
    } catch (error) {
      console.error('Error saving transaction:', error);
      setScanError('İşlem kaydedilemedi. Lütfen tekrar deneyin.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur z-10">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">Yeni İşlem Ekle</h1>
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`p-2 -mr-2 rounded-full ${isScanning ? 'animate-pulse text-primary' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
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

      <div className="flex-1 px-4 pb-24 overflow-y-auto space-y-5">
        {scanError && (
          <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 text-sm border border-red-200 dark:border-red-800">
            {scanError}
          </div>
        )}

        {/* Scan Card */}
        <div className="rounded-2xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <div>
              <p className="text-sm font-semibold">Fiş Tara</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tutar, tarih ve kategori otomatik dolsun.</p>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="w-full h-14 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-sm font-semibold flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition disabled:opacity-70"
          >
            <span className="material-symbols-outlined text-base">{isScanning ? 'hourglass_top' : 'camera'}</span>
            {isScanning ? 'Taranıyor...' : 'Kamera veya galeriden fiş ekle'}
          </button>
          {receiptImage && (
            <div className="mt-4 relative h-36 w-full rounded-xl overflow-hidden">
              <img src={receiptImage} alt="Receipt" className="w-full h-full object-cover" />
              <button
                onClick={() => setReceiptImage(null)}
                className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}
        </div>

        {/* Type Segment Control */}
        <div className="flex p-1 bg-gray-200 dark:bg-surface-dark rounded-xl">
          <button
            onClick={() => setType(TransactionType.EXPENSE)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === TransactionType.EXPENSE ? 'bg-white dark:bg-[#2a3b30] shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}
          >
            Gider
          </button>
          <button
            onClick={() => setType(TransactionType.INCOME)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === TransactionType.INCOME ? 'bg-white dark:bg-[#2a3b30] shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}
          >
            Gelir
          </button>
        </div>

        {/* Amount Input */}
        <div className="rounded-2xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">Tutar</label>
            <span className="text-xs text-gray-500">TRY</span>
          </div>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`w-full h-20 bg-transparent text-5xl font-bold text-center outline-none placeholder:text-gray-300 dark:placeholder:text-gray-700 ${type === TransactionType.EXPENSE ? 'text-red-500' : 'text-primary'}`}
            />
            <span className={`absolute top-1/2 -translate-y-1/2 right-4 text-2xl font-medium text-gray-400 ${!amount && 'opacity-0'}`}>₺</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val.toString())}
                className="px-3 py-2 rounded-full text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-primary/10 hover:text-primary transition"
              >
                ₺{val}
              </button>
            ))}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-5 rounded-2xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-400">Kategori</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <span className="material-symbols-outlined text-lg">category</span>
              </span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-14 pl-12 pr-10 appearance-none bg-gray-100 dark:bg-gray-800 rounded-xl outline-none border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/50"
              >
                {categories.filter(c => c.type === type).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <span className="material-symbols-outlined">arrow_drop_down</span>
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-400">Tarih</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                <span className="material-symbols-outlined text-lg">event</span>
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/50 hide-calendar-icon appearance-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-400">Açıklama</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === TransactionType.EXPENSE ? "Örn: Akşam yemeği" : "Örn: Freelance iş"}
              className="w-full h-14 px-4 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/50 placeholder:text-gray-400"
            />
          </div>
        </div>

      </div>

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-light dark:bg-background-dark border-t border-gray-200 dark:border-gray-800 z-20">
        <button
          onClick={handleSave}
          disabled={!amount || isScanning}
          className={`w-full h-14 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2
                ${!amount || isScanning ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-primary text-[#102216] shadow-primary/30 active:scale-[0.98]'}`}
        >
          {isScanning ? (
            <>
              <span className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></span>
              Taranıyor...
            </>
          ) : 'İşlemi Kaydet'}
        </button>
      </div>
    </div>
  );
}
