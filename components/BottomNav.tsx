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
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1c2e22] border-t border-gray-200 dark:border-gray-800 pb-safe pt-2 px-6 flex justify-between items-center z-50 h-[80px]">
      <Link href="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-primary' : 'text-gray-400'}`}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${isActive('/') ? 1 : 0}` }}>home</span>
        <span className="text-xs font-medium">Ana Sayfa</span>
      </Link>

      <Link href="/add-transaction" className="flex flex-col items-center justify-center -mt-8">
         <div className="h-16 w-16 bg-primary rounded-full shadow-lg flex items-center justify-center text-background-dark transform transition-transform active:scale-95">
            <span className="material-symbols-outlined text-3xl">add</span>
         </div>
      </Link>

      <Link href="/categories" className={`flex flex-col items-center gap-1 ${isActive('/categories') ? 'text-primary' : 'text-gray-400'}`}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${isActive('/categories') ? 1 : 0}` }}>pie_chart</span>
        <span className="text-xs font-medium">Bütçe</span>
      </Link>
    </div>
  );
};

export default BottomNav;
