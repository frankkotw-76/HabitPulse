import React from 'react';
import { Habit, HabitLog } from '../types/habit';
import { IconRenderer } from './IconRenderer';
import {
  Calendar,
  Edit2,
  Trash2,
  Footprints,
  Dumbbell,
  Wine,
  Cigarette,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { getLocalDateString } from '../lib/storage';

interface HistoryTimelineProps {
  habits: Habit[];
  logs: HabitLog[];
  onEditNumeric: (habit: Habit, log: HabitLog) => void;
  onEditUrge: (habit: Habit, log: HabitLog) => void;
  onDeleteLog: (habitId: string, logDate: string) => Promise<void>;
}

export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({
  habits,
  logs,
  onEditNumeric,
  onEditUrge,
  onDeleteLog,
}) => {
  const todayStr = getLocalDateString();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterdayDate);

  // 依日期分組
  const groupedByDate: { [date: string]: HabitLog[] } = {};
  logs.forEach((log) => {
    if (!groupedByDate[log.log_date]) {
      groupedByDate[log.log_date] = [];
    }
    groupedByDate[log.log_date].push(log);
  });

  // 日期排序（由新到舊）
  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const formatDateLabel = (dateStr: string) => {
    if (dateStr === todayStr) return '今天 · ' + dateStr;
    if (dateStr === yesterdayStr) return '昨天 · ' + dateStr;
    const d = new Date(dateStr);
    const weekday = new Intl.DateTimeFormat('zh-TW', { weekday: 'short' }).format(d);
    return `${dateStr} (${weekday})`;
  };

  const handleDelete = async (habitId: string, logDate: string, habitName: string) => {
    if (window.confirm(`確定要刪除 ${dateStrDisplay(logDate)} 的 ${habitName} 紀錄嗎？`)) {
      await onDeleteLog(habitId, logDate);
    }
  };

  const dateStrDisplay = (d: string) => (d === todayStr ? '今天' : d);

  if (sortedDates.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-10 text-center text-slate-400 space-y-3">
        <Calendar className="w-12 h-12 mx-auto text-slate-600" />
        <h3 className="text-base font-bold text-white">尚無任何歷史打卡紀錄</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          當您在【今日打卡】記錄跑步、重訓，或點擊抗菸抗酒時，每一天的明細都會完整列於此處，隨時支援自由修改或刪除！
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            習慣時光日誌 (歷史紀錄)
          </h2>
          <p className="text-xs text-slate-400">所有運動與抗癮明細，支援一鍵點選編輯與刪除防手滑</p>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
          共 {logs.length} 筆
        </span>
      </div>

      <div className="space-y-4">
        {sortedDates.map((dateStr) => {
          const dayLogs = groupedByDate[dateStr];
          const isToday = dateStr === todayStr;

          return (
            <div
              key={dateStr}
              className={`rounded-2xl bg-slate-900 border p-4 transition-all shadow-md ${
                isToday ? 'border-emerald-500/30 bg-gradient-to-b from-slate-900 to-slate-900/95' : 'border-slate-800'
              }`}
            >
              {/* 日期標題 */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${isToday ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className={`text-xs font-bold font-mono ${isToday ? 'text-emerald-300' : 'text-slate-200'}`}>
                    {formatDateLabel(dateStr)}
                  </span>
                </div>
                {isToday && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    TODAY
                  </span>
                )}
              </div>

              {/* 當日習慣卡片列表 */}
              <div className="space-y-2.5">
                {dayLogs.map((log) => {
                  const habit = habits.find((h) => h.id === log.habit_id);
                  if (!habit) return null;

                  const isUrge = habit.id === 'sober' || habit.id === 'smoke_free';
                  const isRunning = habit.id === 'running';
                  const isWorkout = habit.id === 'workout';

                  const resisted = Number(log.metrics?.resisted) || 0;
                  const consumed = Number(log.metrics?.consumed ?? log.metrics?.smoked) || 0;
                  const netSaved = Number(log.metrics?.netSaved) ?? Number(log.value) ?? 0;
                  const unitLabel = habit.unit || (habit.id === 'sober' ? '瓶' : '根');

                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-850 flex items-center justify-between gap-3 group hover:border-slate-750 transition-colors"
                    >
                      {/* 左側圖示與內容 */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className={`p-2 rounded-xl border shrink-0 mt-0.5 ${
                            habit.id === 'running'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : habit.id === 'workout'
                              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                              : habit.id === 'sober'
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              : 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                          }`}
                        >
                          <IconRenderer name={habit.icon} className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{habit.name}</span>
                            {isUrge && (
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                                  netSaved >= 0
                                    ? 'text-emerald-400 bg-emerald-500/10'
                                    : 'text-rose-400 bg-rose-500/10'
                                }`}
                              >
                                {netSaved >= 0 ? `+NT$ ${netSaved}` : `NT$ ${netSaved}`}
                              </span>
                            )}
                          </div>

                          {/* 跑步細節 */}
                          {isRunning && (
                            <div className="text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="font-mono font-bold text-emerald-400">
                                {log.value} {habit.unit}
                              </span>
                              {log.metrics?.duration && (
                                <span className="text-slate-400">耗時 {log.metrics.duration} 分</span>
                              )}
                              {log.metrics?.pace && (
                                <span className="text-slate-400">配速 {log.metrics.pace}/km</span>
                              )}
                            </div>
                          )}

                          {/* 重訓細節 */}
                          {isWorkout && (
                            <div className="text-xs text-slate-300 mt-0.5 space-y-1">
                              <div className="font-mono font-bold text-blue-400">
                                完成 {log.value} {habit.unit}
                              </div>
                              {log.metrics?.exercises && log.metrics.exercises.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {log.metrics.exercises.map((ex: any, idx: number) => (
                                    <span
                                      key={idx}
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                                    >
                                      {ex.name} ({ex.weight}kg × {ex.sets}組)
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 抗菸/抗酒細節 */}
                          {isUrge && (
                            <div className="text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                              <span className="text-emerald-300 font-medium">
                                抵抗成功 {resisted} 次
                              </span>
                              <span className="text-slate-500">|</span>
                              <span className="text-slate-400">
                                {habit.id === 'sober' ? '喝了' : '抽了'} {consumed} {unitLabel}
                              </span>
                            </div>
                          )}

                          {/* 備註 */}
                          {log.note && (
                            <p className="text-[11px] text-slate-500 italic mt-0.5 truncate">
                              "{log.note}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 右側操作按鈕 */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            if (isUrge) {
                              onEditUrge(habit, log);
                            } else {
                              onEditNumeric(habit, log);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="編輯此紀錄"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(habit.id, log.log_date, habit.name)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="刪除此紀錄"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
