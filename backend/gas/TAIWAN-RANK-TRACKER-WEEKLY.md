# Taiwan Rank Tracker - 調整為每週執行

## 變更說明

將 Taiwan Rank Tracker 從**每日執行**改為**每週執行**（週二上午 9 點台灣時區）。

## 部署與 Trigger 設定

1. 本機 `cd backend/gas && clasp push`
2. 在 Apps Script Editor 執行一次 `setupRankTrackerTrigger`（會刪除舊的 `trackTaiwanRank` triggers 並建立每週二 9:00 的週觸發器）
   - 或手動：左側 **Triggers** > 編輯 `trackTaiwanRank` > Week timer > Tuesday > 9am to 10am

（2026-10-13 起不再經 GitHub Actions 部署，`ADMIN_TOKEN`／`GAS_ADMIN_TOKEN` 流程已移除。）

---

## 相關設定（Code.js）

```javascript
RANK_TRACKER_DAY: 2,    // 週二
RANK_TRACKER_HOUR: 9,   // 上午 9 點（台灣時區）
```

---
*更新日期：2026-03-24*
