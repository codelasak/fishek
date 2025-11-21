'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type = 'success',
  isOpen,
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const styles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800',
  };

  const icons = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-[60] flex justify-center pointer-events-none">
      <div className={`${styles[type]} rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-3 max-w-sm animate-[slideDown_0.3s_ease-out] pointer-events-auto`}>
        <span className="material-symbols-outlined">{icons[type]}</span>
        <p className="text-sm font-semibold flex-1">{message}</p>
        <button onClick={onClose} className="opacity-70 hover:opacity-100 active:scale-90 transition">
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </div>
  );
}
