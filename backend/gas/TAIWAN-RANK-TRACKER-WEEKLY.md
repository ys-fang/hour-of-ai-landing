# Taiwan Rank Tracker - 調整為每週執行

## 變更說明

將 Taiwan Rank Tracker 從**每日執行**改為**每週執行**（週二上午 9 點台灣時區）。

## 全自動部署（推薦）

### 一次性設定（只需做一次）

#### 1. 在 GAS 設定 ADMIN_TOKEN

1. 開啟 [Apps Script Editor](https://script.google.com/)
2. 左側選單 > **專案設定**（齒輪圖示）
3. 捲到 **Script Properties** 區塊
4. 新增屬性：
   - Property: `ADMIN_TOKEN`
   - Value: 自訂一個安全的 token（例如：`your-secure-random-token-123`）

#### 2. 在 GitHub 設定 Secret

1. 開啟 GitHub Repo > **Settings** > **Secrets and variables** > **Actions**
2. 新增 Repository secret：
   - Name: `GAS_ADMIN_TOKEN`
   - Value: 與上面設定的相同 token

### 之後的部署流程

只需 **Merge PR 到 main**，GitHub Action 會自動：
1. `clasp push` 部署程式碼
2. 呼叫 API 設定 Trigger（每週二 9:00）

---

## 手動部署（備用方案）

如果未設定 `GAS_ADMIN_TOKEN`，需手動修改 Trigger：

1. 開啟 [Apps Script Editor](https://script.google.com/)
2. 左側選單 > **Triggers**（時鐘圖示）
3. 找到 `trackTaiwanRank` 觸發器，點擊編輯
4. 修改為：Week timer > Tuesday > 9am to 10am

或者在 Apps Script Editor 執行 `setupRankTrackerTrigger` 函數。

---

## 相關設定（Code.js）

```javascript
RANK_TRACKER_DAY: 2,    // 週二
RANK_TRACKER_HOUR: 9,   // 上午 9 點（台灣時區）
```

---
*更新日期：2026-03-24*
