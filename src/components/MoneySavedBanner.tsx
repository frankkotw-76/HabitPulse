import React from 'react';
import { Habit, StreakReset } from '../types/habit';
import { calculateStreak } from '../lib/storage';
import {
  DollarSign,
  TrendingUp,
  Sparkles,
  Award,
  ShoppingBag,
  Plane,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

interface MoneySavedBannerProps {
  habits: Habit[];
  resets: StreakReset[];
}

export const MoneySavedBanner: React.FC<MoneySavedBannerProps> = ({ habits, resets }) => {
  const streakHabits = habits.filter((h) => h.type === 'streak');

  let totalMoneySaved = 0;
  let totalDailyCost = 0;

  const streakBreakdowns = streakHabits.map((habit) => {
    const { days } = calculateStreak(habit.id, resets);
    const saved = days * (habit.cost_per_day || 0);
    totalMoneySaved += saved;
    totalDailyCost += habit.cost_per_day || 0;
    return {
      habit,
      days,
      saved,
    };
  });

  // 里程碑對照
  const milestones = [
    { target: 1500, label: '極上和牛燒肉大餐', icon: ShoppingBag },
    { target: 5000, label: '專業頂級跑步跑鞋', icon: Award },
    { target: 16000, label: '日本東京來回機票', icon: Plane },
    { target: 45000, label: '全新 iPhone 旗艦手機', icon: Smartphone },
    { target: 100000, label: '十萬元自由人生基金', icon: Sparkles },
  ];

  const currentMilestoneIndex = milestones.findIndex((m) => totalMoneySaved < m.target);
  const nextMilestone =
    currentMilestoneIndex !== -1 ? milestones[currentMilestoneIndex] : milestones[milestones.length - 1];
  const progressPercent = Math.min(100, Math.round((totalMoneySaved / nextMilestone.target) * 100));

  return (
    <div className="space-y-4">
      {/* 總省下金額大看板 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/30 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <DollarSign className="w-40 h-40 text-emerald-400" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            戒斷自由財富積累
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-3">
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight font-mono">
              NT$ {totalMoneySaved.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-300 font-medium">
              每日持續以 NT$ {totalDailyCost.toLocaleString()} 的速度遞增
            </span>
          </div>

          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            這不是省下來的錢，而是你用鋼鐵意志從菸酒消費中贖回的生命主權與實質財富！
          </p>

          {/* 下一個具象化獎勵目標 */}
          <div className="mt-5 p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/20">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <nextMilestone.icon className="w-3.5 h-3.5 text-emerald-400" />
                下一個具象獎勵：
                <strong className="text-white">{nextMilestone.label}</strong>
              </span>
              <span className="font-mono text-emerald-400 font-bold">{progressPercent}%</span>
            </div>

            {/* 進度條 */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>NT$ {totalMoneySaved.toLocaleString()}</span>
              <span>目標 NT$ {nextMilestone.target.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 習慣個別貢獻清單 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {streakBreakdowns.map(({ habit, days, saved }) => (
          <div
            key={habit.id}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
          >
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                {habit.name}
                <span className="text-xs font-normal text-slate-400 font-mono">
                  (堅持 {days} 天)
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                每日省下 NT$ {habit.cost_per_day}
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-extrabold text-emerald-400 font-mono">
                NT$ {saved.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500">累計貢獻</div>
            </div>
          </div>
        ))}
      </div>

      {/* 未來累積試算卡片 */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          持續堅持的財富複利試算
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { days: 30, label: '滿 1 個月' },
            { days: 90, label: '滿 1 季 (90天)' },
            { days: 365, label: '滿 1 年' },
            { days: 1095, label: '滿 3 年' },
          ].map(({ days, label }) => {
            const projected = days * totalDailyCost;
            return (
              <div key={days} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400">{label}</span>
                <div className="text-base font-extrabold text-white font-mono mt-0.5">
                  NT$ {projected.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
