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
│   Production: hoa.junyiacademy.org (未來)                       │
│   目前: hour-of-ai-landing-junyi.web.app                        │
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
| **URL（目前）** | https://hour-of-ai-landing-junyi.web.app |
| **URL（未來）** | https://hoa.junyiacademy.org |
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
| **URL** | http://localhost:5000 (或其他 port) |
| **模式** | Demo Mode（不會實際提交到 Google Sheets）|
| **啟動方式** | 任意靜態伺服器，如 `npx serve .` |

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

當 push 到 `main` branch 時，GitHub Actions 會自動部署到 Firebase Hosting。

**Workflow 檔案**: `.github/workflows/firebase-deploy.yml`

**相關設定**:
- Service Account: `github-actions-deploy@hour-of-ai-landing-junyi.iam.gserviceaccount.com`
- GitHub Secret: `FIREBASE_SERVICE_ACCOUNT`
- 權限: Firebase Hosting Admin

**查看部署狀態**: [GitHub Actions](https://github.com/ys-fang/hour-of-ai-landing/actions)

### 5.3 手動部署（備用）

如需手動部署，可使用：

```bash
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

## 7. Analytics 追蹤

### 7.1 Google Analytics 4 設定

| 項目 | 值 |
|------|-----|
| **Measurement ID** | `G-Q3BND056JE` |
| **Property 名稱** | Hour of AI Landing |
| **資料串流** | Web - hoa.junyiacademy.org |

### 7.2 追蹤事件

目前已設定的自動追蹤事件：

| 事件名稱 | 觸發時機 | 參數 |
|----------|----------|------|
| `page_view` | 頁面載入 | 自動 |
| `form_submission` | 表單成功提交 | `event_category`, `event_label` |

### 7.3 查看報表

1. 前往 [Google Analytics](https://analytics.google.com/)
2. 選擇帳戶 `jutor-a8ad8` → 資源 `Hour of AI Landing`
3. 報表 → 即時：查看當前訪客
4. 報表 → 參與 → 事件：查看表單提交等事件

---

## 8. 常見問題排除

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

## 9. 未來規劃

- [x] ~~設定 GitHub Action，main branch merge 後自動部署到 Firebase~~ ✅ 已完成 (2026-01-23)
- [ ] 設定 hoa.junyiacademy.org 網域指向 Firebase Hosting（程式碼已準備好，等待 DNS 設定）
- [ ] 考慮是否需要 Staging 環境（介於 Preview 和 Production 之間）
- [ ] 加入 OG meta tags（社群媒體分享預覽）
- [ ] 加入 Apple Touch Icon
- [ ] PWA 支援

---

## 10. 文件維護指引

> **給 AI 助手的指引**: 當進行以下變更時，請同步更新此文件：
> - 新增或修改部署環境
> - 變更白名單設定
> - 修改環境偵測邏輯
> - 新增開發流程或工具
> - 變更重要連結

---

*建立日期：2026-01-23*
*最後更新：2026-01-23 - 新增 hoa.junyiacademy.org 支援*
