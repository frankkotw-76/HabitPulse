# HabitPulse - 極致個人習慣追蹤 PWA 脈動

![HabitPulse PWA](public/icons/logo.svg)

HabitPulse 是一款專為自我提升與紀律重塑設計的個人習慣追蹤漸進式 Web 應用（PWA）。結合 **運動正向計量** 與 **菸酒戒斷連勝**，並透過 **Supabase Realtime** 實現手機與電腦跨裝置無縫即時推播同步。

---

## 🌟 核心功能特色

### 1. 四大核心追蹤習慣
- 🏃‍♂️ **【跑步】（正向計量型）**：
  - 記錄跑量（公里）、耗費時間（分鐘）、自動即時計算配速（分:秒 / km）。
  - 打卡日誌支援心得記錄與動態標籤。
- 🏋️‍♂️ **【重訓】（正向計量型）**：
  - 自由新增/刪除動作課表（如：深蹲、臥推、硬舉、引體向上）。
  - 個別設定重量（kg）、組數（Sets）、每組次數（Reps），自動計算總組數。
- 🍷 **【不喝酒】（連勝戒斷型）**：
  - 記錄連續未破戒天數（Streak）與階級頭銜（破土萌芽、堅定破局、蛻變大師等）。
  - 每日省下金額累計（預設每日省下 NT$ 250）。
  - 友善破戒重置機制（記錄觸發誘因：社交聚會、焦慮高壓、習慣渴望等）。
- 🚭 **【不抽菸】（連勝戒斷型）**：
  - 連勝天數與戒斷健康里程碑。
  - 每日省下金額累計（預設每日省下 NT$ 150）。
  - 具備破戒重置與自我覺察日誌。

### 2. 跨裝置即時同步 (Supabase Realtime)
- 支援 Supabase Postgres Changes 監聽，手機打卡、電腦即時無刷新響應。
- 支援「純本機離線模式」（預設含體驗種子資料）與「雲端同步模式」（可在介面設定或 `.env` 隨時輸入 URL 與 Anon Key）。

### 3. PWA 原生級體驗
- 支援 iOS / Android「加入主畫面」（全螢幕沉浸式運行、無瀏覽器網址列干擾）。
- 內建 Workbox Service Worker 快取策略，離線狀態下依然可瀏覽歷史與打卡。
- 精美深色主題搭配觸感回饋與 Milestone Confetti 慶祝特效。

### 4. GitHub 風格熱力圖 (Streak Heatmap)
- 過去 84 天（12 週）的打卡活躍度網格（5 級綠階強度）。
- 支援切換「全部習慣」或「單一習慣」獨立熱力分析，點擊或懸停方格即時檢視當日訓練詳情。

### 5. 財富積累看板 (Money Saved Milestone)
- 視覺化顯示戒斷菸酒所省下的真金白銀。
- 具體實體目標轉換（如：高級和牛燒肉、碳板跑鞋、日本機票、旗艦手機）。
- 1個月至3年之未來財富複利試算。

---

## 🚀 快速開始

### 1. 安裝與本機啟動
```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 建置 PWA 生產環境代碼
npm run build
```

### 2. Supabase 資料庫設定
1. 在 [Supabase](https://supabase.com) 建立免費專案。
2. 前往專案左側 **SQL Editor**。
3. 複製並貼上專案中的 `supabase/schema.sql` 內容，點擊 **Run** 執行。
4. 在專案中建立 `.env` 檔案，填入連線金鑰：
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
   *(亦可直接在網頁右上角「設定」圖示中直接貼上金鑰，無需重新打包)*

---

## ⚡ Netlify 部署與 Build Minutes 節省規範

本專案配置了嚴格的 `netlify.toml` 建置過濾機制：
```toml
[build]
  publish = "dist"
  command = "npm run build"
  # 僅在核心前端檔案異動時建置，若僅修改文件或 SQL 則略過 (exit code 0)，0 分鐘消耗
  ignore = "git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF ./src ./public ./index.html ./package.json ./package-lock.json ./vite.config.ts ./tailwind.config.js ./postcss.config.js ./tsconfig.json ./tsconfig.app.json ./tsconfig.node.json"
```

### Git 工作流與 Deploy Preview 測試
1. 建立功能分支：
   ```bash
   git checkout -b feature/habit-tracker-pwa
   ```
2. 提交並推送至 GitHub：
   ```bash
   git push origin feature/habit-tracker-pwa
   ```
3. 發起 Pull Request（PR）至 `main`。
4. Netlify Bot 將自動在 PR 留言生成 **Deploy Preview 網址**。
5. 使用手機掃描 Deploy Preview 網址，測試「加入主畫面」PWA 與 Supabase 即時同步。
6. 確認無誤後合併 PR，自動觸發正式站點（Production）部署。

---

## 📂 專案目錄結構

```
HabitPulse/
├── netlify.toml               # Netlify 嚴格建置過濾與快取規則
├── supabase/
│   └── schema.sql             # 資料表、RLS 安全策略與 Realtime 廣播腳本
├── public/
│   ├── icons/logo.svg         # 脈動向量商標
│   ├── pwa-192x192.png        # PWA 小圖標
│   ├── pwa-512x512.png        # PWA 大圖標 (Maskable)
│   └── apple-touch-icon.png   # iOS Safari 桌面圖標
├── src/
│   ├── types/
│   │   └── habit.ts           # 習慣與打卡型別定義
│   ├── lib/
│   │   ├── supabase.ts        # Supabase 客戶端連線與熱設定
│   │   ├── storage.ts         # 本地快取、Realtime 訂閱與數據計算核心
│   │   └── confetti.ts        # 里程碑慶祝特效
│   ├── components/
│   │   ├── Header.tsx         # 頂部狀態列與即時連線燈號
│   │   ├── HabitCard.tsx      # 四大習慣展示卡片
│   │   ├── NumericLogModal.tsx# 跑步配速/重訓組數打卡 Modal
│   │   ├── ResetStreakModal.tsx# 戒斷破戒重置與原因覺察 Modal
│   │   ├── StreakHeatmap.tsx  # GitHub 風格 84 天熱力圖
│   │   ├── MoneySavedBanner.tsx# 戒斷省錢財富看板
│   │   ├── SettingsModal.tsx  # Supabase 密鑰配置與備份匯出
│   │   ├── PWAInstallPrompt.tsx# 跨平台 PWA 安裝導引
│   │   └── IconRenderer.tsx   # Lucide 圖標渲染器
│   ├── App.tsx                # 主程式入口
│   ├── main.tsx               # Service Worker 註冊與 DOM 掛載
│   └── index.css              # Tailwind 與全域樣式
├── index.html                 # PWA Meta 標籤與視窗設定
├── vite.config.ts             # Vite + VitePWA 設定
└── package.json
```
