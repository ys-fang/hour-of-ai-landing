# Hour of AI Landing Page - 專案說明

## ⚠️ 上次進度
**更新時間**：2026-01-29
**待續話題**：前端 emoji 圖示標準化 + 未合併功能分支

### 待處理任務

#### 1. 前端 Emoji 替換為 Material Icons

將 `src/index.html` 中的 emoji 替換為專案已使用的 Material Icons，確保視覺一致性與跨平台顯示穩定。

**需替換的 emoji（AI 素養四大支柱區塊）**：

| Emoji | 位置 | 建議 Material Icon |
|-------|------|-------------------|
| 🎯 | 問 AI - 精準提問 | `gps_fixed` 或 `track_changes` |
| 🔄 | 問 AI - 迭代追問 | `sync` 或 `autorenew` |
| 🧠 | 問 AI - 框架思維 | `psychology` |
| ✏️ | 用 AI - 生活單點 | `edit` 或 `draw` |
| 🔗 | 用 AI - 專業串聯 | `link` 或 `hub` |
| 🤖 | 用 AI - 自主代理 | `smart_toy` 或 `precision_manufacturing` |
| 👁️ | 管 AI - 管好一 AI | `visibility` |
| 🎛️ | 管 AI - 管好群 AI | `tune` 或 `settings_input_component` |
| 👔 | 管 AI - 管好人機協作 | `supervisor_account` 或 `groups` |
| 📦 | 造 AI - 封裝經驗 | `inventory_2` 或 `widgets` |
| 🧩 | 造 AI - 連結知識 | `extension` 或 `category` |
| 🏗️ | 造 AI - 深入場景 | `construction` 或 `architecture` |
| 💡 | 各區塊洞見提示 | `lightbulb` |

**相關檔案**：`src/index.html` 第 488-745 行（pillar tabs 區塊）

---

#### 2. 未合併分支：`claude/latest-activities-hero-banner-GReal`

此分支實作了「透過 Google Sheets 設定推廣活動」功能，但尚未合併到 main。

**功能說明**：
- 將「近期推廣活動」輪播從硬編碼改為 Google Sheets 資料來源
- 新增 `getUpcomingEvents` GAS API endpoint
- 實作 30 分鐘快取與降級策略
- 包含 57 個自動化測試

**Google Sheets 設定方式**：
1. 新增「UpcomingEvents」工作表
2. 欄位：`id`, `title`, `description`, `url`, `startDate`, `endDate`, `isActive`, `sortOrder`
3. `isActive=TRUE` 顯示，`FALSE` 隱藏
4. 過期活動自動隱藏

**相關檔案**：
- `backend/google-apps-script-upcoming-events.js` - GAS API
- `src/scripts/eventsService.js` - 前端服務模組
- `tests/` - 測試檔案

**決策點**：是否要合併此功能？需要先檢視程式碼品質與測試覆蓋率。

---

### 已完成項目 ✅
- [x] WordPress 舊路徑轉導至 hoa.junyiacademy.org（2026-01-29）
- [x] GAS Statistics API 修復（openById 取代 getActiveSpreadsheet）
- [x] clasp run CLI 設定與文件化
- [x] Footer 連結更新

> 要先處理 emoji 替換任務嗎？

---

> **DevOps 技術文件**: 詳細的部署架構與開發流程請參閱 [DEVOPS.md](./DEVOPS.md)
> 當有架構或部署相關變更時，請同步更新該文件。

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
