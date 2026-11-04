import React from 'react';
import { Settings, Zap, Wifi, WifiOff } from 'lucide-react';

export type TabType = 'today' | 'history' | 'heatmap' | 'finance';

interface HeaderProps {
  isSupabaseConnected: boolean;
  onOpenSettings: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isSupabaseConnected,
  onOpenSettings,
  activeTab,
  setActiveTab,
}) => {
  const todayFormatted = new Intl.DateTimeFormat('zh-TW', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                HabitPulse
              </h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PWA
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">{todayFormatted}</p>
          </div>
        </div>

        {/* Sync Status & Settings Button */}
        <div className="flex items-center gap-2">
          {/* Status Pill */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              isSupabaseConnected
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/40'
                : 'bg-amber-950/40 text-amber-400 border-amber-500/30 hover:bg-amber-900/40'
            }`}
            title={isSupabaseConnected ? '已連線至 Supabase Realtime' : '目前使用本機離線模式，點此設定 Supabase'}
          >
            {isSupabaseConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="hidden sm:inline">即時同步中</span>
                <Wifi className="w-3.5 h-3.5 sm:hidden" />
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                <span className="hidden sm:inline">離線模式</span>
                <WifiOff className="w-3.5 h-3.5 sm:hidden" />
              </>
            )}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-colors"
            aria-label="開啟設定"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-2 sm:px-4 flex border-t border-slate-800/60">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-all ${
            activeTab === 'today'
              ? 'text-emerald-400 border-emerald-400'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          今日打卡
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-all ${
            activeTab === 'history'
              ? 'text-emerald-400 border-emerald-400'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          歷史紀錄
        </button>
        <button
          onClick={() => setActiveTab('heatmap')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-all ${
            activeTab === 'heatmap'
              ? 'text-emerald-400 border-emerald-400'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          習慣熱力圖
        </button>
        <button
          onClick={() => setActiveTab('finance')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-all ${
            activeTab === 'finance'
              ? 'text-emerald-400 border-emerald-400'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          省錢里程碑
        </button>
      </div>
    </header>
  );
};
