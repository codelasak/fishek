'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/add-transaction' ||
    pathname?.startsWith('/transaction/')
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-[#1c2e22]/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 pb-safe pt-2 px-6 flex justify-between items-center z-50 h-[80px] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.3)]">
      <Link 
        href="/" 
        className={`flex flex-col items-center gap-1 transition-all active:scale-95 ${isActive('/') ? 'text-primary' : 'text-gray-400'}`}
      >
        <span 
          className="material-symbols-outlined text-[28px]" 
          style={{ fontVariationSettings: `'FILL' ${isActive('/') ? 1 : 0}` }}
        >
          home
        </span>
        <span className="text-xs font-semibold">Ana Sayfa</span>
      </Link>

      <Link href="/add-transaction" className="flex flex-col items-center justify-center -mt-10">
         <div className="h-16 w-16 bg-gradient-to-br from-primary to-primary/90 rounded-full shadow-xl shadow-primary/30 flex items-center justify-center text-[#102216] transform transition-all active:scale-95 hover:shadow-2xl hover:shadow-primary/40">
            <span className="material-symbols-outlined text-[32px] font-light">add</span>
         </div>
      </Link>

      <Link 
        href="/categories" 
        className={`flex flex-col items-center gap-1 transition-all active:scale-95 ${isActive('/categories') ? 'text-primary' : 'text-gray-400'}`}
      >
        <span 
          className="material-symbols-outlined text-[28px]" 
          style={{ fontVariationSettings: `'FILL' ${isActive('/categories') ? 1 : 0}` }}
        >
          pie_chart
        </span>
        <span className="text-xs font-semibold">Bütçe</span>
      </Link>
    </div>
  );
};

export default BottomNav;
