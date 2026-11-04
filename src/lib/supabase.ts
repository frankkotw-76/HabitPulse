import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 支援讀取環境變數或 LocalStorage 中使用者自訂的 Supabase 連線設定
export function getSupabaseConfig(): { url: string; key: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = localStorage.getItem('habitpulse_supabase_url') || '';
  const localKey = localStorage.getItem('habitpulse_supabase_key') || '';

  return {
    url: localUrl.trim() || envUrl.trim(),
    key: localKey.trim() || envKey.trim(),
  };
}

let clientInstance: SupabaseClient | null = null;
let currentConfig = { url: '', key: '' };

export function getSupabase(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.url || !config.key) {
    return null;
  }

  // 若設定相同則複用既有實例
  if (clientInstance && currentConfig.url === config.url && currentConfig.key === config.key) {
    return clientInstance;
  }

  try {
    currentConfig = config;
    clientInstance = createClient(config.url, config.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    return clientInstance;
  } catch (err) {
    console.warn('[HabitPulse] Failed to initialize Supabase client:', err);
    return null;
  }
}

export function saveCustomSupabaseConfig(url: string, key: string) {
  if (url && key) {
    localStorage.setItem('habitpulse_supabase_url', url.trim());
    localStorage.setItem('habitpulse_supabase_key', key.trim());
  } else {
    localStorage.removeItem('habitpulse_supabase_url');
    localStorage.removeItem('habitpulse_supabase_key');
  }
  clientInstance = null; // 重設以重新載入
}
