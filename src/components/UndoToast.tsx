import React, { useEffect, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';

export interface ToastData {
  id: string;
  message: string;
  onUndo: () => void;
}

interface UndoToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({ toast, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast) return;

    setProgress(100);
    const duration = 5000;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-medium text-slate-100 flex-1 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-ping" />
          <span className="truncate">{toast.message}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              toast.onUndo();
              onClose();
            }}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1 transition-colors border border-emerald-500/30 active:scale-95"
          >
            <RotateCcw className="w-3 h-3" />
            復原
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 倒數進度條 */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800">
          <div
            className="h-full bg-emerald-400 transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
