-- ==========================================
-- HabitPulse: Supabase Database Schema
-- ==========================================

-- 1. 習慣定義表
create table if not exists habits (
  id text primary key,
  name text not null,
  type text not null check (type in ('streak', 'numeric')), -- streak: 戒斷連勝, numeric: 運動計量
  icon text not null,
  unit text, -- 'km', 'min', 'kg', '組' 等
  cost_per_day numeric default 0, -- 戒斷型每天省下的金額 (例如菸酒花費，單位: NTD)
  created_at timestamptz default now()
);

-- 預設插入 4 個基本習慣
insert into habits (id, name, type, icon, unit, cost_per_day) values
  ('running', '跑步', 'numeric', 'Footprints', 'km', 0),
  ('workout', '重訓', 'numeric', 'Dumbbell', '組', 0),
  ('sober', '節制抗酒', 'streak', 'WineOff', '瓶', 50),
  ('smoke_free', '減害抗菸', 'streak', 'CigaretteOff', '根', 6.5)
on conflict (id) do nothing;

-- 2. 打卡日誌表 (正向計量型習慣每次打卡、戒斷型每日簽到)
create table if not exists habit_logs (
  id uuid default gen_random_uuid() primary key,
  habit_id text references habits(id) on delete cascade,
  log_date date not null,
  completed boolean default true,
  value numeric default 0, -- 跑步公里數、重訓總量等
  metrics jsonb default '{}'::jsonb, -- 彈性結構：例如跑步存 { duration: 65, pace: "6:30" }、重訓存 { exercises: [...] }
  note text,
  created_at timestamptz default now(),
  unique (habit_id, log_date)
);

-- 3. 戒斷型狀態表 (記錄戒斷起始日與破戒重置歷史)
create table if not exists streak_resets (
  id uuid default gen_random_uuid() primary key,
  habit_id text references habits(id) on delete cascade,
  start_date timestamptz not null default now(),
  reset_date timestamptz,
  trigger_reason text,
  created_at timestamptz default now()
);

-- 索引優化常用查詢 (按 habit_id 與日期)
create index if not exists idx_habit_logs_habit_date on habit_logs (habit_id, log_date desc);
create index if not exists idx_streak_resets_habit on streak_resets (habit_id, created_at desc);

-- 4. Row Level Security (RLS) 安全策略
-- 預設開啟 RLS
alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table streak_resets enable row level security;

-- 公開/個人使用策略 (允許匿名存取或已登入使用者全功能 CRUD)
-- 若個人自用且使用 anon key，以下開放 anon 與 authenticated 角色讀寫
drop policy if exists "Allow public read-write on habits" on habits;
create policy "Allow public read-write on habits"
  on habits for all
  using (true)
  with check (true);

drop policy if exists "Allow public read-write on habit_logs" on habit_logs;
create policy "Allow public read-write on habit_logs"
  on habit_logs for all
  using (true)
  with check (true);

drop policy if exists "Allow public read-write on streak_resets" on streak_resets;
create policy "Allow public read-write on streak_resets"
  on streak_resets for all
  using (true)
  with check (true);

-- 5. 啟用 Realtime 監聽 (即時跨裝置推播)
alter publication supabase_realtime add table habits;
alter publication supabase_realtime add table habit_logs;
alter publication supabase_realtime add table streak_resets;
