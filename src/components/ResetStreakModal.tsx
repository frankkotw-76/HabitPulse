import React, { useState } from 'react';
import { Habit } from '../types/habit';
import { X, AlertTriangle, RotateCcw, HeartHandshake } from 'lucide-react';

interface ResetStreakModalProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: (habitId: string, reason: string) => Promise<void>;
}

const COMMON_TRIGGERS = [
  '朋友聚會/商務應酬社交壓力',
  '工作或生活高壓焦慮',
  '無聊或獨處時的習慣性渴望',
  '情緒低落衝動破防',
  '熬夜或自制力疲勞',
];

export const ResetStreakModal: React.FC<ResetStreakModalProps> = ({
  habit,
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  if (!isOpen || !habit) return null;

  const [selectedReason, setSelectedReason] = useState<string>(COMMON_TRIGGERS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const finalReason = customReason.trim() ? customReason.trim() : selectedReason;

    try {
      await onConfirmReset(habit.id, finalReason);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-rose-500/30 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-rose-500/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">破戒重置 · {habit.name}</h2>
              <p className="text-xs text-rose-300">誠實面對，記錄原因重新出發</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Compassion Message */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex items-start gap-3">
          <HeartHandshake className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed">
            每一次破戒都是珍貴的自我覺察機會。記錄下誘發的原因，了解自己的脆弱時刻，連勝只是數字，你過去幾天清醒與健康的身體成果永遠不會白費！
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-2">
              請選擇本次破戒的觸發原因：
            </label>
            <div className="space-y-2">
              {COMMON_TRIGGERS.map((trigger) => (
                <label
                  key={trigger}
                  className={`flex items-center p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedReason === trigger && !customReason
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-200 font-medium'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="trigger"
                    value={trigger}
                    checked={selectedReason === trigger && !customReason}
                    onChange={() => {
                      setSelectedReason(trigger);
                      setCustomReason('');
                    }}
                    className="mr-2.5 text-rose-500 focus:ring-rose-500"
                  />
                  {trigger}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              其他自訂具體情境 (選填)
            </label>
            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="例如：在居酒屋朋友敬酒無法推託..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500 placeholder:text-slate-600"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-750 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isSubmitting ? '重置中...' : '確認重置並重啟連勝'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
