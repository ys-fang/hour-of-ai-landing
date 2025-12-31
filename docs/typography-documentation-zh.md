# Hour of AI 網站字體排版系統文件

## 🎯 簡化摘要 (2025年12月30日更新)

**字體系統已大幅簡化**：
- **字體大小**: 從 8 個減少到 **6 個** (移除 lg、4xl)
- **字體粗細**: 從 5 個減少到 **3 個** (移除 medium、extrabold)
- **維護性**: 更簡單的選擇，更一致的使用
- **視覺層次**: 保持清晰的層次結構

## 📋 目錄
- [CSS 變數定義](#css-變數定義)
- [全域字體設定](#全域字體設定)
- [標題層次結構](#標題層次結構)
- [區段字體設定](#區段字體設定)
- [表單元素字體](#表單元素字體)
- [按鈕字體](#按鈕字體)
- [響應式設定](#響應式設定)

---

## CSS 變數定義

### 字體大小階層 (簡化版)
```css
--font-size-xs: 0.875rem;      /* 14px - 提示文字、小型 UI 元素 */
--font-size-sm: 1rem;          /* 16px - 內文、按鈕、標籤 */
--font-size-base: 1.125rem;    /* 18px - 主要內文 */
--font-size-xl: 1.5rem;        /* 24px - h4、h5、組件標題 */
--font-size-2xl: 2rem;         /* 32px - h3、區段副標題 */
--font-size-3xl: 2.5rem;       /* 40px - h1、h2、區段標題 */
```

### 字體粗細階層 (簡化版)
```css
--font-weight-normal: 400;     /* 一般文字、內文 */
--font-weight-semibold: 600;   /* 提示文字、h5、h6、輕微強調 */
--font-weight-bold: 700;       /* h1-h4、按鈕、標籤、強調 */
```

### 行高設定
```css
--line-height-tight: 1.2;      /* 標題使用 */
--line-height-normal: 1.5;     /* UI 元素使用 */
--line-height-relaxed: 1.8;    /* 內文使用 */
```

---

## 全域字體設定

### 基礎設定
```css
body {
    字體: Noto Sans TC (主要)、系統預設字體
    字體大小: 18px (--font-size-base)
    字體粗細: 400 (--font-weight-normal)
    行高: 1.8 (--line-height-relaxed)
    顏色: #1A1A1A (--color-text-primary)
}
```

### HTML 根設定
```css
html {
    字體大小: 16px (--font-size-sm)
    滾動行為: 平滑滾動
}
```

---

## 標題層次結構

### H1 - 主標題 (僅限首頁英雄區塊)
- **字體大小**: 40px (--font-size-3xl)
- **字體粗細**: 700 (--font-weight-bold)
- **行高**: 1.2 (--line-height-tight)
- **顏色**: #003D82 (--color-navy)
- **使用位置**:
  - 首頁主標題「AI 素養起步走，擁抱 AI,讓學習力再進化」

### H2 - 區段標題
- **字體大小**: 40px (--font-size-3xl)
- **字體粗細**: 700 (--font-weight-bold)
- **行高**: 1.2 (--line-height-tight)
- **顏色**: #003D82 (--color-navy)
- **使用位置**:
  - 「什麼是 Hour of AI?」
  - 「AI 素養四大支柱」
  - 「舉辦 Hour of AI 活動」
  - 表單各頁面標題 (主辦人資訊、機構資料、活動規劃、確認提交)
  - 成功頁面標題「感謝您成為 AI 教育推手！」

### H3 - 子區段標題
- **字體大小**: 32px (--font-size-2xl)
- **字體粗細**: 700 (--font-weight-bold)
- **行高**: 1.2 (--line-height-tight)
- **顏色**: #003D82 (--color-navy)
- **使用位置**:
  - 四大支柱標題 (問 AI、用 AI、管 AI、造 AI)
  - 統計面板標題 (台灣活動分布圖、縣市排行榜、最新活動規劃)
  - 聯絡資訊標題「有疑問嗎？我們隨時為您服務」
  - 重要說明標題

### H4 - 組件標題
- **字體大小**: 24px (--font-size-xl)
- **字體粗細**: 700 (--font-weight-bold)
- **行高**: 1.5 (--line-height-normal)
- **顏色**: #003D82 (--color-navy)
- **使用位置**:
  - 活動詳細內容標題
  - 頁尾區段標題 (相關連結、聯絡我們)

### H5 - 小標題
- **字體大小**: 24px (--font-size-xl)
- **字體粗細**: 600 (--font-weight-semibold)
- **行高**: 1.5 (--line-height-normal)
- **顏色**: #1A1A1A (--color-text-primary)
- **使用位置**:
  - 活動亮點標題

---

## 區段字體設定

### 首頁英雄區塊
```css
主標題 H1: 48px / 900 / 1.2 / #003D82
副標題 P: 20px / 400 / 1.8 / #666666
```

### 理念區塊 (AI 不是特權)
```css
標題 H2: 40px / 900 / 1.2 / 預設色彩
內文 P: 16px / 400 / 1.5 / 90% 透明度
```

### 統計面板
```css
數字顯示: 40px / 900 / 1.2 / 預設色彩 (平板: 32px, 手機: 依比例縮放)
標籤文字: 16px / 500 / 1.5 / #666666
```

### AI 四大支柱
```css
支柱標題 H3: 24px / 700 / 1.2 / #003D82
支柱說明 P: 16px / 400 / 1.8 / #666666
```

### 活動卡片
```css
活動標題 H3: 24px / 700 / 1.2 / #003D82
活動說明 P: 16px / 400 / 1.8 / #666666
活動亮點標題 H5: 20px / 600 / 1.5 / #1A1A1A
活動詳細內容: 16px / 400 / 1.8 / #666666
```

### 表單區域
```css
頁面標題 H2: 40px / 900 / 1.2 / #003D82
頁面副標題: 18px / 400 / 1.5 / #666666
欄位標籤: 16px / 700 / 1.5 / #1A1A1A
輸入欄位: 16px / 400 / 1.5 / 繼承顏色
提示文字: 14px / 500 / 1.5 / #666666
錯誤訊息: 14px / 500 / 1.5 / #FF6B6B
```

### 成功頁面
```css
標題 H2: 40px / 900 / 1.2 / #003D82
內文 P: 18px / 400 / 1.8 / #666666
```

### 頁尾
```css
區段標題 H4: 20px / 700 / 1.5 / 預設色彩
連結文字: 預設設定
版權資訊: 較小字體
```

---

## 表單元素字體

### 輸入欄位 (input, select, textarea)
```css
字體大小: 16px (--font-size-sm)
字體粗細: 400 (--font-weight-normal)
行高: 1.5 (--line-height-normal)
字體族: 繼承父層設定
```

### 標籤 (label)
```css
字體大小: 16px (--font-size-sm)
字體粗細: 700 (--font-weight-bold)
行高: 1.5 (--line-height-normal)
顏色: #1A1A1A (--color-text-primary)
```

### 提示文字 (.form-hint)
```css
字體大小: 14px (--font-size-xs)
字體粗細: 500 (--font-weight-medium)
行高: 1.5 (--line-height-normal)
顏色: #666666 (--color-text-secondary)
```

### 錯誤訊息 (.form-error)
```css
字體大小: 14px (--font-size-xs)
字體粗細: 500 (--font-weight-medium)
行高: 1.5 (--line-height-normal)
顏色: #FF6B6B (--color-coral)
```

### 進度指示器標籤
```css
字體大小: 14px (--font-size-xs)
字體粗細: 500 (--font-weight-medium)
行高: 1.5 (--line-height-normal)
顏色: #1A1A1A (--color-text-primary)
```

---

## 按鈕字體

### 主要按鈕 (.btn)
```css
字體大小: 16px (--font-size-sm)
字體粗細: 700 (--font-weight-bold)
行高: 1.5 (--line-height-normal)
字體族: 繼承父層設定
```

### 導航按鈕 (上一步/下一步/提交)
```css
字體大小: 16px (--font-size-sm)
字體粗細: 700 (--font-weight-bold)
行高: 1.5 (--line-height-normal)
內距: 中等 × 超大 (--spacing-md × --spacing-xl)
邊框圓角: 完全圓角 (--border-radius-full)
```

### 次要按鈕
```css
基礎設定同主要按鈕
不同顏色配色方案:
- 主要按鈕: 橙黃漸層背景 + 深藍文字
- 次要按鈕: 白色背景 + 藍色文字 + 藍色邊框
- 提交按鈕: 青藍漸層背景 + 白色文字
```

---

## 響應式設定 (簡化版)

### 平板 (max-width: 1024px)
```css
--font-size-3xl: 32px (從 40px)
--font-size-2xl: 28px (從 32px)
--font-size-xl: 22px (從 24px)
統計數字: 32px
```

### 手機 (max-width: 480px)
```css
--font-size-3xl: 28px (從 40px)
--font-size-2xl: 24px (從 32px)
--font-size-xl: 20px (從 24px)
```

### 表單響應式
```css
手機版本:
- 進度指示器標籤: 10px
- 進度指示器字重: 400 (正常)
- 聯絡資訊標題: 20px (從 24px)
- 聯絡資訊內文: 16px (從 18px)
```

---

## 特殊元素字體

### Material Icons
```css
small: 16px (--font-size-sm)
medium: 24px (--font-size-xl)
large: 36px (計算值: --font-size-xl × 1.5)
```

### 工具提示與提示框
```css
字體大小: 14px (--font-size-xs)
字體粗細: 500 (--font-weight-medium)
行高: 1.5 (--line-height-normal)
```

### 載入覆蓋層文字
```css
繼承父層設定
背景: 60% 透明黑色
模糊效果: 4px 背景模糊
```

---

## 顏色使用邏輯

### 文字顏色階層
```css
主要文字: #1A1A1A (--color-text-primary)
次要文字: #666666 (--color-text-secondary)
重要標題: #003D82 (--color-navy)
成功/啟用: #4DBFA3 (--color-primary-teal)
警告/必填: #FF6B6B (--color-coral)
連結/互動: #3B7DD6 (--color-primary-blue)
```

### 背景色彩搭配
```css
淺色背景: 使用 --color-text-primary/secondary
深色背景: 使用 --color-white
彩色背景: 使用對比色彩
```

---

## 工具類別 (Utility Classes)

### 字體大小類別
```css
.text-xs { font-size: var(--font-size-xs); }
.text-sm { font-size: var(--font-size-sm); }
.text-base { font-size: var(--font-size-base); }
.text-lg { font-size: var(--font-size-lg); }
.text-xl { font-size: var(--font-size-xl); }
.text-2xl { font-size: var(--font-size-2xl); }
.text-3xl { font-size: var(--font-size-3xl); }
.text-4xl { font-size: var(--font-size-4xl); }
```

### 字體粗細類別
```css
.font-normal { font-weight: var(--font-weight-normal); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }
.font-extrabold { font-weight: var(--font-weight-extrabold); }
```

### 行高類別
```css
.leading-tight { line-height: var(--line-height-tight); }
.leading-normal { line-height: var(--line-height-normal); }
.leading-relaxed { line-height: var(--line-height-relaxed); }
```

---

## 維護指南

### 新增內容時
1. **標題**: 使用語義化 HTML 標籤 (h1-h6)，遵循層次結構
2. **內文**: 使用 `<p>` 標籤，系統會自動套用正確字體設定
3. **按鈕**: 使用 `.btn` 類別，會自動套用統一樣式
4. **表單**: 使用標準 HTML 表單元素，會自動套用一致樣式

### 修改字體時
1. **全域調整**: 修改 CSS 變數值
2. **特定調整**: 使用工具類別覆蓋
3. **響應式**: 在適當的媒體查詢中調整變數值

### 測試檢查
1. **桌面版**: 檢查 1200px+ 螢幕顯示
2. **平板版**: 檢查 768px-1024px 顯示
3. **手機版**: 檢查 480px 以下顯示
4. **可讀性**: 確認對比度符合無障礙標準

---

*最後更新: 2025年12月30日*
*維護者: Claude Code Typography System*