import { Habit, HabitLog, StreakReset } from '../types/habit';
import { getSupabase } from './supabase';

export const DEFAULT_HABITS: Habit[] = [
  {
    id: 'running',
    name: '跑步',
    type: 'numeric',
    icon: 'Footprints',
    unit: 'km',
    cost_per_day: 0,
  },
  {
    id: 'workout',
    name: '重訓',
    type: 'numeric',
    icon: 'Dumbbell',
    unit: '組',
    cost_per_day: 0,
  },
  {
    id: 'sober',
    name: '不喝酒',
    type: 'streak',
    icon: 'WineOff',
    unit: null,
    cost_per_day: 250, // 每日省下 $250
  },
  {
    id: 'smoke_free',
    name: '不抽菸',
    type: 'streak',
    icon: 'CigaretteOff',
    unit: null,
    cost_per_day: 150, // 每日省下 $150
  },
];

const STORAGE_KEYS = {
  HABITS: 'habitpulse_habits',
  LOGS: 'habitpulse_logs',
  RESETS: 'habitpulse_resets',
};

// 格式化日期為 YYYY-MM-DD (在地時區)
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 初始化本機預設種子資料 (避免初次開啟空空如也)
function getInitialStreakResets(): StreakReset[] {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const fortyFiveDaysAgo = new Date();
  fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

  return [
    {
      id: 'init-sober',
      habit_id: 'sober',
      start_date: thirtyDaysAgo.toISOString(),
      reset_date: null,
      trigger_reason: null,
    },
    {
      id: 'init-smoke-free',
      habit_id: 'smoke_free',
      start_date: fortyFiveDaysAgo.toISOString(),
      reset_date: null,
      trigger_reason: null,
    },
  ];
}

// 產生最近兩週的幾筆範例打卡記錄
function getInitialLogs(): HabitLog[] {
  const logs: HabitLog[] = [];
  const today = new Date();

  // 跑步範例記錄
  for (let i of [1, 3, 6, 8, 11]) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    logs.push({
      id: `seed-run-${i}`,
      habit_id: 'running',
      log_date: getLocalDateString(d),
      completed: true,
      value: 5.2 + (i % 3),
      metrics: { duration: 32 + i * 2, pace: '5:45' },
      note: i === 1 ? '晨跑河濱，節奏舒暢' : '夜跑放鬆',
    });
  }

  // 重訓範例記錄
  for (let i of [2, 4, 7, 9]) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    logs.push({
      id: `seed-gym-${i}`,
      habit_id: 'workout',
      log_date: getLocalDateString(d),
      completed: true,
      value: 16,
      metrics: {
        totalSets: 16,
        exercises: [
          { id: '1', name: '深蹲', weight: 80, sets: 4, reps: 8 },
          { id: '2', name: '臥推', weight: 65, sets: 4, reps: 10 },
          { id: '3', name: '引體向上', weight: 0, sets: 4, reps: 8 },
          { id: '4', name: '羅馬尼亞硬舉', weight: 70, sets: 4, reps: 10 },
        ]
      },
      note: '胸背腿綜合訓練',
    });
  }

  return logs;
}

// 讀取 Habits
export async function getHabits(): Promise<Habit[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('habits').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(data));
        return data as Habit[];
      }
    } catch (e) {
      console.warn('[HabitPulse] Supabase fetchHabits error, fallback to local', e);
    }
  }

  const local = localStorage.getItem(STORAGE_KEYS.HABITS);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (_) {}
  }

  localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(DEFAULT_HABITS));
  return DEFAULT_HABITS;
}

// 讀取 Logs
export async function getLogs(): Promise<HabitLog[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('habit_logs').select('*').order('log_date', { ascending: false });
      if (!error && data) {
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(data));
        return data as HabitLog[];
      }
    } catch (e) {
      console.warn('[HabitPulse] Supabase fetchLogs error, fallback to local', e);
    }
  }

  const local = localStorage.getItem(STORAGE_KEYS.LOGS);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (_) {}
  }

  const seed = getInitialLogs();
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(seed));
  return seed;
}

// 讀取 Streak Resets
export async function getStreakResets(): Promise<StreakReset[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('streak_resets').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        localStorage.setItem(STORAGE_KEYS.RESETS, JSON.stringify(data));
        return data as StreakReset[];
      }
    } catch (e) {
      console.warn('[HabitPulse] Supabase fetchResets error, fallback to local', e);
    }
  }

  const local = localStorage.getItem(STORAGE_KEYS.RESETS);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (_) {}
  }

  const seed = getInitialStreakResets();
  localStorage.setItem(STORAGE_KEYS.RESETS, JSON.stringify(seed));
  return seed;
}

