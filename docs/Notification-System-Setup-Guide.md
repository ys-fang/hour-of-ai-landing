# Hour of AI 通知系統設定指南

## 📋 概述

通知系統包含兩大功能：
1. **即時通知**：每次新報名時自動發送 Slack 訊息
2. **週報**：每週二上午 9:00 自動發送統計報告

所有功能都可透過簡單的開關控制，無需修改程式邏輯。

---

## 🔧 快速設定步驟

### Step 1：建立 Slack Webhook URL

1. 前往 Slack workspace
2. 進入 **Apps** > 搜尋並安裝 **Incoming Webhooks**
3. 選擇要接收通知的 channel（例如：`#hour-of-ai`）
4. 複製生成的 Webhook URL（格式：`https://hooks.slack.com/services/...`）
5. **⚠️ 妥善保管這個 URL，不要公開分享或提交到 GitHub！**

📖 詳細教學：https://api.slack.com/messaging/webhooks

### Step 2：設定 Google Apps Script - Slack Webhook URL

**🔒 重要：為了安全，我們使用 Script Properties 儲存 Webhook URL，而不是直接寫在程式碼中。**

#### 方法 A：使用輔助函數設定（推薦）

1. 開啟 Google Apps Script 編輯器
2. 在頂部函數選單選擇 `setSlackWebhookURL`
3. 點擊「執行」按鈕
4. 當提示授權時，允許必要的權限
5. 執行完成後，檢查 Logs 確認設定成功

或直接在編輯器中執行：
```javascript
setSlackWebhookURL('https://hooks.slack.com/services/YOUR/WEBHOOK/URL');
```

#### 方法 B：手動在 Script Properties 設定

1. Apps Script 編輯器 > 左側選單 > **專案設定** (Project Settings)
2. 向下滾動到 **Script Properties** 區段
3. 點擊 **新增 Script Property**
4. 設定：
   - **屬性名稱**：`SLACK_WEBHOOK_URL`
   - **值**：貼上你的 Slack Webhook URL
5. 點擊 **儲存**

#### 驗證設定

執行以下函數測試連線：
```javascript
testInstantNotification()
```
檢查 Logs 和 Slack channel 是否收到測試訊息。

### Step 3：設定週報時間觸發器

週報需要手動設定 Google Apps Script 觸發器：

1. 在 Apps Script 編輯器中，點擊左側選單的 **⏰ 觸發條件** (Triggers)
2. 點擊右下角 **+ 新增觸發條件**
3. 設定如下：
   - **選擇要執行的函式**：`sendWeeklyReport`
   - **選擇活動來源**：`時間驅動` (Time-driven)
   - **選擇時間型觸發條件類型**：`週計時器` (Week timer)
   - **選擇星期幾**：`每週二` (Every Tuesday)
   - **選擇時段**：`上午 9 時至 10 時` (9am to 10am)
   - **失敗通知設定**：`立即通知我` (Notify me immediately)
4. 點擊 **儲存**

### Step 4：測試功能

⚠️ **重要：先確認 Step 2 已正確設定 Slack Webhook URL！**

#### 測試即時通知
在 Apps Script 編輯器中執行：
```javascript
testInstantNotification()
```
檢查 Slack channel 是否收到測試訊息。

#### 測試週報
在 Apps Script 編輯器中執行：
```javascript
testWeeklyReport()
```
檢查 Slack channel 是否收到週報。

如果沒收到訊息，檢查 Logs 是否顯示「Slack Webhook URL not configured」。

---

## 🎛️ 功能開關說明

所有開關都位於 `NOTIFICATION_CONFIG` 區塊中，修改後儲存即可生效。

### 開啟/關閉即時通知
```javascript
ENABLE_INSTANT_NOTIFICATION: true,  // true = 開啟, false = 關閉
```

### 開啟/關閉週報
```javascript
ENABLE_WEEKLY_REPORT: true,  // true = 開啟, false = 關閉
```

### 開啟/關閉 Email 通知（舊功能）
```javascript
ENABLE_EMAIL_NOTIFICATION: false,  // true = 開啟, false = 關閉
```

### 修改 Email 收件者
```javascript
EMAIL_RECIPIENTS: ['support@junyiacademy.org', 'your-email@example.com'],
```

### 修改週報時間
```javascript
WEEKLY_REPORT_DAY: 2,    // 0=週日, 1=週一, 2=週二, ..., 6=週六
WEEKLY_REPORT_HOUR: 9,   // 24 小時制，9 = 上午 9 點
```

