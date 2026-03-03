# Hour of AI Landing Page - 專案說明

## ⚠️ 上次進度
**更新時間**：2026-03-04

**本次完成項目**：
1. ✅ **GA4 Click Tracking 修復**（根因排除）
   - 根因：`GA4_PROPERTY_ID` 設錯（`266069252` → `521199085`）
   - 後端查詢了錯誤的 GA4 property，導致 click 數據永遠是 0
   - 修正後驗證：`active_ai_click: 278 次`、`ai_square_click: 5 次`
   - PR #14 merged，已 `clasp push` 部署
   - 新增 `debugGA4ClickTracking()` 診斷函式

2. ✅ **全球排名載入加速**
   - 新增 GAS `?action=getGlobalRank` endpoint，從 GlobalTop10History sheet 讀預計算數據
   - 前端改用 API call 取代直接 fetch CSV（~1-2s → ~200-500ms）
   - 新增 loading skeleton 動畫（取代靜態 "--" 佔位符）

3. ✅ **活動輪播多處放置**
   - 重構 carousel 為 `EventsCarousel` class（支援多實例）
   - Tab 1（首頁）：在全球排名與縣市地圖之間新增 carousel
   - Tab 2（體驗）：保留原有 carousel
   - 兩處共用資料（fetch 一次），獨立運作

**待辦**：
- 需要 `clasp push` 部署 getGlobalRank endpoint
- 需要 push to main 觸發 Firebase 前端部署
- 下週二週報應顯示正確的 click 數據

> 要繼續這個討論嗎？

---

## 已完成項目 ✅

- [x] **Taiwan Rank Tracker 部署修復**（2026-02-05）
  - 問題：2/5 日報缺少 Top 10 Google Sheet 資料與連結
  - 根因：`Code.js` 修改後未執行 `clasp push`，trigger 執行舊版本
  - 修復：執行 `clasp push` 部署最新程式碼
  - 新增：建立 `DEPLOYMENT-CHECKLIST.md` 防止未來再發生
  - 確認：手動執行 `testTaiwanRankTracker()` 補上 2/5 資料

- [x] **GA4 週報修復**（2026-02-03）
  - 問題：週報 GA4 區塊顯示「⚠️ GA4 數據取得失敗」
  - 根因：GCP 專案 `293501829424` 未啟用 Google Analytics Data API
  - 修復：在 GCP Console 啟用 `analyticsdata.googleapis.com`
  - 確認：GA4 資料串流正確追蹤 `hoa.junyiacademy.org`

- [x] **Global Top 10 Countries Tracker**（2026-02-02）
  - 每日自動記錄全球 Top 10 國家到 `GlobalTop10History` 工作表
  - Slack 排名通知包含試算表歷史資料連結
  - 新增 `logGlobalTop10ToSheet()`, `analyzeTaiwanRankFromSorted()` 函數
- [x] **活動輪播增強 - 日期與狀態徽章**（2026-01-30）
  - 新增活動狀態徽章：已舉行/進行中/即將舉行
  - 新增活動日期顯示
  - 智慧過濾：未來+進行中+最近3場已結束活動
  - 過去活動視覺區分（降飽和度）
- [x] **動態活動輪播 CMS**（2026-01-30）
  - Google Sheets「UpcomingEvents」工作表控制活動顯示
  - GAS API `getUpcomingEvents` endpoint（部署 @18）
  - 前端 30 分鐘快取 + fallback 降級策略
  - 57 個自動化測試
- [x] **前端 Emoji → Material Icons**（2026-01-30）
- [x] WordPress 舊路徑轉導至 hoa.junyiacademy.org（2026-01-29）
- [x] GAS Statistics API 修復（openById 取代 getActiveSpreadsheet）
- [x] clasp run CLI 設定與文件化
- [x] Footer 連結更新

---

> **DevOps 技術文件**: 詳細的部署架構與開發流程請參閱 [DEVOPS.md](./DEVOPS.md)
> 當有架構或部署相關變更時，請同步更新該文件。

---

## clasp CLI 使用指南（GAS 開發）

### 可用功能

| 指令 | 用途 | 狀態 |
|------|------|------|
| `clasp push` | 部署程式碼到 GAS | ✅ 可用 |
| `clasp pull` | 從 GAS 拉取程式碼 | ✅ 可用 |
| `clasp logs` | 查看執行日誌 | ✅ 可用 |
| `clasp deploy` | 建立新版本部署 | ✅ 可用 |
| `clasp run <func>` | 執行函數 | ⚠️ 有限制 |

### `clasp run` 限制說明

**問題**：`clasp run` 無法執行使用以下 API 的函數：
- `UrlFetchApp`（需要 `script.external_request` scope）
- `SpreadsheetApp`（需要 `spreadsheets` scope）
- `MailApp`（需要 `script.send_mail` scope）

**原因**：clasp 的 OAuth 登入只包含專案管理相關的 scopes，不包含腳本執行所需的 API scopes。這是 clasp 工具本身的限制，非專案設定問題。

**錯誤訊息範例**：
```
❌ Error: You do not have permission to call UrlFetchApp.fetch.
Required permissions: https://www.googleapis.com/auth/script.external_request
```

### 建議的開發流程

```
1. 修改 backend/gas/Code.js
2. clasp push                    ← CLI 部署（⚠️ 必須執行！）
3. Apps Script 編輯器執行測試     ← 瀏覽器（首次需授權）
4. clasp logs | grep "關鍵字"    ← CLI 查看結果
```

**⚠️ 重要提醒**：修改 `Code.js` 後**必須執行 `clasp push`**，否則 trigger 會執行舊版本！

📋 完整部署流程請參閱：[backend/gas/DEPLOYMENT-CHECKLIST.md](./backend/gas/DEPLOYMENT-CHECKLIST.md)

### 生產環境執行

使用 **Time-based Trigger**（時間驅動觸發器）：
- 不受 OAuth scope 限制
- 可執行所有 GAS API
- 設定位置：Apps Script Editor → Triggers

### 常用指令

```bash
cd backend/gas

# 部署程式碼
clasp push

# 查看最近日誌
clasp logs | head -30

# 篩選特定日誌
clasp logs | grep "Taiwan"
clasp logs | grep "Error"

# 建立新版本
clasp deploy --description "版本說明"
```

### OAuth 設定檔案

- `.clasp.json` - 專案設定（scriptId, projectId）
- `creds.json` - OAuth 憑證（**已加入 .gitignore**）
- `~/.clasprc.json` - 全域登入狀態

### 重新設定 OAuth（如遇權限問題）

```bash
rm -f ~/.clasprc.json
clasp login --creds creds.json
```

---

## 專案架構

```
Frontend: Firebase Hosting (hour-of-ai-landing-junyi.web.app)
    ↓
Backend: Google Apps Script (維持現有)
    ↓
Database: Google Sheets (維持現有)
```

## 重要連結

- **Firebase Console**: https://console.firebase.google.com/project/hour-of-ai-landing-junyi
- **Firebase Hosting URL**: https://hour-of-ai-landing-junyi.web.app
- **GitHub Repo**: https://github.com/ys-fang/hour-of-ai-landing

---
*建立日期：2026-01-23*
*更新日期：2026-02-05*
