# Hour of AI Landing Page - DevOps 技術文件

> 此文件記錄專案的部署架構與開發流程，供人類開發者與 AI 助手（如 Claude）參考。
> 當有相關架構或流程變更時，請同步更新此文件。

---

## 1. 系統架構總覽

```
┌─────────────────────────────────────────────────────────────────┐
│                        使用者請求                                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│   Production: hoa.junyiacademy.org                              │
│   Firebase 預設: hour-of-ai-landing-junyi.web.app               │
│   ─────────────────────────────────────────                     │
│   Firebase Hosting                                              │
│   - 靜態檔案託管                                                 │
│   - index.html (主要入口)                                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ POST /exec (表單提交)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│   Google Apps Script (Web App)                                  │
│   ─────────────────────────────────────────                     │
│   URL: https://script.google.com/macros/s/AKfycbw.../exec       │
│   功能:                                                         │
│   - 接收表單資料                                                 │
│   - 驗證來源 (CORS 白名單)                                       │
│   - 寫入 Google Sheets                                          │
│   - 提供統計 API                                                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│   Google Sheets (資料庫)                                        │
│   ─────────────────────────────────────────                     │
│   儲存所有表單提交資料                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 環境配置

### 2.1 Production 環境

| 項目 | 值 |
|------|-----|
| **Hosting** | Firebase Hosting |
| **URL（正式）** | https://hoa.junyiacademy.org |
| **URL（Firebase 預設）** | https://hour-of-ai-landing-junyi.web.app |
| **Branch** | `main` |
| **部署方式** | 手動 `firebase deploy --only hosting` |

### 2.2 Preview 環境（測試）

| 項目 | 值 |
|------|-----|
| **Hosting** | Vercel (自動) |
| **URL** | 動態產生，如 `pr-123-xxx.vercel.app` |
| **觸發條件** | 任何 PR 建立時自動部署 |
| **用途** | 測試變更，確認無誤後再 merge |

### 2.3 本地開發

| 項目 | 值 |
|------|-----|
| **URL** | http://localhost:5000 |
| **模式** | Demo Mode（不會實際提交到 Google Sheets）|
| **啟動方式** | `npm run dev`（Vite 開發伺服器）|
| **建置方式** | `npm run build`（產出至 dist/）|

---

## 3. 前端環境偵測邏輯

前端會根據 `hostname` 自動判斷使用哪個 API：

```javascript
// index.html 中的 getFormSubmitUrl() 函數邏輯

1. URL 參數 ?apiUrl=xxx     → 使用指定的 API（測試用）
2. window.HOA_CONFIG        → 使用 WordPress 設定的 API
3. junyiacademy.org         → 需要 WordPress 設定
4. hour-of-ai-landing-junyi.web.app / .firebaseapp.com
                            → 使用 Production API
5. 其他（localhost, Vercel preview 等）
                            → Demo Mode（模擬提交）
