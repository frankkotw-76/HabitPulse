import React, { useState, useEffect, useCallback } from 'react';
import { Habit, HabitLog, StreakReset } from './types/habit';
import {
  getHabits,
  getLogs,
  getStreakResets,
  saveHabitLog,
  deleteHabitLog,
  resetStreak,
  updateHabitCost,
  resetAllToCleanSlate,
  recordUrge,
  undoUrge,
  updateUrgeLog,
  subscribeToRealtime,
  getLocalDateString,
  calculateStreak,
} from './lib/storage';
import { getSupabase } from './lib/supabase';
import { Header, TabType } from './components/Header';
import { HabitCard } from './components/HabitCard';
import { NumericLogModal } from './components/NumericLogModal';
import { ResetStreakModal } from './components/ResetStreakModal';
import { StreakHeatmap } from './components/StreakHeatmap';
import { MoneySavedBanner } from './components/MoneySavedBanner';
import { SettingsModal } from './components/SettingsModal';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { HistoryTimeline } from './components/HistoryTimeline';
import { UndoToast, ToastData } from './components/UndoToast';
import { UrgeEditModal } from './components/UrgeEditModal';
import {
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
  const [activeTab, setActiveTab] = useState<TabType>('today');

  // 即時 5 秒防誤按 Toast
  const [undoToast, setUndoToast] = useState<ToastData | null>(null);

  // Modal 狀態
  const [numericModal, setNumericModal] = useState<{
    isOpen: boolean;
    habit: Habit | null;
    log?: HabitLog | null;
  }>({ isOpen: false, habit: null, log: null });

  const [urgeEditModal, setUrgeEditModal] = useState<{
    isOpen: boolean;
    habit: Habit | null;
    log: HabitLog | null;
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

  // 快速簽到
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

  // 刪除指定習慣紀錄 (歷史時間軸中呼叫)
  const handleDeleteLog = async (habitId: string, logDate: string) => {
    await deleteHabitLog(habitId, logDate);
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

  // 衝動對決記錄 (抗酒或抗菸) + 觸發 5 秒防誤按 Toast
  const handleUrgeAction = async (habitId: string, outcome: 'resisted' | 'consumed') => {
    await recordUrge(habitId as 'sober' | 'smoke_free', outcome);
    await loadData();

    const habit = habits.find((h) => h.id === habitId);
    const unitCost = habit?.cost_per_day ?? (habitId === 'sober' ? 50 : 6.5);
    const isAlcohol = habitId === 'sober';

    let msg = '';
    if (outcome === 'resisted') {
      msg = isAlcohol
        ? `已記錄少喝一瓶 💪 (+NT$${unitCost})`
        : `已記錄抗菸成功 💪 (+NT$${unitCost})`;
    } else {
      msg = isAlcohol
        ? `已記錄喝了一瓶 🍺 (-NT$${unitCost})`
        : `已記錄抽了一根 🚬 (-NT$${unitCost})`;
    }

    setUndoToast({
      id: crypto.randomUUID(),
      message: msg,
      onUndo: () => handleUndoUrgeAction(habitId, outcome),
    });
  };

  // 衝動對決倒扣 (防誤點)
  const handleUndoUrgeAction = async (habitId: string, outcome: 'resisted' | 'consumed') => {
    await undoUrge(habitId as 'sober' | 'smoke_free', outcome);
    await loadData();
  };

  // 歷史紀錄中修改抗酒/抗菸次數
  const handleSaveUrgeEdit = async (
    habitId: 'sober' | 'smoke_free',
    logDate: string,
    resisted: number,
    consumed: number
  ) => {
    await updateUrgeLog(habitId, logDate, resisted, consumed);
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

  // 節制抗酒累計
  const soberLogs = logs.filter((l) => l.habit_id === 'sober');
  const soberCost = habits.find((h) => h.id === 'sober')?.cost_per_day ?? 50;
  const totalResistedSober = soberLogs.reduce((acc, l) => acc + (Number(l.metrics?.resisted) || 0), 0);
  const totalConsumedSober = soberLogs.reduce((acc, l) => acc + (Number(l.metrics?.consumed) || 0), 0);
  const soberSaved = Math.max(0, Math.round((totalResistedSober - totalConsumedSober) * soberCost * 10) / 10);

  // 減害抗菸累計
  const smokeLogs = logs.filter((l) => l.habit_id === 'smoke_free');
  const smokeCost = habits.find((h) => h.id === 'smoke_free')?.cost_per_day ?? 6.5;
  const totalResistedSmoke = smokeLogs.reduce((acc, l) => acc + (Number(l.metrics?.resisted) || 0), 0);
  const totalConsumedSmoke = smokeLogs.reduce((acc, l) => acc + (Number(l.metrics?.consumed ?? l.metrics?.smoked) || 0), 0);
  const smokeSaved = Math.max(0, Math.round((totalResistedSmoke - totalConsumedSmoke) * smokeCost * 10) / 10);

  const totalMoneySaved = Math.round(soberSaved + smokeSaved);

  // 今日減害對抗快報
  const todaySoberLog = getTodayLog('sober');
  const todaySoberResisted = Number(todaySoberLog?.metrics?.resisted) || 0;
  const todaySoberConsumed = Number(todaySoberLog?.metrics?.consumed) || 0;

  const todaySmokeLog = getTodayLog('smoke_free');
  const todaySmokeResisted = Number(todaySmokeLog?.metrics?.resisted) || 0;
  const todaySmokeConsumed = Number(todaySmokeLog?.metrics?.consumed ?? todaySmokeLog?.metrics?.smoked) || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-[calc(4rem+env(safe-area-inset-bottom,0px))]">
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
            {/* Tab 1: 今日打卡總覽 */}
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
                      <div className="text-[11px] text-slate-400">今日對抗戰報</div>
                      <div className="text-xs font-bold text-white font-mono mt-0.5">
                        酒 {todaySoberResisted}勝/{todaySoberConsumed}瓶 ｜ 菸 {todaySmokeResisted}勝/{todaySmokeConsumed}根
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
                        onUrgeAction={handleUrgeAction}
                        onUndoUrgeAction={handleUndoUrgeAction}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: 歷史紀錄 (時間軸可修改/刪除) */}
            {activeTab === 'history' && (
              <div className="animate-in fade-in duration-200">
                <HistoryTimeline
                  habits={habits}
                  logs={logs}
                  onEditNumeric={(habit, log) =>
                    setNumericModal({ isOpen: true, habit, log })
                  }
                  onEditUrge={(habit, log) =>
                    setUrgeEditModal({ isOpen: true, habit, log })
                  }
                  onDeleteLog={handleDeleteLog}
                />
              </div>
            )}

            {/* Tab 3: 習慣熱力圖 */}
            {activeTab === 'heatmap' && (
              <div className="animate-in fade-in duration-200">
                <StreakHeatmap habits={habits} logs={logs} resets={resets} />
              </div>
            )}

            {/* Tab 4: 省錢里程碑 */}
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

      {/* 衝動對抗紀錄修改 Modal (抗酒 / 抗菸) */}
      <UrgeEditModal
        habit={urgeEditModal.habit}
        log={urgeEditModal.log}
        isOpen={urgeEditModal.isOpen}
        onClose={() => setUrgeEditModal({ isOpen: false, habit: null, log: null })}
        onSave={handleSaveUrgeEdit}
        onDelete={handleDeleteLog}
      />

      {/* 戒斷破戒重置 Modal */}
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

      {/* 即時 5 秒防誤觸 Undo Toast */}
      <UndoToast toast={undoToast} onClose={() => setUndoToast(null)} />
    </div>
  );
}

export default App;
