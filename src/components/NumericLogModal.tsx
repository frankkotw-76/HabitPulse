import React, { useState, useEffect } from 'react';
import { Habit, HabitLog, WorkoutExercise } from '../types/habit';
import { X, Plus, Trash2, Footprints, Dumbbell, Sparkles } from 'lucide-react';
import { getLocalDateString } from '../lib/storage';
import { triggerCelebration } from '../lib/confetti';

interface NumericLogModalProps {
  habit: Habit | null;
  existingLog?: HabitLog | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: Omit<HabitLog, 'id'> & { id?: string }) => Promise<void>;
}

export const NumericLogModal: React.FC<NumericLogModalProps> = ({
  habit,
  existingLog,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !habit) return null;

  const isRunning = habit.id === 'running';

  // 表單狀態
  const [logDate, setLogDate] = useState<string>(existingLog?.log_date || getLocalDateString());
  const [note, setNote] = useState<string>(existingLog?.note || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 跑步欄位
  const [distance, setDistance] = useState<string>(
    isRunning && existingLog ? String(existingLog.value || '') : '5.0'
  );
  const [durationMin, setDurationMin] = useState<string>(
    isRunning && existingLog?.metrics?.duration ? String(existingLog.metrics.duration) : '30'
  );

  // 重訓欄位
  const [exercises, setExercises] = useState<WorkoutExercise[]>(
    !isRunning && existingLog?.metrics?.exercises
      ? existingLog.metrics.exercises
      : [
          { id: '1', name: '深蹲', weight: 60, sets: 4, reps: 8 },
          { id: '2', name: '臥推', weight: 50, sets: 4, reps: 8 },
        ]
  );

  // 自動計算跑步配速
  const calculatePace = (dist: number, mins: number) => {
    if (!dist || dist <= 0 || !mins || mins <= 0) return '--:--';
    const totalSeconds = mins * 60;
    const paceSeconds = Math.round(totalSeconds / dist);
    const paceMin = Math.floor(paceSeconds / 60);
    const paceSec = paceSeconds % 60;
    return `${paceMin}:${String(paceSec).padStart(2, '0')}`;
  };

  const calculatedPace = isRunning
    ? calculatePace(parseFloat(distance) || 0, parseFloat(durationMin) || 0)
    : '';

  // 重訓項目操作
  const handleAddExercise = () => {
    setExercises([
      ...exercises,
      { id: crypto.randomUUID(), name: '引體向上', weight: 0, sets: 3, reps: 10 },
    ]);
  };

  const handleRemoveExercise = (id: string) => {
    setExercises(exercises.filter((e) => e.id !== id));
  };

  const handleUpdateExercise = (
    id: string,
    field: keyof WorkoutExercise,
    value: string | number
  ) => {
    setExercises(
      exercises.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isRunning) {
        const distNum = parseFloat(distance) || 0;
        const durNum = parseFloat(durationMin) || 0;

        await onSave({
          id: existingLog?.id,
          habit_id: habit.id,
          log_date: logDate,
          completed: true,
          value: distNum,
          metrics: {
            duration: durNum,
            pace: calculatedPace,
          },
          note: note.trim(),
        });
      } else {
        // 重訓: 總組數計算
        const totalSets = exercises.reduce((acc, curr) => acc + (Number(curr.sets) || 0), 0);
        await onSave({
          id: existingLog?.id,
          habit_id: habit.id,
          log_date: logDate,
          completed: true,
          value: totalSets,
          metrics: {
            totalSets,
            exercises,
          },
          note: note.trim(),
        });
      }

      triggerCelebration();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                isRunning
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
              }`}
            >
              {isRunning ? <Footprints className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">記錄{habit.name}數據</h2>
              <p className="text-xs text-slate-400">保持規律運動節奏與訓練日誌</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* 日期選擇 */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">打卡日期</label>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          {/* 跑步特有輸入 */}
          {isRunning ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    里程 ({habit.unit})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    placeholder="例如 5.0"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    運動耗時 (分鐘)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                    placeholder="例如 30"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              {/* 即時配速顯示 */}
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
                <span className="text-xs text-emerald-300 font-medium">即時配速計算</span>
                <span className="text-lg font-extrabold text-emerald-400 font-mono">
                  {calculatedPace} <span className="text-xs font-normal">/km</span>
                </span>
              </div>
            </div>
          ) : (
            /* 重訓特有課表輸入 */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">重訓課表項目</label>
                <button
                  type="button"
                  onClick={handleAddExercise}
                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  新增動作
                </button>
              </div>

              <div className="space-y-2">
                {exercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={ex.name}
                        onChange={(e) => handleUpdateExercise(ex.id, 'name', e.target.value)}
                        placeholder="動作名稱 (如 深蹲)"
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-850 text-xs text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                      {exercises.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveExercise(ex.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400">重量 (kg)</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={ex.weight}
                          onChange={(e) =>
                            handleUpdateExercise(ex.id, 'weight', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">組數 (Sets)</span>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={ex.sets}
                          onChange={(e) =>
                            handleUpdateExercise(ex.id, 'sets', parseInt(e.target.value) || 1)
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">每組次數 (Reps)</span>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={ex.reps}
                          onChange={(e) =>
                            handleUpdateExercise(ex.id, 'reps', parseInt(e.target.value) || 1)
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 心得備註 */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">心得筆記 (選填)</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="今天的身體狀態、心率感受或突破筆記..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
            />
          </div>

          {/* 提交按鈕 */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isSubmitting ? '儲存同步中...' : '儲存打卡並解鎖慶祝'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