```

**注意**: Vercel Preview 環境目前會進入 Demo Mode，不會實際提交資料。

---

## 4. Backend 白名單設定

Google Apps Script 的 `validateOrigin` 函數需要設定允許的來源：

```javascript
// Google Apps Script 中的白名單
const allowedOrigins = [
  'https://www.junyiacademy.org',
  'https://junyiacademy.org',
  // 正式網域
  'https://hoa.junyiacademy.org',
  // Firebase Hosting (測試/開發)
  'https://hour-of-ai-landing-junyi.web.app',
  'https://hour-of-ai-landing-junyi.firebaseapp.com'
];
```

### 新增白名單步驟

1. 開啟 [Google Apps Script 編輯器](https://script.google.com/)
2. 找到 `validateOrigin` 函數
3. 在 `allowedOrigins` 陣列中新增網域
4. Deploy → New deployment
5. 複製新的 Web App URL（如果有變更）

---

## 5. 開發與部署流程

### 5.1 標準開發流程

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  建立 Branch  │ ──▶ │   發 PR      │ ──▶ │ Vercel 自動  │ ──▶ │  測試 Preview │
│              │     │              │     │ 部署 Preview │     │     URL      │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                       │
                                                                       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   完成！     │ ◀── │ GitHub Action │ ◀── │ Merge to     │ ◀── │  確認 OK？   │
│              │     │  自動部署     │     │    main      │     │              │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### 5.2 自動部署（GitHub Actions）

當 push 到 `main` branch 時，GitHub Actions 會自動：
1. 安裝 Node.js 20
2. 執行 `npm ci` 安裝依賴
3. 執行 `npm run build` 建置 Vite 專案
4. 部署 `dist/` 資料夾到 Firebase Hosting

**Workflow 檔案**: `.github/workflows/firebase-deploy.yml`

**相關設定**:
- Service Account: `github-actions-deploy@hour-of-ai-landing-junyi.iam.gserviceaccount.com`
- GitHub Secret: `FIREBASE_SERVICE_ACCOUNT`
- 權限: Firebase Hosting Admin

**查看部署狀態**: [GitHub Actions](https://github.com/ys-fang/hour-of-ai-landing/actions)

### 5.3 手動部署（備用）

如需手動部署，可使用：

```bash
# 建置專案
npm run build

# 部署到 Firebase Production
firebase deploy --only hosting
```

### 5.4 Vercel Preview 注意事項

- **自動產生**: 所有 repo collaborators 的 PR 都會自動產生 preview
- **Fork PR**: 預設不會自動產生（安全考量）
- **Demo Mode**: Preview 環境的表單提交為模擬，不會寫入實際資料

---

## 6. 重要連結

| 項目 | 連結 |
|------|------|
| **GitHub Repo** | https://github.com/ys-fang/hour-of-ai-landing |
| **Firebase Console** | https://console.firebase.google.com/project/hour-of-ai-landing-junyi |
| **Production URL** | https://hour-of-ai-landing-junyi.web.app |
| **Google Analytics** | https://analytics.google.com/ （帳戶：jutor-a8ad8） |
| **Google Apps Script** | （需從 Google Drive 存取） |
| **Google Sheets** | （需從 Google Drive 存取） |

---

## 7. Google Apps Script CLI 部署 (clasp)

### 7.1 概述

使用 [clasp](https://github.com/google/clasp) 透過命令列管理和部署 Google Apps Script，取代手動在 GAS 編輯器中複製貼上程式碼。

### 7.2 目錄結構

```
backend/
├── gas/                              # clasp 管理的 GAS 專案
│   ├── .clasp.json                   # clasp 設定（Script ID）
│   ├── appsscript.json               # GAS manifest
│   └── Code.js                       # 主要程式碼
├── google-apps-script-stats-api-updated.js  # 備份/參考
└── taiwan-rank-tracker.js            # 獨立的排名追蹤器
```

### 7.3 初始設定

```bash
# 1. 安裝 clasp（全域）
npm install -g @google/clasp

# 2. 登入 Google 帳號（需要瀏覽器授權）
clasp login

# 3. 確認登入成功
clasp login --status
```

### 7.4 使用方式

| 指令 | 說明 |
|------|------|
| `npm run gas:push` | 將本地程式碼推送到 GAS |
| `npm run gas:pull` | 從 GAS 拉取最新程式碼 |
| `npm run gas:deploy` | 推送並建立新版本部署 |
| `npm run gas:open` | 在瀏覽器開啟 GAS 編輯器 |
| `npm run gas:logs` | 查看 GAS 執行日誌 |

### 7.5 開發流程

```
1. 修改 backend/gas/Code.js
2. 執行 npm run gas:push（推送到 GAS）
3. 在 GAS 編輯器中測試（npm run gas:open）
4. 確認無誤後部署：npm run gas:deploy
5. 提交變更到 Git
```

### 7.6 部署方式

GAS 一律在本機以 `clasp push`（＋需要時 `clasp deploy -i <deploymentId>`）部署，**不經 GitHub Actions**（2026-10-13 移除 `gas-deploy.yml` 與 `CLASP_CREDENTIALS` secret）。

### 7.7 clasp run（CLI 執行 GAS 函數）

`clasp run` 允許從命令列直接執行 GAS 函數，無需開啟瀏覽器。

#### 前置需求

1. **GCP 專案已連結到 Apps Script**
   - GCP Project Number: `293501829424`
   - 在 GAS 編輯器 → 專案設定 → 變更 Google Cloud Platform 專案

2. **OAuth 同意畫面已設定**
   - 在 GCP Console → Google Auth Platform → 總覽
   - 類型：內部（Internal）

3. **Desktop OAuth 憑證**
   - 在 GCP Console → Google Auth Platform → 用戶端 → 建立用戶端
   - 選擇「電腦版應用程式」
   - 下載 JSON 並存為 `backend/gas/creds.json`

4. **使用憑證登入**
   ```bash
   cd backend/gas
   clasp login --creds creds.json
   ```

#### 使用方式

```bash
# 執行指定函數
clasp run testTaiwanRankTracker
clasp run trackTaiwanRank
clasp run sendWeeklyReport

