'use client';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  isDestructive = false,
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-2xl shadow-2xl overflow-hidden animate-[scaleIn_0.2s_ease-out]">
        <div className="p-5">
          <h3 className="text-lg font-bold mb-2">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
        </div>

        <div className="flex gap-3 p-5 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-white/5">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-11 rounded-xl font-semibold text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 h-11 rounded-xl font-semibold text-sm active:scale-95 transition disabled:opacity-70 ${
              isDestructive
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-primary text-[#102216] hover:bg-primary/90'
            }`}
          >
            {loading ? 'İşleniyor...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