### 自訂 Slack Bot 名稱和圖示
```javascript
SLACK_USERNAME: 'Hour of AI Bot',  // Bot 顯示名稱
SLACK_ICON_EMOJI: ':robot_face:',  // Bot 圖示 emoji
```

---

## 📊 通知內容範例

### 即時通知範例
```
🎉 新的 Hour of AI 活動報名！

📅 報名時間：2025-01-02 14:30:00
👤 聯絡人：王小明
📧 Email：wang@example.com
📍 縣市：台北市
🏫 機構類型：學校
🏫 學校名稱：台北市立某某國中
👥 預計參與人數：50

📊 累計報名活動數：328 場

🔗 查看完整資料：https://docs.google.com/spreadsheets/...
```

### 週報範例
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Hour of AI 週報 | 12/26 - 1/2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 核心成長指標
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 本週新增活動：45 場 📈 (+28.0% vs 上週)
✅ 累計總活動：328 場
👥 本週新增參與：2,150 人 📈 (+35.0% vs 上週)
🎓 累計總參與：18,420 人

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗺️ 市場滲透
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 本週活躍縣市：12 個
🏆 前三名：
   🥇 台北市 - 85 場
   🥈 新北市 - 62 場
   🥉 台中市 - 48 場

📍 覆蓋率：77.3% (17/22 縣市)
⚠️ 待開發：花蓮縣、台東縣、澎湖縣、金門縣、連江縣

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏫 客戶分群
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
本週新增：
   • 學校：30 場
   • 教育機構：10 場
   • 企業：3 場
   • 其他：2 場

平均參與人數：47.8 人/場
🤝 Code.org 合作意願率：85.0%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ 本週亮點
🎉 活動報名成長 28.0%，表現優異！

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 查看完整資料：https://docs.google.com/spreadsheets/...
```

---

## 🔍 除錯與測試

### 檢視執行記錄
1. Apps Script 編輯器 > 左側選單 > **執行** (Executions)
2. 查看最近的執行狀態和錯誤訊息

### 檢視 Log
1. 執行任何測試函數後
2. Apps Script 編輯器 > 左側選單 > **記錄** (Logs)
3. 或按 `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### 常見問題

**Q: Slack 沒收到通知？**
- 確認 Slack Webhook URL 已在 Script Properties 中正確設定
- 執行 `getSlackWebhookURL()` 檢查是否有值
- 確認對應的開關為 `true`（在 `NOTIFICATION_CONFIG` 中）
- 檢查 Execution logs 是否有錯誤訊息
- 執行 `testInstantNotification()` 測試連線

**Q: 週報沒有自動發送？**
- 確認觸發器已正確設定（檢查 Triggers 頁面）
- 確認 `ENABLE_WEEKLY_REPORT: true`
- 觸發器首次執行需等到下一個週二上午

**Q: 想暫時停用所有通知？**
```javascript
ENABLE_INSTANT_NOTIFICATION: false,
ENABLE_WEEKLY_REPORT: false,
ENABLE_EMAIL_NOTIFICATION: false,
```

**Q: 如何更換 Slack Webhook URL？**
重新執行：
```javascript
setSlackWebhookURL('新的-webhook-url');
```
或在 Script Properties 中手動更新 `SLACK_WEBHOOK_URL` 的值。

**Q: 為什麼要用 Script Properties 而不是寫在程式碼中？**
- 🔒 **安全性**：避免敏感資料被提交到 GitHub 或公開
- 🔄 **易於管理**：更換 URL 不需重新部署程式碼
- ✅ **最佳實踐**：符合業界標準的環境變數管理方式

---

## 🚀 進階客製化

### 修改即時通知內容
編輯 `sendInstantNotification()` 函數中的 `message` 變數（約第 623-636 行）

### 修改週報內容
編輯 `formatWeeklyReport()` 函數中的 `message` 變數（約第 852-888 行）

### 修改週報統計邏輯
編輯 `calculateWeeklyStats()` 函數（約第 698-821 行）

### 更換為其他通訊工具
將 `sendToSlack()` 函數改為調用其他 API（如 Discord, Teams 等）

---

## 📝 版本記錄

- **v3.0** (2025-01-02)
  - 新增：即時 Slack 通知
  - 新增：自動週報系統
  - 新增：統一配置管理（NOTIFICATION_CONFIG）
  - 優化：簡化開關機制

- **v2.0** (2024-12-30)
  - 支援雙 timestamp 儲存
  - 台灣時區人類可讀格式

---

## 💬 需要協助？

如有問題或建議，請聯繫開發團隊。