# 執行帶參數的函數（JSON 格式）
clasp run myFunction --params '[1, "hello", true]'
```

#### 注意事項

- `creds.json` 已加入 `.gitignore`，不會被提交（包含 OAuth 密鑰）
- 每個開發者需要下載自己的憑證檔案
- 執行結果為 "No response." 表示函數成功執行但沒有回傳值
- 可在 GAS 編輯器的「執行項目」頁面查看執行記錄

### 7.8 注意事項

- `.clasprc.json`（認證檔案）已加入 `.gitignore`，不會被提交
- 每個開發者需要自己執行 `clasp login` 取得認證
- 部署新版本時，Web App URL 不會改變（除非建立新的 deployment）
- 如果要更新 Web App URL，需要在 GAS 編輯器中「Deploy > Manage deployments」

---

## 8. Taiwan Rank Tracker（排名追蹤器）

**已整合到主 GAS 專案** (2026-01-29)

每日自動追蹤台灣在 Hour of AI 全球活動註冊中的排名，並發送通知至 Slack。

### 8.1 架構

```
CSforAll 公開 Google Sheets
    ↓ UrlFetchApp.fetch (CSV export)
主 GAS 專案 (Code.js)
    ↓ sendToSlack() via Webhook
Slack Channel (#hour-of-ai)
```

### 8.2 配置

相關設定已整合到 `CONFIG` 物件：

```javascript
// backend/gas/Code.js
CONFIG = {
  // ...其他設定...
  ENABLE_RANK_TRACKER: true,
  RANK_TRACKER_DATA_URL: 'https://docs.google.com/spreadsheets/d/1QDTmNNP3i6Nfhg6y7qp5V_cSL6ciNsMyF3bEjyKXTsY/export?format=csv',
  RANK_TRACKER_TARGET_COUNTRY: 'Taiwan',
}
```

### 8.3 功能

- 抓取各國 Hour of AI 活動註冊數量
- 計算台灣排名、百分位、前後名次國家
- 發送格式化通知到 Slack（使用 Webhook）

### 8.4 觸發器設定

需要在 GAS 編輯器中設定 Time-driven trigger：
1. 開啟 GAS 編輯器：`npm run gas:open`
2. 點選「觸發器」圖示（時鐘）
3. 新增觸發器：
   - 函數：`trackTaiwanRank`
   - 事件來源：時間驅動
   - 類型：每日定時器
   - 時間：選擇適合的時段

### 8.5 測試

```bash
# 方法 1: 透過 CLI 執行（推薦）
clasp run testTaiwanRankTracker

# 方法 2: 在 GAS 編輯器中執行
# 開啟編輯器後手動執行 testTaiwanRankTracker()
npm run gas:open
```

### 8.6 觸發器狀態

目前已設定的觸發器：

| 函數 | 類型 | 排程 | 說明 |
|------|------|------|------|
| `sendWeeklyReport` | 時間驅動 | 每週 | 週報通知 |
| `trackTaiwanRank` | 時間驅動 | 每日 8-9 AM | 排名追蹤 |

---

## 9. Analytics 追蹤

### 9.1 Google Analytics 4 設定

| 項目 | 值 |
|------|-----|
| **Measurement ID** | `G-Q3BND056JE` |
| **Property 名稱** | Hour of AI Landing |
| **資料串流** | Web - hoa.junyiacademy.org |

### 9.2 追蹤事件

目前已設定的自動追蹤事件：

| 事件名稱 | 觸發時機 | 參數 |
|----------|----------|------|
| `page_view` | 頁面載入 | 自動 |
| `form_submission` | 表單成功提交 | `event_category`, `event_label` |

### 9.3 查看報表

1. 前往 [Google Analytics](https://analytics.google.com/)
2. 選擇帳戶 `jutor-a8ad8` → 資源 `Hour of AI Landing`
3. 報表 → 即時：查看當前訪客
4. 報表 → 參與 → 事件：查看表單提交等事件

---

## 10. 常見問題排除

### Q: 表單提交後 Google Sheets 沒有新資料？

1. 開啟 Browser Console (F12)
2. 檢查是否顯示 `🧪 Demo Mode` → 表示進入模擬模式
3. 如果是 Production 應顯示 `🔥 Detected Firebase Hosting`
4. 檢查 Network Tab 是否有 request 送出

### Q: 新增網域後表單無法提交？

1. 確認前端 `getFormSubmitUrl()` 有加入新網域判斷
2. 確認 Google Apps Script 白名單有加入新網域
3. 確認 Google Apps Script 有重新 Deploy

### Q: Vercel Preview 想要測試真實提交？

目前設計為 Demo Mode。如需測試真實提交：
1. 在 Google Apps Script 白名單加入 `*.vercel.app`（有安全風險）
2. 或在 URL 加上 `?apiUrl=YOUR_SCRIPT_URL` 參數

### Q: GA 沒有收到資料？

1. 開啟 Browser Console，搜尋 `gtag` 相關錯誤
2. 確認 Measurement ID 正確（`G-Q3BND056JE`）
3. 使用 GA 即時報表確認是否有收到事件
4. 注意：GA 報表有時會延遲數小時

---

## 11. SEO 與社群分享

### 11.1 Open Graph / Twitter Card

已設定社群媒體分享預覽：
- Open Graph tags（Facebook、LINE 等）
- Twitter Card（summary_large_image）
- 預覽圖片：均一首頁最新消息Hour-of-AI＿25Q3＿V1.jpg

**驗證工具**:
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)

### 11.2 SEO 檔案

| 檔案 | 路徑 | 用途 |
|------|------|------|
| sitemap.xml | /sitemap.xml | 網站地圖，協助搜尋引擎索引 |
| robots.txt | /robots.txt | 搜尋引擎爬蟲指引 |

### 11.3 效能優化

- **圖片 Lazy Loading**: 非首屏圖片使用 `loading="lazy"`
- **Theme Color**: 設定為 `#003D82`（均一深藍色）
- **Preconnect**: 已對 Google Fonts 等外部資源設定 preconnect

### 11.4 AI 爬蟲優化

| 檔案 | 路徑 | 用途 |
|------|------|------|
| llms.txt | /llms.txt | 提供給 AI 爬蟲的結構化網站說明 |
| JSON-LD | index.html head | Schema.org EducationalEvent 結構化資料 |

---

## 12. 專案結構

### 12.1 目錄架構

```
hour-of-ai-landing/
├── src/                    # 原始碼
│   ├── index.html          # HTML 模板
│   ├── styles/
│   │   └── main.css        # 樣式表
│   └── scripts/
│       └── main.js         # JavaScript
├── public/                 # 靜態資源（會直接複製到 dist/）
│   ├── favicon.ico
│   ├── robots.txt
│   ├── sitemap.xml
│   └── llms.txt
├── dist/                   # 建置輸出（由 Vite 產生）
├── package.json            # npm 設定
├── vite.config.js          # Vite 設定
├── firebase.json           # Firebase Hosting 設定
└── .github/workflows/      # GitHub Actions
```

### 12.2 建置工具

| 工具 | 版本 | 用途 |
|------|------|------|
| Vite | ^5.4.0 | 現代化前端建置工具 |
| Node.js | 20.x | 執行環境 |

### 12.3 npm 指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 啟動開發伺服器（localhost:5000） |
| `npm run build` | 建置 production 版本至 dist/ |
| `npm run preview` | 預覽建置結果 |
| `npm run lint` | 檢查程式碼品質 |
| `npm run lint:fix` | 自動修復 lint 問題 |
| `npm run format` | 格式化程式碼 |
| `npm run gas:push` | 推送 GAS 程式碼 |
| `npm run gas:deploy` | 部署 GAS 新版本 |

### 12.4 PWA 支援

| 檔案 | 說明 |
|------|------|
| manifest.json | PWA 配置（名稱、圖示、主題色） |
| sw.js | Service Worker（離線快取） |

PWA 功能：
- 可安裝到手機桌面
- 基本離線支援（Network First 策略）
- 主題色與啟動畫面

---

## 13. 未來規劃

- [x] ~~設定 GitHub Action，main branch merge 後自動部署到 Firebase~~ ✅ 已完成 (2026-01-23)
- [x] ~~加入 OG meta tags（社群媒體分享預覽）~~ ✅ 已完成 (2026-01-23)
- [x] ~~加入 sitemap.xml 和 robots.txt~~ ✅ 已完成 (2026-01-23)
- [x] ~~Lighthouse 優化（lazy loading、theme-color）~~ ✅ 已完成 (2026-01-23)
- [x] ~~模組化重構（Vite 建置、CSS/JS 分離）~~ ✅ 已完成 (2026-01-23)
- [x] ~~JSON-LD 結構化資料~~ ✅ 已完成 (2026-01-23)
- [x] ~~llms.txt（AI 爬蟲優化）~~ ✅ 已完成 (2026-01-23)
- [x] ~~PWA 支援（manifest.json + Service Worker）~~ ✅ 已完成 (2026-01-23)
- [x] ~~404 錯誤頁面~~ ✅ 已完成 (2026-01-23)
- [x] ~~移除 inline onclick（改用 addEventListener）~~ ✅ 已完成 (2026-01-23)
- [x] ~~ESLint + Prettier 設定~~ ✅ 已完成 (2026-01-23)
- [x] ~~安全性 Headers（Referrer-Policy, Permissions-Policy）~~ ✅ 已完成 (2026-01-23)
- [x] ~~Preload 關鍵資源~~ ✅ 已完成 (2026-01-23)
- [x] ~~設定 hoa.junyiacademy.org 網域指向 Firebase Hosting~~ ✅ 已完成 (DNS CNAME → hour-of-ai-landing-junyi.web.app)
- [x] ~~clasp 設定（GAS CLI 部署）~~ ✅ 已完成 (2026-01-29)
- [x] ~~GAS 自動部署 GitHub Actions（Phase 1）~~ 🗑️ 已移除 (2026-10-13，改回本機 clasp push)
- [x] ~~clasp run CLI 執行（GCP 專案連結 + OAuth 憑證）~~ ✅ 已完成 (2026-01-29)
- [ ] Cloud Functions 處理唯讀操作（Phase 2）
- [ ] 考慮是否需要 Staging 環境（介於 Preview 和 Production 之間）
- [ ] 正式 Apple Touch Icon（需 180x180 PNG）
- [ ] HTML 元件進一步拆分（header, footer, sections）
- [ ] 圖片 WebP 格式優化

---

## 14. 文件維護指引

> **給 AI 助手的指引**: 當進行以下變更時，請同步更新此文件：
> - 新增或修改部署環境
> - 變更白名單設定
> - 修改環境偵測邏輯
> - 新增開發流程或工具
> - 變更重要連結

---

*建立日期：2026-01-23*
*最後更新：2026-01-29 - 新增 clasp run CLI 執行設定*
