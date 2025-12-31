# Hour of AI 2025 - WordPress 智慧部署指南

**版本**: 2.0
**更新日期**: 2025-01-01
**適用於**: 所有 WordPress 環境 (不限主題)

---

## 🚀 新版智慧部署系統

Hour of AI 2025 現在支援智慧配置系統，讓 WordPress 部署變得極其簡單！

### ✨ 主要改進

- **🧠 智慧環境偵測**: 自動適應不同部署環境
- **🔧 零配置部署**: 只需設定一個環境變數即可
- **🔐 安全性增強**: 生產 API 不會意外暴露
- **🧪 內建測試模式**: 支援 Demo 和測試環境
- **📱 完整功能**: 統計面板、表單提交、CSRF 保護一應俱全

---

## 🚀 超簡單部署步驟 (2分鐘完成)

### 步驟 1: 設定 API 配置

在 WordPress 主題的 `functions.php` 或頁面 HTML 開頭添加：

```html
<script>
window.HOA_CONFIG = {
    FORM_SUBMIT_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'
};
</script>
```

**🔑 取得您的 Google Apps Script URL:**
1. 開啟您的 Google Apps Script 專案
2. 點選「部署」→「新增部署」
3. 複製 Web App URL
4. 替換上方的 `YOUR_SCRIPT_ID`

### 步驟 2: 複製完整 HTML

1. **開啟檔案**: `src/hour-of-ai-2025.html`
2. **全選複製**: Ctrl+A → Ctrl+C (完整內容)
3. **在 WordPress 中貼上**:
   - 新增頁面 → 使用 HTML 模式
   - 或 Elementor → HTML 元件
   - 或古騰堡 → 自定義 HTML 區塊

### 步驟 3: 發布即可！

- ✅ **儲存並發布** - 就是這麼簡單！
- ✅ **自動偵測環境** - 系統會自動配置
- ✅ **完整功能** - 統計、表單、地圖全部正常運作
- ✅ 表單功能正常運作
- ✅ 互動地圖正確載入
- ✅ 沒有與 WordPress 樣式衝突

---

## 🔧 技術規格

### CSS 架構

```css
.hour-of-ai {
    /* 根容器，提供樣式隔離 */
    position: relative;
    isolation: isolate;
    contain: layout style;
}
```

### 命名規範

- **CSS 類別前綴**: `hoa-` (Hour of AI)
- **CSS 變數前綴**: `--hoa-`
- **JavaScript ID 前綴**: `hoa` (如: `hoaRegistrationForm`)

### 響應式斷點

| 裝置類型 | 寬度範圍 | 對應 Elementor 斷點 |
|---------|---------|-------------------|
| 超大桌面 | 1200px+ | XL Desktop |
| 桌面 | 1025-1199px | Desktop |
| 平板橫向 | 768-1024px | Tablet |
| 平板直向 | 480-767px | Mobile Large |
| 手機 | 320-479px | Mobile |

### Z-index 層級

```css
/* WordPress 兼容的 Z-index 設定 */
--hoa-z-floating-cta: 999998;      /* 低於 Elementor (999999) */
--hoa-z-navigation: 999997;        /* 低於 WordPress Admin Bar */
--hoa-z-map-tooltip: 999996;       /* 地圖工具提示 */
```

---

## 🛠️ 設定需求

### 必要外部資源

Hour of AI 頁面需要以下外部資源，已內嵌在 HTML 中：

1. **字體**:
   - Google Fonts: Noto Sans TC

2. **地圖功能**:
   - Leaflet CSS (CDN)
   - Leaflet JavaScript (CDN)

3. **表單後端**:
   - Google Apps Script (需要設定)

### Google Apps Script 設定

修改 JavaScript 中的 `CONFIG.FORM_SUBMIT_URL`：

```javascript
const CONFIG = {
    FORM_SUBMIT_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
    ENABLE_ANALYTICS: false
};
```

---

