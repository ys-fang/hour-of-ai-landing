# Hour of AI Landing Page - 專案說明

## ⚠️ 上次進度
**更新時間**：2026-02-26

**本次完成項目**：
1. ✅ 新增 UpcomingEvents 管理指南（`docs/upcoming-events-guide.md`）
2. ✅ 確認 Active AI click tracking pipeline 正常（GA4 → GAS → ClickHistory）
3. ✅ CTA 漏斗優化：
   - Tab 1（首頁）& Tab 4（關於）：新增 sticky bottom bar → Active AI（含 GA4 tracking）
   - Tab 2（體驗）：Active AI showcase 移到最前面，近期推廣活動 carousel 移到下方
   - Tab 2 sticky bar 文案更新：「體驗好讚！」→「我要舉辦 Hour of AI」
   - AI Square 卡片移至「其他資源」區段（carousel 下方）
4. ✅ Playwright 驗證：3 個 Active AI CTA 全部正確觸發 `active_ai_click` GA4 event
5. ✅ PR #13 merged + 3 commits pushed to main，Firebase CI/CD 全部成功

**GA4 數據觀察**：
- `active_ai_click` 事件過去 7 天：135 次（+237.5%）
- Click tracking 從 2 個 CTA 增加到 4 個

**待觀察**：
- 下週週報確認 real user clicks 是否提升（目標 0.5-1% CTR）
- ClickHistory sheet 應從明天起有數據

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
