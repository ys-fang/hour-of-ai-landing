# Taiwan Rank Tracker - 調整為每週執行

## 變更說明

將 Taiwan Rank Tracker 從**每日執行**改為**每週執行**（週二上午 9 點台灣時區）。

## 部署步驟

### Step 1: Merge PR 到 main

合併後 GitHub Action (`gas-deploy.yml`) 會自動執行 `clasp push`。

### Step 2: 修改 Trigger（手動）

1. 開啟 [Apps Script Editor](https://script.google.com/)
2. 選擇 Hour of AI 專案
3. 左側選單點選 **Triggers**（時鐘圖示）
4. 找到 `trackTaiwanRank` 觸發器，點擊編輯（鉛筆圖示）
5. 修改設定：

| 設定項目 | 值 |
|----------|-----|
| Choose which function to run | `trackTaiwanRank` |
| Select event source | Time-driven |
| Select type of time based trigger | **Week timer** |
| Select day of week | **Tuesday** |
| Select time of day | **9am to 10am** |

6. 點擊 **Save**

### Step 3: 驗證

執行測試函數確認功能正常：

```
Apps Script Editor > 選擇 testTaiwanRankTracker > Run
```

檢查 Slack `#hour-of-ai` 頻道是否收到測試訊息。

## 相關設定（Code.js）

```javascript
// CONFIG 中的相關設定
RANK_TRACKER_DAY: 2,    // 週二 (0=週日, 1=週一, ..., 6=週六)
RANK_TRACKER_HOUR: 9,   // 上午 9 點（台灣時區）
```

---
*更新日期：2026-03-24*