## 🎨 樣式自訂

### 修改品牌顏色

在 CSS 自訂屬性中調整：

```css
.hour-of-ai {
    --hoa-color-primary-orange: #FF9F4D;  /* 主要橙色 */
    --hoa-color-primary-blue: #3B7DD6;    /* 主要藍色 */
    --hoa-color-primary-teal: #4DBFA3;    /* 主要青色 */
    --hoa-color-navy: #003D82;            /* 深藍色 */
    --hoa-color-yellow: #FFD166;          /* 黃色 */
    --hoa-color-coral: #FF6B6B;           /* 珊瑚色 */
}
```

### 調整間距

```css
.hour-of-ai {
    --hoa-spacing-xs: 0.5rem;   /* 8px */
    --hoa-spacing-sm: 1rem;     /* 16px */
    --hoa-spacing-md: 1.5rem;   /* 24px */
    --hoa-spacing-lg: 2rem;     /* 32px */
    --hoa-spacing-xl: 3rem;     /* 48px */
    --hoa-spacing-2xl: 4rem;    /* 64px */
    --hoa-spacing-3xl: 6rem;    /* 96px */
}
```

---

## ⚠️ 常見問題與解決方案

### 問題 1: 樣式衝突

**症狀**: 頁面樣式顯示異常或與 WordPress 主題衝突

**解決方案**:
```css
/* 增加樣式優先級 */
.hour-of-ai .hoa-element {
    property: value !important;
}
```

### 問題 2: JavaScript 衝突

**症狀**: 表單功能異常或 JavaScript 錯誤

**解決方案**:
- 確保所有 JavaScript 都包含在 IIFE 中
- 檢查控制台錯誤訊息
- 暫時停用其他外掛測試

### 問題 3: 響應式問題

**症狀**: 在某些裝置上顯示異常

**解決方案**:
```css
/* 強制移除可能的衝突 */
.hour-of-ai * {
    box-sizing: border-box !important;
}
```

### 問題 4: Admin Bar 重疊

**症狀**: WordPress 管理員工具列覆蓋導航

**解決方案**:
已內建處理：
```css
@media screen and (min-width: 783px) {
    .admin-bar .hour-of-ai .hoa-nav {
        top: 32px;
    }
}
```

---

## 📱 行動裝置最佳化

### 觸控友善設計

- 按鈕最小尺寸: 44px × 44px
- 表單欄位間距適當
- 滾動行為最佳化

### 效能最佳化

- 圖片使用 WebP 格式（向下兼容）
- CSS 和 JavaScript 已最小化
- 字體預載入優化

---

## 🔍 測試檢查清單

部署後請確認以下項目：

### 基本功能
- [ ] 頁面正確載入，無 404 錯誤
- [ ] 所有文字內容正確顯示
- [ ] 圖片正確載入
- [ ] 導航連結功能正常

### 表單功能
- [ ] 表單步驟切換正常
- [ ] 必填欄位驗證有效
- [ ] 條件式欄位顯示/隱藏正常
- [ ] 表單提交成功

### 視覺檢查
- [ ] 顏色和字體正確顯示
- [ ] 響應式設計在各裝置正常
- [ ] 動畫和過場效果流暢
- [ ] 與 WordPress 主題整合良好

### 效能檢查
- [ ] 頁面載入速度正常
- [ ] 無 JavaScript 錯誤
- [ ] CSS 無衝突警告

---

## 📞 技術支援

### 聯絡資訊
- **技術問題**: 請查看瀏覽器控制台錯誤
- **樣式問題**: 使用瀏覽器開發者工具檢查 CSS
- **功能問題**: 確認 JavaScript 是否正確載入

### 更新維護

定期檢查：
- WordPress 和 Elementor 版本兼容性
- 外部 CDN 資源可用性
- Google Apps Script 運行狀況

---

**最後更新**: 2025-12-26
**版本**: 1.0
**維護者**: 開發團隊