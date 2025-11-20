import React, { useState } from 'react';
import { getCategories, addCategory } from '../services/storageService';
import { TransactionType, Category } from '../types';
import { useNavigate } from 'react-router-dom';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(getCategories());
  const [activeTab, setActiveTab] = useState<TransactionType>(TransactionType.EXPENSE);
  const navigate = useNavigate();

  const filteredCategories = categories.filter(c => c.type === activeTab);

  const handleAddCategory = () => {
    const name = window.prompt("Yeni kategori adı girin:");
    if (!name) return;
    
    const budgetStr = window.prompt("Aylık bütçe limiti (Sadece sayı girin, opsiyonel):", "0");
    const budget = budgetStr ? parseFloat(budgetStr) : 0;

    const newCategory: Category = {
        id: Date.now().toString(),
        name: name,
        icon: 'category', // Default generic icon
        type: activeTab,
        budgetLimit: budget,
        currentSpent: 0,
        color: 'bg-gray-100 text-gray-700' // Default color
    };
    
    addCategory(newCategory);
    setCategories(getCategories()); // Refresh list
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
        <header className="sticky top-0 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur z-10">
            <div className="flex items-center p-4 justify-between">
                <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                     <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold">Kategorileri Yönet</h1>
                <div className="w-10"></div>
            </div>
            
            <div className="flex border-b border-gray-200 dark:border-white/10">
                <button 
                    onClick={() => setActiveTab(TransactionType.EXPENSE)}
                    className={`flex-1 pb-3 font-bold text-sm transition-colors relative ${activeTab === TransactionType.EXPENSE ? 'text-primary' : 'text-gray-500'}`}
                >
                    Giderler
                    {activeTab === TransactionType.EXPENSE && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab(TransactionType.INCOME)}
                    className={`flex-1 pb-3 font-bold text-sm transition-colors relative ${activeTab === TransactionType.INCOME ? 'text-primary' : 'text-gray-500'}`}
                >
                    Gelirler
                    {activeTab === TransactionType.INCOME && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full"></div>}
                </button>
            </div>
        </header>

        <div className="p-4 space-y-4">
            {/* Search */}
            <div className="bg-gray-100 dark:bg-surface-dark rounded-xl flex items-center h-12 px-4 gap-2">
                <span className="material-symbols-outlined text-gray-500">search</span>
                <input type="text" placeholder="Kategorilerde ara..." className="bg-transparent flex-1 outline-none text-sm" />
            </div>

            {/* List */}
            <div className="space-y-3">
                {filteredCategories.map(category => (
                    <div key={category.id} className="flex items-center gap-4 p-4 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-50 dark:border-white/5">
                        <div className={`size-12 rounded-xl flex items-center justify-center ${category.type === TransactionType.EXPENSE ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                            <span className="material-symbols-outlined">{category.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between mb-1">
                                <h3 className="font-bold truncate">{category.name}</h3>
                                {category.budgetLimit ? (
                                    <span className="text-xs font-medium text-gray-500">
                                        ₺{category.currentSpent} / ₺{category.budgetLimit}
                                    </span>
                                ) : null}
                            </div>
                            {category.budgetLimit ? (
                                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${category.currentSpent && category.currentSpent > category.budgetLimit ? 'bg-red-500' : 'bg-primary'}`} 
                                        style={{ width: `${Math.min(100, ((category.currentSpent || 0) / category.budgetLimit) * 100)}%` }}
                                    ></div>
                                </div>
                            ) : null}
                        </div>
                        <button className="text-gray-400">
                            <span className="material-symbols-outlined">more_vert</span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
        
        <div className="fixed bottom-24 right-6">
             <button 
                onClick={handleAddCategory}
                className="h-14 w-14 bg-primary text-[#102216] rounded-full shadow-lg shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform"
             >
                <span className="material-symbols-outlined text-3xl">add</span>
             </button>
        </div>
    </div>
  );
};

export default Categories;