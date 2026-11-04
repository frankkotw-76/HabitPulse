import React, { useState } from 'react';
import { Habit, HabitLog, StreakReset } from '../types/habit';
import { IconRenderer } from './IconRenderer';
import {
  Flame,
  CheckCircle2,
  AlertCircle,
  History,
  TrendingUp,
  DollarSign,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Award,
} from 'lucide-react';
import { triggerCelebration, triggerStreakMilestone } from '../lib/confetti';

interface HabitCardProps {
  habit: Habit;
  todayLog?: HabitLog;
  resets: StreakReset[];
  streakDays?: number;
  startDate?: Date;
  onOpenLogModal: (habit: Habit, existingLog?: HabitLog) => void;
  onOpenResetModal: (habit: Habit) => void;
  onQuickStreakCheckin: (habit: Habit) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  todayLog,
  resets,
  streakDays = 0,
  startDate,
  onOpenLogModal,
  onOpenResetModal,
  onQuickStreakCheckin,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const isStreak = habit.type === 'streak';
  const isLoggedToday = !!todayLog && todayLog.completed;

  // 戒斷型里程碑階級
  const getMilestone = (days: number) => {
    if (days >= 365) return { title: '重生大師', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' };
    if (days >= 180) return { title: '半載奇蹟', color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' };
    if (days >= 90) return { title: '蛻變大師', color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30' };
    if (days >= 30) return { title: '堅定破局', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' };
    if (days >= 14) return { title: '自律成習', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' };
    if (days >= 7) return { title: '破土萌芽', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' };
    return { title: '啟程起步', color: 'text-slate-400 bg-slate-400/10 border-slate-400/30' };
  };

  const milestone = getMilestone(streakDays);
  const moneySaved = isStreak ? streakDays * (habit.cost_per_day || 0) : 0;
  const habitResets = resets.filter(r => r.habit_id === habit.id && r.reset_date !== null);

  const handleStreakCheckin = () => {
    if (!isLoggedToday) {
      triggerStreakMilestone(streakDays + 1);
      onQuickStreakCheckin(habit);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 shadow-xl transition-all duration-300 hover:border-slate-700">
      {/* 頂部裝飾光暈 */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          isStreak
            ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500'
            : habit.id === 'running'
            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
            : 'bg-gradient-to-r from-blue-500 to-cyan-400'
        }`}
      />

      <div className="p-5">
        {/* 卡片標題列 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner ${
                isStreak
                  ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                  : habit.id === 'running'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
              }`}
            >
              <IconRenderer name={habit.icon} className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white tracking-tight">{habit.name}</h3>
                {isStreak && (
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${milestone.color}`}>
                    {milestone.title}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isStreak
                  ? startDate
                    ? `起算於 ${new Intl.DateTimeFormat('zh-TW', { month: 'numeric', day: 'numeric' }).format(startDate)}`
                    : '每日自律戒斷'
                  : habit.id === 'running'
                  ? '正向計量 · 記錄距離與配速'
                  : '正向計量 · 記錄課表與組數'}
              </p>
            </div>
          </div>

          {/* 右上角打卡狀態標記 */}
          <div>
            {isLoggedToday ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                <CheckCircle2 className="w-3.5 h-3.5" />
                今日已簽到
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                今日待記錄
              </span>
            )}
          </div>
        </div>

        {/* 核心數據區塊 */}
        {isStreak ? (
          <div className="my-4">
            <div className="grid grid-cols-2 gap-3">
              {/* 連勝天數 */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-orange-400 mb-1">
                  <Flame className="w-4 h-4 fill-orange-400/20 animate-pulse" />
                  連續堅持
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white tracking-tight font-mono">{streakDays}</span>
                  <span className="text-xs font-medium text-slate-400">天</span>
                </div>
              </div>

              {/* 累計省下金額 */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 mb-1">
                  <DollarSign className="w-4 h-4" />
                  已省下金額
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-emerald-400 tracking-tight font-mono">
                    NT$ {moneySaved.toLocaleString()}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">每日約省 NT$ {habit.cost_per_day}</div>
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleStreakCheckin}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                  isLoggedToday
                    ? 'bg-slate-800 text-slate-300 border border-slate-700/80'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 active:scale-[0.98]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isLoggedToday ? '今日已打卡' : '今日未破戒 (簽到)'}
              </button>

              <button
                onClick={() => onOpenResetModal(habit)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all active:scale-[0.98]"
                title="若今日不慎破戒，記錄原因重新開始"
              >
                <AlertCircle className="w-4 h-4" />
                破戒重置
              </button>
            </div>
          </div>
        ) : (
          /* 正向計量型習慣 (跑步/重訓) */
          <div className="my-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              {todayLog && todayLog.completed ? (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400 font-medium">今日訓練成績</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
                        {todayLog.value}
                      </span>
                      <span className="text-sm font-semibold text-emerald-400">{habit.unit}</span>
                    </div>
                  </div>

                  {/* 附加細節 (配速、時間或重訓課表) */}
                  {habit.id === 'running' && todayLog.metrics && (
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-300">
                      <div>
                        時間: <span className="font-semibold text-white">{todayLog.metrics.duration || '--'}</span> 分鐘
                      </div>
                      <div>
                        平均配速: <span className="font-semibold text-emerald-400">{todayLog.metrics.pace || '--'}</span> /km
                      </div>
                    </div>
                  )}

                  {habit.id === 'workout' && todayLog.metrics && todayLog.metrics.exercises && (
                    <div className="pt-2 border-t border-slate-800/60">
                      <div className="text-xs text-slate-400 mb-1">今日課表項目:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {todayLog.metrics.exercises.map((ex: any, idx: number) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/60"
                          >
                            {ex.name} ({ex.weight}kg × {ex.sets}組)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {todayLog.note && (
                    <p className="text-xs italic text-slate-400 pt-1">
                      "{todayLog.note}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-slate-400 mb-1">今天尚未記錄運動數據</p>
                  <p className="text-xs text-slate-500">
                    {habit.id === 'running' ? '維持有氧心肺與節奏' : '鍛鍊肌力力量與線條'}
                  </p>
                </div>
              )}
            </div>

            {/* 打卡/編輯按鈕 */}
            <div className="mt-3">
              <button
                onClick={() => onOpenLogModal(habit, todayLog)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4" />
                {todayLog && todayLog.completed ? '編輯今日紀錄' : `記錄${habit.name}`}
              </button>
            </div>
          </div>
        )}

        {/* 歷史重置展開區 (僅限戒斷型且有重置紀錄時) */}
        {isStreak && habitResets.length > 0 && (
          <div className="pt-3 border-t border-slate-800/80">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-300"
            >
              <span className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                破戒與重置歷史紀錄 ({habitResets.length})
              </span>
              {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showHistory && (
              <div className="mt-2.5 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {habitResets.map((r) => (
                  <div
                    key={r.id}
                    className="p-2 rounded-lg bg-slate-950/40 border border-slate-800 text-[11px] text-slate-300 flex justify-between items-start"
                  >
                    <div>
                      <span className="text-slate-400 font-mono">
                        {new Intl.DateTimeFormat('zh-TW', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        }).format(new Date(r.reset_date || r.start_date))}
                      </span>
                      <p className="text-rose-300 mt-0.5">誘發原因：{r.trigger_reason || '無備註'}</p>
                    </div>
                    <span className="text-slate-500 text-[10px]">重啟挑戰</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
