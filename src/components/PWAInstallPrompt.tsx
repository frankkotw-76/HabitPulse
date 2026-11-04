import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 檢查是否為 iOS Safari
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

    if (isIOS && !isStandalone) {
      const dismissed = localStorage.getItem('habitpulse_pwa_dismissed');
      if (!dismissed) {
        setShowIOSPrompt(true);
      }
    }

    // Android / Chrome PWA 事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowIOSPrompt(false);
    localStorage.setItem('habitpulse_pwa_dismissed', 'true');
  };

  if (isDismissed) return null;

  // Android / Desktop Chrome 安裝橫幅
  if (deferredPrompt) {
    return (
      <div className="bg-emerald-950/80 border border-emerald-500/30 rounded-2xl p-3.5 mx-4 mt-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">安裝 HabitPulse PWA</h4>
            <p className="text-[11px] text-slate-300">加入主畫面，享受全螢幕秒開與離線支援！</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all"
          >
            立即安裝
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // iOS Safari 安裝指引
  if (showIOSPrompt) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 mx-4 mt-3 flex items-start justify-between shadow-lg text-xs">
        <div className="space-y-1">
          <div className="font-bold text-white flex items-center gap-1.5">
            <PlusSquare className="w-4 h-4 text-emerald-400" />
            將 HabitPulse 加入 iPhone 主畫面
          </div>
          <p className="text-slate-400 text-[11px]">
            點擊 Safari 底部的分享按鈕 <Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-400" />，向下滑動並選擇「<strong>加入主畫面</strong>」，即可如同原生 App 全螢幕使用！
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 text-slate-400 hover:text-white shrink-0 ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return null;
};
