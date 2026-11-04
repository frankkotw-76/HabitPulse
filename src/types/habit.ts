export type HabitType = 'streak' | 'numeric';

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  icon: string;
  unit: string | null;
  cost_per_day: number;
  created_at?: string;
}

export interface RunningMetrics {
  duration?: number; // 分鐘
  pace?: string;     // 分:秒 / 公里
  heartRate?: number;
  route?: string;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  weight: number; // kg
  sets: number;   // 組數
  reps: number;   // 次數
}

export interface WorkoutMetrics {
  exercises: WorkoutExercise[];
  duration?: number;
  totalSets?: number;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  log_date: string; // YYYY-MM-DD
  completed: boolean;
  value: number;
  metrics: any;
  note?: string | null;
  created_at?: string;
}

export interface StreakReset {
  id: string;
  habit_id: string;
  start_date: string;
  reset_date?: string | null;
  trigger_reason?: string | null;
  created_at?: string;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalLogs: number;
  totalValue: number;
  moneySaved: number;
  startDate: string;
}
