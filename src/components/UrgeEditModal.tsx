import React, { useState } from 'react';
import { Habit, HabitLog } from '../types/habit';
import { X, ShieldCheck, Check, Trash2 } from 'lucide-react';

interface UrgeEditModalProps {
  habit: Habit | null;
  log: HabitLog | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitId: 'sober' | 'smoke_free', logDate: string, resisted: number, consumed: number) => Promise<void>;
  onDelete: (habitId: string, logDate: string) => Promise<void>;
}

export const UrgeEditModal: React.FC<UrgeEditModalProps> = ({
  habit,
  log,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen || !habit || !log) return null;

  const isAlcohol = habit.id === 'sober';
  const unitName = habit.unit || (isAlcohol ? '瓶' : '根');
  const unitCost = habit.cost_per_day ?? (isAlcohol ? 50 : 6.5);

  const [resisted, setResisted] = useState(Number(log.metrics?.resisted) || 0);
  const [consumed, setConsumed] = useState(
    Number(log.metrics?.consumed ?? log.metrics?.smoked) || 0
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewNet = Math.round((resisted - consumed) * unitCost * 10) / 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(habit.id as 'sober' | 'smoke_free', log.log_date, resisted, consumed);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`確定要刪除 ${log.log_date} 的 ${habit.name} 紀錄嗎？`)) {
      await onDelete(habit.id, log.log_date);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
          <div>
            <h3 className="text-sm font-bold text-white">修改對抗紀錄 · {habit.name}</h3>
            <span className="text-[11px] text-slate-400 font-mono">{log.log_date}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-emerald-400 mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 抵抗成功次數
              </label>
              <input
                type="number"
                min="0"
                value={resisted}
                onChange={(e) => setResisted(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                {isAlcohol ? '喝了瓶數' : '抽了根數'} ({unitName})
              </label>
              <input
                type="number"
                min="0"
                value={consumed}
                onChange={(e) => setConsumed(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 淨省金額即時預覽 */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">當日計算淨省下：</span>
            <span
              className={`font-mono font-bold text-sm ${
                previewNet >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              NT$ {previewNet > 0 ? `+${previewNet}` : previewNet}
            </span>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              className="p-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 flex items-center justify-center transition-colors"
              title="刪除此紀錄"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              {isSubmitting ? '儲存中...' : '儲存修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
