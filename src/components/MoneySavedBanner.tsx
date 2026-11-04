import React from 'react';
import { Habit, HabitLog, StreakReset } from '../types/habit';
import {
  DollarSign,
  TrendingUp,
  Sparkles,
  Award,
  ShoppingBag,
  Plane,
  Smartphone,
  ShieldCheck,
  Cigarette,
  Wine,
} from 'lucide-react';

interface MoneySavedBannerProps {
  habits: Habit[];
  logs: HabitLog[];
  resets: StreakReset[];
}

export const MoneySavedBanner: React.FC<MoneySavedBannerProps> = ({ habits, logs }) => {
  // 節制抗酒計算 (抵抗瓶數 - 喝了瓶數) * 單瓶花費
  const soberHabit = habits.find((h) => h.id === 'sober');
  const soberLogs = logs.filter((l) => l.habit_id === 'sober');
  const soberResisted = soberLogs.reduce((acc, l) => acc + (Number(l.metrics?.resisted) || 0), 0);
  const soberConsumed = soberLogs.reduce((acc, l) => acc + (Number(l.metrics?.consumed) || 0), 0);
  const soberCost = soberHabit?.cost_per_day ?? 50;
  const soberSaved = Math.max(0, Math.round((soberResisted - soberConsumed) * soberCost * 10) / 10);

  // 減害抗菸計算 (抵抗次數 - 抽菸根數) * 單根花費
  const smokeHabit = habits.find((h) => h.id === 'smoke_free');
  const smokeLogs = logs.filter((l) => l.habit_id === 'smoke_free');
  const smokeResisted = smokeLogs.reduce((acc, l) => acc + (Number(l.metrics?.resisted) || 0), 0);
  const smokeConsumed = smokeLogs.reduce((acc, l) => acc + (Number(l.metrics?.consumed ?? l.metrics?.smoked) || 0), 0);
  const smokeCost = smokeHabit?.cost_per_day ?? 6.5;
  const smokeSaved = Math.max(0, Math.round((smokeResisted - smokeConsumed) * smokeCost * 10) / 10);

  const totalMoneySaved = Math.round(soberSaved + smokeSaved);

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
            減害自律自由財富積累
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-3">
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight font-mono">
              NT$ {totalMoneySaved.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-300 font-medium">
              每一次克制少喝、少抽都在為自己創造實質財富
            </span>
          </div>

          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            這不是單純少花錢，而是您用理性克制從菸酒開銷中贖回的健康自由與實質儲蓄！
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
        {/* 節制抗酒 */}
        {soberHabit && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Wine className="w-4 h-4 text-amber-400" />
                節制抗酒
                <span className="text-xs font-normal text-slate-400 font-mono">
                  (抗癮 {soberResisted} 次 / 喝 {soberConsumed} 瓶)
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                單瓶克制省 NT$ {soberCost}
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-extrabold text-emerald-400 font-mono">
                NT$ {soberSaved.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500">淨省下金額</div>
            </div>
          </div>
        )}

        {/* 減害抗菸 */}
        {smokeHabit && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Cigarette className="w-4 h-4 text-teal-400" />
                減害抗菸
                <span className="text-xs font-normal text-slate-400 font-mono">
                  (抗癮 {smokeResisted} 次 / 抽 {smokeConsumed} 根)
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                單根克制省 NT$ {smokeCost}
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-extrabold text-emerald-400 font-mono">
                NT$ {smokeSaved.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500">淨省下金額</div>
            </div>
          </div>
        )}
      </div>

      {/* 激勵試算卡片 */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          持續減害與自律的財富積累預估
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { days: 30, label: '滿 1 個月' },
            { days: 90, label: '滿 1 季 (90天)' },
            { days: 365, label: '滿 1 年' },
            { days: 1095, label: '滿 3 年' },
          ].map(({ days, label }) => {
            const projected = days * (soberCost * 2 + smokeCost * 10); // 假設每天少喝2瓶、少抽半包
            return (
              <div key={days} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400">{label}</span>
                <div className="text-base font-extrabold text-white font-mono mt-0.5">
                  NT$ {Math.round(projected).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
