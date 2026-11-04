import React, { useState } from 'react';
import { Habit, HabitLog, StreakReset } from '../types/habit';
import { getLocalDateString } from '../lib/storage';
import { Calendar, Flame, Award, Filter, Info } from 'lucide-react';

interface StreakHeatmapProps {
  habits: Habit[];
  logs: HabitLog[];
  resets: StreakReset[];
}

export const StreakHeatmap: React.FC<StreakHeatmapProps> = ({ habits, logs, resets }) => {
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // 產生過去 84 天 (12 週) 的日期陣列
  const daysCount = 84;
  const today = new Date();
  const dateList: string[] = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    dateList.push(getLocalDateString(d));
  }

  // 建立日期 -> 當日活躍程度的計算
  const logsByDate = new Map<string, HabitLog[]>();
  logs.forEach((log) => {
    const existing = logsByDate.get(log.log_date) || [];
    existing.push(log);
    logsByDate.set(log.log_date, existing);
  });

  // 計算特定習慣或全習慣在某日的強度 (0 ~ 4)
  const getCellIntensity = (dateStr: string) => {
    const dayLogs = logsByDate.get(dateStr) || [];
    const cellDate = new Date(dateStr);

    if (selectedHabitId === 'all') {
      let count = 0;
      // 檢查跑步與重訓
      const hasRunning = dayLogs.some((l) => l.habit_id === 'running' && l.completed);
      const hasWorkout = dayLogs.some((l) => l.habit_id === 'workout' && l.completed);
      if (hasRunning) count += 1;
      if (hasWorkout) count += 1;

      // 檢查戒斷型：若當天在此習慣最新起始日之後且未破戒
      ['sober', 'smoke_free'].forEach((hid) => {
        const habitResets = resets
          .filter((r) => r.habit_id === hid)
          .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
        if (habitResets.length > 0) {
          const start = new Date(habitResets[0].start_date);
          start.setHours(0, 0, 0, 0);
          if (cellDate >= start && cellDate <= today) {
            count += 1;
          }
        }
      });

      return Math.min(4, count);
    } else {
      // 特定習慣
      const habit = habits.find((h) => h.id === selectedHabitId);
      if (!habit) return 0;

      if (habit.type === 'numeric') {
        const targetLog = dayLogs.find((l) => l.habit_id === selectedHabitId && l.completed);
        return targetLog ? 3 : 0;
      } else {
        // streak
        const habitResets = resets
          .filter((r) => r.habit_id === selectedHabitId)
          .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
        if (habitResets.length > 0) {
          const start = new Date(habitResets[0].start_date);
          start.setHours(0, 0, 0, 0);
          if (cellDate >= start && cellDate <= today) {
            return 3;
          }
        }
        return 0;
      }
    }
  };

  // 顏色級距樣式
  const getColorClass = (intensity: number) => {
    switch (intensity) {
      case 4:
        return 'bg-emerald-400 border-emerald-300 shadow-sm shadow-emerald-400/30';
      case 3:
        return 'bg-emerald-500 border-emerald-400';
      case 2:
        return 'bg-emerald-700/80 border-emerald-600/40';
      case 1:
        return 'bg-emerald-950 border-emerald-800/40';
      default:
        return 'bg-slate-900 border-slate-800/80';
    }
  };

  // 取得當日詳細提示
  const getDayDetails = (dateStr: string) => {
    const dayLogs = logsByDate.get(dateStr) || [];
    const cellDate = new Date(dateStr);
    const details: string[] = [];

    dayLogs.forEach((l) => {
      if (l.habit_id === 'running' && l.completed) {
        details.push(`🏃 跑步 ${l.value} km (配速 ${l.metrics?.pace || '--'})`);
      }
      if (l.habit_id === 'workout' && l.completed) {
        details.push(`🏋️ 重訓 ${l.value} 組`);
      }
    });

    ['sober', 'smoke_free'].forEach((hid) => {
      const h = habits.find((item) => item.id === hid);
      const habitResets = resets
        .filter((r) => r.habit_id === hid)
        .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
      if (habitResets.length > 0) {
        const start = new Date(habitResets[0].start_date);
        start.setHours(0, 0, 0, 0);
        if (cellDate >= start && cellDate <= today) {
          details.push(`✨ ${h?.name || hid} 堅持清醒`);
        }
      }
    });

    return details;
  };

  // 活躍天數統計
  let activeDays = 0;
  dateList.forEach((d) => {
    if (getCellIntensity(d) > 0) activeDays++;
  });
  const completionRate = Math.round((activeDays / daysCount) * 100);

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
      {/* 標題與過濾標籤 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            GitHub 風格習慣熱力圖 (Heatmap)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">過去 84 天 (12 週) 的習慣堅持軌跡</p>
        </div>

        {/* 過濾選擇器 */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedHabitId('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              selectedHabitId === 'all'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            全部習慣
          </button>
          {habits.map((h) => (
            <button
              key={h.id}
              onClick={() => setSelectedHabitId(h.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                selectedHabitId === h.id
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {h.name}
            </button>
          ))}
        </div>
      </div>

      {/* 數據概要 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <span className="text-[11px] text-slate-400">近12週打卡天數</span>
          <div className="text-xl font-extrabold text-white font-mono mt-0.5">
            {activeDays} <span className="text-xs font-normal text-slate-500">/ 84天</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <span className="text-[11px] text-slate-400">習慣執行率</span>
          <div className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">
            {completionRate}%
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <span className="text-[11px] text-slate-400">堅持狀態</span>
          <div className="text-xs font-bold text-amber-400 mt-1.5 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-amber-400/20" />
            動能充沛
          </div>
        </div>
      </div>

      {/* 熱力圖網格 (12 欄 x 7 列) */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-grid grid-flow-col grid-rows-7 gap-1.5 min-w-[500px]">
          {dateList.map((dateStr) => {
            const intensity = getCellIntensity(dateStr);
            const isToday = dateStr === getLocalDateString();

            return (
              <button
                key={dateStr}
                onClick={() => setHoveredDate(dateStr)}
                onMouseEnter={() => setHoveredDate(dateStr)}
                className={`w-4 h-4 rounded-sm border transition-transform hover:scale-125 focus:outline-none ${getColorClass(
                  intensity
                )} ${isToday ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-900' : ''}`}
                title={dateStr}
              />
            );
          })}
        </div>
      </div>

      {/* 圖例 Legend */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800">
        <span>較少</span>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-slate-900 border border-slate-800" />
          <span className="w-3 h-3 rounded-sm bg-emerald-950 border border-emerald-800/40" />
          <span className="w-3 h-3 rounded-sm bg-emerald-700/80 border border-emerald-600/40" />
          <span className="w-3 h-3 rounded-sm bg-emerald-500 border border-emerald-400" />
          <span className="w-3 h-3 rounded-sm bg-emerald-400 border border-emerald-300" />
        </div>
        <span>充實活躍</span>
      </div>

      {/* 日期懸停/點擊詳情浮動提示卡 */}
      {hoveredDate && (
        <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-white font-mono">{hoveredDate}</span>
            <button
              onClick={() => setHoveredDate(null)}
              className="text-[10px] text-slate-500 hover:text-slate-300"
            >
              關閉
            </button>
          </div>
          {getDayDetails(hoveredDate).length > 0 ? (
            <div className="space-y-1">
              {getDayDetails(hoveredDate).map((desc, idx) => (
                <div key={idx} className="text-xs text-emerald-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {desc}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">當日無打卡或記錄</p>
          )}
        </div>
      )}
    </div>
  );
};
