import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Check,
  Copy,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { getSupabaseConfig, saveCustomSupabaseConfig, getSupabase } from '../lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  if (!isOpen) return null;

  const currentConfig = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(currentConfig.url);
  const [supabaseKey, setSupabaseKey] = useState(currentConfig.key);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestStatus('testing');
    setStatusMessage('連線測試中...');

    try {
      saveCustomSupabaseConfig(supabaseUrl, supabaseKey);
      const client = getSupabase();

      if (!client) {
        setTestStatus('error');
        setStatusMessage('連線參數格式不完整');
        return;
      }

      // 嘗試讀取 habits
      const { data, error } = await client.from('habits').select('id').limit(1);

      if (error) {
        setTestStatus('error');
        setStatusMessage(`連線成功但讀取資料表失敗: ${error.message} (請確認是否有在 Supabase 執行 schema.sql)`);
      } else {
        setTestStatus('success');
        setStatusMessage('連線成功！Supabase Realtime 已啟用並接管資料儲存。');
        onRefreshData();
      }
    } catch (err: any) {
      setTestStatus('error');
      setStatusMessage(`連線失敗: ${err.message || '未知錯誤'}`);
    }
  };

  const handleClearConfig = () => {
    saveCustomSupabaseConfig('', '');
    setSupabaseUrl('');
    setSupabaseKey('');
    setTestStatus('idle');
    setStatusMessage('已切換回純本機離線模式');
    onRefreshData();
  };

  const sqlQuickCode = `-- 快速在 Supabase SQL Editor 執行以建立 HabitPulse 資料表
create table if not exists habits (
  id text primary key,
  name text not null,
  type text not null check (type in ('streak', 'numeric')),
  icon text not null,
  unit text,
  cost_per_day numeric default 0,
  created_at timestamptz default now()
);

insert into habits (id, name, type, icon, unit, cost_per_day) values
  ('running', '跑步', 'numeric', 'Footprints', 'km', 0),
  ('workout', '重訓', 'numeric', 'Dumbbell', '組', 0),
  ('sober', '不喝酒', 'streak', 'WineOff', null, 250),
  ('smoke_free', '不抽菸', 'streak', 'CigaretteOff', null, 150)
on conflict (id) do nothing;

create table if not exists habit_logs (
  id uuid default gen_random_uuid() primary key,
  habit_id text references habits(id) on delete cascade,
  log_date date not null,
  completed boolean default true,
  value numeric default 0,
  metrics jsonb default '{}'::jsonb,
  note text,
  created_at timestamptz default now(),
  unique (habit_id, log_date)
);

create table if not exists streak_resets (
  id uuid default gen_random_uuid() primary key,
  habit_id text references habits(id) on delete cascade,
  start_date timestamptz not null default now(),
  reset_date timestamptz,
  trigger_reason text,
  created_at timestamptz default now()
);

alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table streak_resets enable row level security;

create policy "Allow public read-write on habits" on habits for all using (true) with check (true);
create policy "Allow public read-write on habit_logs" on habit_logs for all using (true) with check (true);
create policy "Allow public read-write on streak_resets" on streak_resets for all using (true) with check (true);

alter publication supabase_realtime add table habits;
alter publication supabase_realtime add table habit_logs;
alter publication supabase_realtime add table streak_resets;`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlQuickCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleExportJson = () => {
    const backup = {
      habits: localStorage.getItem('habitpulse_habits'),
      logs: localStorage.getItem('habitpulse_logs'),
      resets: localStorage.getItem('habitpulse_resets'),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HabitPulse-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">系統設定與雲端同步</h2>
              <p className="text-xs text-slate-400">跨裝置即時同步 (Supabase Realtime) 與備份</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-5 overflow-y-auto flex-1">
          {/* Supabase 連線設定 */}
          <form onSubmit={handleTestAndSave} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Supabase 專案 API 設定</span>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                前往 Supabase <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Project URL</label>
              <input
                type="url"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Anon / Public Key</label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* 狀態訊息提示 */}
            {testStatus !== 'idle' && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  testStatus === 'success'
                    ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                    : testStatus === 'error'
                    ? 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
                    : 'bg-slate-850 border border-slate-700 text-slate-300'
                }`}
              >
                {testStatus === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : testStatus === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-400 shrink-0 mt-0.5" />
                )}
                <span>{statusMessage}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={testStatus === 'testing'}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                連線並儲存
              </button>

              <button
                type="button"
                onClick={handleClearConfig}
                className="py-2 px-3 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-750 transition-colors"
              >
                重設為本機
              </button>
            </div>
          </form>

          {/* SQL 複製小幫手 */}
          <div className="pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-300">Supabase SQL Schema 腳本</span>
              <button
                onClick={copySqlToClipboard}
                className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSql ? '已複製 SQL' : '一鍵複製 SQL'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              尚未在 Supabase 建立資料表？複製這段 SQL 至 Supabase 控制台的 SQL Editor 貼上執行即可完成建表與 Realtime 設置。
            </p>
            <div className="relative rounded-xl bg-slate-950 p-2.5 border border-slate-800 text-[10px] font-mono text-slate-400 max-h-24 overflow-y-auto">
              <pre>{sqlQuickCode}</pre>
            </div>
          </div>

          {/* 本機資料備份與匯出 */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-300">本地離線資料備份</span>
              <p className="text-[11px] text-slate-400">隨時將打卡歷史以 JSON 檔案匯出備份</p>
            </div>
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              匯出 JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
