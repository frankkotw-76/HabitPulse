import React, { useState, useEffect, useCallback } from 'react';
import { Habit, HabitLog, StreakReset } from './types/habit';
import {
  getHabits,
  getLogs,
  getStreakResets,
  saveHabitLog,
  resetStreak,
  updateHabitCost,
  resetAllToCleanSlate,
  recordSmokingUrge,
  undoSmokingUrge,
  subscribeToRealtime,
  getLocalDateString,
  calculateStreak,
} from './lib/storage';
import { getSupabase } from './lib/supabase';
import { Header } from './components/Header';
import { HabitCard } from './components/HabitCard';
import { NumericLogModal } from './components/NumericLogModal';
import { ResetStreakModal } from './components/ResetStreakModal';
import { StreakHeatmap } from './components/StreakHeatmap';
import { MoneySavedBanner } from './components/MoneySavedBanner';
import { SettingsModal } from './components/SettingsModal';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import {
  Flame,
  Footprints,
  Dumbbell,
  DollarSign,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [resets, setResets] = useState<StreakReset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // 導覽狀態
  const [activeTab, setActiveTab] = useState<'today' | 'heatmap' | 'finance'>('today');

  // Modal 狀態
  const [numericModal, setNumericModal] = useState<{
    isOpen: boolean;
    habit: Habit | null;
    log?: HabitLog | null;
  }>({ isOpen: false, habit: null, log: null });

  const [resetModal, setResetModal] = useState<{
    isOpen: boolean;
    habit: Habit | null;
  }>({ isOpen: false, habit: null });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 載入資料
  const loadData = useCallback(async () => {
    try {
      const client = getSupabase();
      setIsSupabaseConnected(!!client);

      const [loadedHabits, loadedLogs, loadedResets] = await Promise.all([
        getHabits(),
        getLogs(),
        getStreakResets(),
      ]);

      setHabits(loadedHabits);
      setLogs(loadedLogs);
      setResets(loadedResets);
    } catch (e) {
      console.error('Failed to load HabitPulse data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // 訂閱即時跨裝置資料變更
    const unsubscribe = subscribeToRealtime(() => {
      loadData();
    });

    return () => {
      unsubscribe();
    };
  }, [loadData]);

  // 取得今日打卡紀錄
  const todayStr = getLocalDateString();
  const getTodayLog = (habitId: string) => {
    return logs.find((l) => l.habit_id === habitId && l.log_date === todayStr);
  };

  // 戒斷型習慣快速簽到 (不喝酒)
  const handleQuickStreakCheckin = async (habit: Habit) => {
    await saveHabitLog({
      habit_id: habit.id,
      log_date: todayStr,
      completed: true,
      value: 1,
      metrics: { checkinType: 'clean_day' },
      note: '今日保持清醒與自律',
    });
    await loadData();
  };

  // 儲存正向習慣打卡
  const handleSaveNumericLog = async (logData: Omit<HabitLog, 'id'> & { id?: string }) => {
    await saveHabitLog(logData);
    await loadData();
  };

  // 破戒重置
  const handleConfirmReset = async (habitId: string, reason: string) => {
    await resetStreak(habitId, reason);
    await loadData();
  };

  // 修改每日省下花費
  const handleUpdateHabitCost = async (habitId: string, cost: number) => {
    await updateHabitCost(habitId, cost);
    await loadData();
  };

  // 減害抗菸對決記錄
  const handleSmokingUrge = async (outcome: 'resisted' | 'smoked') => {
    await recordSmokingUrge(outcome);
    await loadData();
  };

  // 減害抗菸倒扣 (防誤點)
  const handleUndoSmokingUrge = async (outcome: 'resisted' | 'smoked') => {
    await undoSmokingUrge(outcome);
    await loadData();
  };

  // 清空為全新起點
  const handleResetAllData = async () => {
    await resetAllToCleanSlate();
    await loadData();
  };

  // 頂部統計指標計算
  const runningLogs = logs.filter((l) => l.habit_id === 'running' && l.completed);
  const totalKm = runningLogs.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

  const workoutLogs = logs.filter((l) => l.habit_id === 'workout' && l.completed);
  const totalSets = workoutLogs.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

  const soberStreak = calculateStreak('sober', resets);
  const soberCost = habits.find((h) => h.id === 'sober')?.cost_per_day || 250;
  const soberSaved = soberStreak.days * soberCost;

  const smokeLogs = logs.filter((l) => l.habit_id === 'smoke_free');
  const smokeCost = habits.find((h) => h.id === 'smoke_free')?.cost_per_day || 6.5;
  const totalResisted = smokeLogs.reduce((acc, l) => acc + (Number(l.metrics?.resisted) || 0), 0);
  const totalSmoked = smokeLogs.reduce((acc, l) => acc + (Number(l.metrics?.smoked) || 0), 0);
  const smokeSaved = Math.max(0, Math.round((totalResisted - totalSmoked) * smokeCost * 10) / 10);

  const totalMoneySaved = Math.round(soberSaved + smokeSaved);

  // 今日減害對抗快報
  const todaySmokeLog = getTodayLog('smoke_free');
  const todayResisted = Number(todaySmokeLog?.metrics?.resisted) || 0;
  const todaySmoked = Number(todaySmokeLog?.metrics?.smoked) || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16">
      {/* 頂部導覽列 */}
      <Header
        isSupabaseConnected={isSupabaseConnected}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* PWA 安裝提示 (iOS / Android) */}
      <div className="max-w-4xl mx-auto w-full">
        <PWAInstallPrompt />
      </div>

      {/* 主內容區 */}
      <main className="max-w-4xl mx-auto w-full px-4 pt-4 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
            <p className="text-sm">載入習慣脈動中...</p>
          </div>
        ) : (
          <>
            {/* Tab 1: 今日習慣總覽 */}
            {activeTab === 'today' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* 頂部激勵四格數據卡 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Footprints className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">累計跑量</div>
                      <div className="text-base font-extrabold text-white font-mono">
                        {totalKm.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">km</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">重訓總組數</div>
                      <div className="text-base font-extrabold text-white font-mono">
                        {totalSets} <span className="text-[10px] font-normal text-slate-400">組</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">今日抗菸戰報</div>
                      <div className="text-base font-extrabold text-white font-mono">
                        {todayResisted} <span className="text-[10px] font-normal text-emerald-400">勝</span> / {todaySmoked} <span className="text-[10px] font-normal text-slate-400">根</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">淨省下金額</div>
                      <div className="text-base font-extrabold text-emerald-400 font-mono">
                        ${totalMoneySaved.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4 個核心習慣卡片 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {habits.map((habit) => {
                    const todayLog = getTodayLog(habit.id);
                    const streakInfo =
                      habit.type === 'streak' ? calculateStreak(habit.id, resets) : undefined;

                    return (
                      <HabitCard
                        key={habit.id}
                        habit={habit}
                        todayLog={todayLog}
                        resets={resets}
                        streakDays={streakInfo?.days}
                        startDate={streakInfo?.startDate}
                        onOpenLogModal={(h, log) =>
                          setNumericModal({ isOpen: true, habit: h, log })
                        }
                        onOpenResetModal={(h) => setResetModal({ isOpen: true, habit: h })}
                        onQuickStreakCheckin={handleQuickStreakCheckin}
                        onUpdateCost={handleUpdateHabitCost}
                        onSmokingUrge={handleSmokingUrge}
                        onUndoSmokingUrge={handleUndoSmokingUrge}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: 習慣熱力圖 */}
            {activeTab === 'heatmap' && (
              <div className="animate-in fade-in duration-200">
                <StreakHeatmap habits={habits} logs={logs} resets={resets} />
              </div>
            )}

            {/* Tab 3: 省錢里程碑 */}
            {activeTab === 'finance' && (
              <div className="animate-in fade-in duration-200">
                <MoneySavedBanner habits={habits} logs={logs} resets={resets} />
              </div>
            )}
          </>
        )}
      </main>

      {/* 數值記錄 Modal (跑步 / 重訓) */}
      <NumericLogModal
        habit={numericModal.habit}
        existingLog={numericModal.log}
        isOpen={numericModal.isOpen}
        onClose={() => setNumericModal({ isOpen: false, habit: null, log: null })}
        onSave={handleSaveNumericLog}
      />

      {/* 戒斷破戒重置 Modal (不喝酒) */}
      <ResetStreakModal
        habit={resetModal.habit}
        isOpen={resetModal.isOpen}
        onClose={() => setResetModal({ isOpen: false, habit: null })}
        onConfirmReset={handleConfirmReset}
      />

      {/* 系統設定 Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        habits={habits}
        onUpdateCost={handleUpdateHabitCost}
        onResetAllData={handleResetAllData}
        onRefreshData={loadData}
      />
    </div>
  );
}

export default App;
