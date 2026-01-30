# Hour of AI Landing Page - 專案說明

## 已完成項目 ✅

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
*更新日期：2026-01-30*