// 儲存/更新日誌 (正向習慣打卡或每日簽到)
export async function saveHabitLog(log: Omit<HabitLog, 'id'> & { id?: string }): Promise<HabitLog> {
  const fullLog: HabitLog = {
    id: log.id || crypto.randomUUID(),
    habit_id: log.habit_id,
    log_date: log.log_date,
    completed: log.completed,
    value: log.value,
    metrics: log.metrics || {},
    note: log.note || '',
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('habit_logs')
        .upsert(fullLog, { onConflict: 'habit_id,log_date' })
        .select()
        .single();
      if (!error && data) {
        // 同步至 local
        updateLocalLog(data as HabitLog);
        return data as HabitLog;
      }
    } catch (e) {
      console.warn('[HabitPulse] Supabase saveHabitLog error, saving locally', e);
    }
  }

  updateLocalLog(fullLog);
  return fullLog;
}

function updateLocalLog(log: HabitLog) {
  const local = localStorage.getItem(STORAGE_KEYS.LOGS);
  let logs: HabitLog[] = local ? JSON.parse(local) : [];
  const idx = logs.findIndex(l => l.habit_id === log.habit_id && l.log_date === log.log_date);
  if (idx >= 0) {
    logs[idx] = log;
  } else {
    logs.unshift(log);
  }
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  window.dispatchEvent(new Event('habitpulse_sync'));
}

// 刪除打卡日誌
export async function deleteHabitLog(habitId: string, logDate: string): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('habit_logs').delete().match({ habit_id: habitId, log_date: logDate });
    } catch (e) {
      console.warn('[HabitPulse] Supabase deleteHabitLog error', e);
    }
  }

  const local = localStorage.getItem(STORAGE_KEYS.LOGS);
  if (local) {
    let logs: HabitLog[] = JSON.parse(local);
    logs = logs.filter(l => !(l.habit_id === habitId && l.log_date === logDate));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    window.dispatchEvent(new Event('habitpulse_sync'));
  }
}

// 破戒重置 (記錄原因與重置時間，並重置起始日)
export async function resetStreak(habitId: string, triggerReason: string): Promise<StreakReset> {
  const now = new Date().toISOString();
  const resetRecord: StreakReset = {
    id: crypto.randomUUID(),
    habit_id: habitId,
    start_date: now,
    reset_date: now,
    trigger_reason: triggerReason || '未填寫原因',
    created_at: now,
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('streak_resets')
        .insert(resetRecord)
        .select()
        .single();
      if (!error && data) {
        updateLocalReset(data as StreakReset);
        return data as StreakReset;
      }
    } catch (e) {
      console.warn('[HabitPulse] Supabase resetStreak error', e);
    }
  }

  updateLocalReset(resetRecord);
  return resetRecord;
}

function updateLocalReset(reset: StreakReset) {
  const local = localStorage.getItem(STORAGE_KEYS.RESETS);
  let resets: StreakReset[] = local ? JSON.parse(local) : [];
  resets.unshift(reset);
  localStorage.setItem(STORAGE_KEYS.RESETS, JSON.stringify(resets));
  window.dispatchEvent(new Event('habitpulse_sync'));
}

// 計算連勝天數與統計
export function calculateStreak(habitId: string, resets: StreakReset[]): {
  days: number;
  startDate: Date;
  historyResets: StreakReset[];
} {
  const habitResets = resets
    .filter(r => r.habit_id === habitId)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  if (habitResets.length === 0) {
    const defaultStart = new Date();
    return { days: 0, startDate: defaultStart, historyResets: [] };
  }

  const activeReset = habitResets[0];
  const startDate = new Date(activeReset.start_date);
  const now = new Date();

  // 毫秒轉天數 (無條件捨去取得完整天數)
  const diffTime = Math.max(0, now.getTime() - startDate.getTime());
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return {
    days,
    startDate,
    historyResets: habitResets.filter(r => r.reset_date !== null),
  };
}

// 監聽 Realtime 異動
export function subscribeToRealtime(onSync: () => void) {
  const supabase = getSupabase();
  if (!supabase) {
    const handleLocal = () => onSync();
    window.addEventListener('habitpulse_sync', handleLocal);
    return () => window.removeEventListener('habitpulse_sync', handleLocal);
  }

  const channel = supabase
    .channel('habitpulse-realtime-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'habit_logs' }, () => {
      onSync();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'streak_resets' }, () => {
      onSync();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'habits' }, () => {
      onSync();
    })
    .subscribe();

  const handleLocal = () => onSync();
  window.addEventListener('habitpulse_sync', handleLocal);

  return () => {
    supabase.removeChannel(channel);
    window.removeEventListener('habitpulse_sync', handleLocal);
  };
}
