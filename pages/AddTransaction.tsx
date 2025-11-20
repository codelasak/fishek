import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories, saveTransaction } from '../services/storageService';
import { scanReceipt } from '../services/geminiService';
import { TransactionType } from '../types';

const AddTransaction: React.FC = () => {
  const navigate = useNavigate();
  const categories = getCategories();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    // Set default category
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

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

  const handleSave = () => {
    if (!amount || isNaN(parseFloat(amount))) return;

    saveTransaction({
      id: Date.now().toString(),
      amount: parseFloat(amount),
      description: description || (type === TransactionType.INCOME ? 'Gelir' : 'Gider'),
      date,
      categoryId,
      type,
      receiptImage: receiptImage || undefined,
      createdAt: Date.now()
    });

    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
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

      <div className="flex-1 px-4 pb-24 overflow-y-auto">
        
        {scanError && (
            <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-200 text-sm">
                {scanError}
            </div>
        )}

        {/* Type Segment Control */}
        <div className="flex p-1 bg-gray-200 dark:bg-surface-dark rounded-xl mb-6">
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
        <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-400">Tutar</label>
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
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
            <div>
                <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-400">Kategori</label>
                <div className="relative">
                    <select 
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full h-14 pl-4 pr-10 appearance-none bg-gray-100 dark:bg-surface-dark rounded-xl outline-none border-none focus:ring-2 focus:ring-primary/50"
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
                    <input 
                        type="date" 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full h-14 pl-4 pr-10 bg-gray-100 dark:bg-surface-dark rounded-xl outline-none border-none focus:ring-2 focus:ring-primary/50"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <span className="material-symbols-outlined">calendar_today</span>
                    </span>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-400">Açıklama</label>
                <input 
                    type="text" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={type === TransactionType.EXPENSE ? "Örn: Akşam yemeği" : "Örn: Freelance iş"}
                    className="w-full h-14 px-4 bg-gray-100 dark:bg-surface-dark rounded-xl outline-none border-none focus:ring-2 focus:ring-primary/50 placeholder:text-gray-400"
                />
            </div>
        </div>

        {/* Receipt Preview */}
        {receiptImage && (
             <div className="mt-6">
                <p className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-400">Eklenen Fiş</p>
                <div className="relative h-40 w-full rounded-xl overflow-hidden group bg-black">
                    <img src={receiptImage} alt="Receipt" className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
                    <button 
                        onClick={() => setReceiptImage(null)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            </div>
        )}

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
};

export default AddTransaction;
