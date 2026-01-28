# Hour of AI Landing Page - 專案說明

## ⚠️ 上次進度
**更新時間**：2026-01-29
**待續話題**：未合併的「動態活動輪播」功能分支

### 待處理分支：`claude/latest-activities-hero-banner-GReal`

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

> 要繼續處理這個分支嗎？

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
