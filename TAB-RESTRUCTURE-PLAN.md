# Hour of AI — Tab 頁面重構開發計劃

> 建立日期：2026-02-18
> 狀態：規劃中

---

## 1. 目標

將現有單頁捲動式 Landing Page 重構為 **4 個真實 Tab 面板**，建立清晰的使用者漏斗：

```
認識 → 體驗 → 舉辦（轉化）
```

### 為什麼要改

| 現狀問題 | Tab 方案解決方式 |
|---------|----------------|
| 頁面過長，用戶滾動疲勞 | 每個 Tab 內容聚焦，一屏可消化 |
| 漏斗步驟不明確，CTA 分散 | 每個 Tab 尾部有明確 CTA 引導下一步 |
| 表單埋在頁面中間，到達時注意力已分散 | 表單獨佔整頁，零干擾填寫 |
| Scroll-based 追蹤不精確 | Tab 切換 = 精確的漏斗步驟事件 |

---

## 2. Tab 結構與內容規劃

### 總覽

| Tab | 標籤名 | 漏斗階段 | 核心任務 | 尾部 CTA |
|-----|--------|---------|---------|----------|
| 1 | 首頁 | Awareness | 說服「這值得做」 | 「先體驗看看」→ Tab 2 |
| 2 | 體驗 | Interest | 降低行動門檻 | 「我要舉辦活動」→ Tab 3 |
| 3 | 舉辦 | Conversion | 完成轉化（填表） | 表單送出 |
| 4 | 關於 | Enrichment | 建立品牌深度 | 「開始體驗」→ Tab 2 |

---

### Tab 1 — 首頁（Awareness）

**目標**：5 秒內讓用戶理解「這是什麼」＋「為什麼可信」

#### 內容模塊（由上至下）

```
┌─────────────────────────────────┐
│  Hero Banner                    │
│  Tagline + 一句話定位            │
│  「用一小時，讓每個孩子認識 AI」  │
├─────────────────────────────────┤
│  Hour of AI 是什麼？             │
│  • 3-4 條 bullet points         │
│  • 不是長段落，是可掃讀的重點     │
├─────────────────────────────────┤
│  社會證明                        │
│  • 全球排名（台灣第 N 名）        │
│  • 三大數字：場次 / 人數 / 縣市   │
├─────────────────────────────────┤
│  即時統計儀表板                   │
│  • 台灣地圖 + 縣市排名            │
│  • 最新活動動態                   │
├─────────────────────────────────┤
│  CTA: 「先體驗看看 →」           │
│  （切換到 Tab 2）                │
└─────────────────────────────────┘
```

#### 內容改寫重點

現有「什麼是 Hour of AI」是一整段文字（`#about` section），需重構為：

**Before（現有）**：
> Hour of AI，活動靈感來自全球最大公益學習運動 Hour of Code，由國際教育平台 Code.org 發起的年度活動...（長段落）

**After（建議）**：
> **Hour of AI 是什麼？**
> - 全球教育運動，靈感來自 Hour of Code
> - 60 分鐘內體驗 AI、理解 AI、善用 AI
> - 免費教材，適合教室與社區場域
> - 均一平台教育基金會在台灣推動

#### 來源 Section 遷移

| 現有 Section | 遷移至 | 處理方式 |
|-------------|--------|---------|
| `#hero` | Tab 1 頂部 | 保留 hero banner，精簡文案 |
| `.stats-bar` | Tab 1 | 融入 hero 或移除（內容偏抽象） |
| `.social-proof-section` | Tab 1 | 完整保留（全球排名 + 計數器） |
| `#about` | Tab 1 | **重寫為 bullet points** |
| `#live-stats` | Tab 1 底部 | 完整保留（地圖 + 排名） |

---

### Tab 2 — 體驗（Interest）

**目標**：讓用戶願意點進去試一試

> 備註：外連平台為我方經營，屬於漏斗的一部分。
> 重點不是防止流失，而是**提高嘗試意願**。

#### 內容模塊

```
┌─────────────────────────────────┐
│  Section Title                  │
│  「先體驗，再決定」              │
├─────────────────────────────────┤
│  主打活動 Showcase               │
│  • 活動名稱 + 說明               │
│  • 預計體驗時間                   │
│  • 適合對象                      │
│  • CTA 按鈕（target="_blank"）   │
├─────────────────────────────────┤
│  近期推廣活動 Carousel            │
│  • 時間、狀態徽章                 │
│  • 卡片式呈現                    │
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │ 固定底部欄 (Sticky Bar)  │    │
│  │ 「我要舉辦活動 →」       │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

#### 體驗意願提升策略

1. **標注體驗時間**：「約 15 分鐘即可完成」降低心理門檻
2. **外連用 `target="_blank"`**：用戶在新分頁體驗，原頁面留在 Tab 2
3. **固定底部 CTA 欄**：不只放在底部，而是常駐顯示，體驗完隨時可進入下一步
4. **社會證明微文案**：「已有 N 位教師體驗過」

#### 來源 Section 遷移

| 現有 Section | 遷移至 | 處理方式 |
|-------------|--------|---------|
| `#activities` | Tab 2 | 完整保留（showcase + carousel） |

---

### Tab 3 — 舉辦（Conversion）

**目標**：零干擾完成報名表單

#### 內容模塊

```
┌─────────────────────────────────┐
│  鼓勵語 Header                   │
│  「成為台灣 AI 教育推手」         │
├─────────────────────────────────┤
│  Progress Bar (1/2/3/4)          │
├─────────────────────────────────┤
│                                  │
│  表單內容（全頁展開）              │
│  所有步驟在同一頁面上              │
│  用 accordion / 展開式呈現         │
│                                  │
├─────────────────────────────────┤
│  提交按鈕                         │
└─────────────────────────────────┘
```

#### 全頁表單設計

**方案 A — 保留分步（推薦）**：
- 維持現有 4 步驟分頁邏輯
- 但每步佔滿整個 Tab 面板
- Progress bar 更突出
- 優點：每步資訊量不大，不嚇人

**方案 B — 單頁展開**：
- 所有欄位在一頁內展開
- 用視覺分隔區分步驟
- 優點：一覽全貌，適合填過的用戶
- 缺點：欄位多時可能感覺長

**建議**：先用方案 A（風險較低），後續可 A/B test

#### 來源 Section 遷移

| 現有 Section | 遷移至 | 處理方式 |
|-------------|--------|---------|
| `#register` | Tab 3 | 移入，移除外圍 section 裝飾 |

---

### Tab 4 — 關於（Enrichment）

**目標**：為有興趣深入了解的用戶提供完整資訊

#### 內容模塊

```
┌─────────────────────────────────┐
│  AI 素養四大支柱                  │
│  問 → 用 → 管 → 造               │
│  互動式卡片 + Modal 詳情          │
├─────────────────────────────────┤
│  Hour of AI 完整背景              │
│  • Code.org 與全球運動            │
│  • 均一的角色                     │
├─────────────────────────────────┤
│  （未來擴充區）                   │
│  • AI Literacy Framework         │
│  • 教師資源 / 教案下載            │
│  • FAQ                           │
│  • 合作夥伴                      │
├─────────────────────────────────┤
│  CTA: 「開始體驗 →」             │
│  （切換到 Tab 2）                │
└─────────────────────────────────┘
```

#### 來源 Section 遷移

| 現有 Section | 遷移至 | 處理方式 |
|-------------|--------|---------|
| `#pillars` | Tab 4 | 完整保留（卡片 + Modal） |
| `#about`（詳細版） | Tab 4 | 保留長版本供深度閱讀 |

---

## 3. 技術架構

### 3.1 HTML 結構變更

**現有結構**（單頁捲動）：
```html
<nav class="nav">
  <div class="section-nav">  <!-- 偽 tab，實為 scroll anchor -->
    <a href="#hero">首頁</a>
    <a href="#activities">體驗</a>
    ...
  </div>
</nav>
<section id="hero">...</section>
<section id="activities">...</section>
<section id="register">...</section>
<section id="about">...</section>
<section id="pillars">...</section>
<section id="live-stats">...</section>
```

**新結構**（真實 Tab）：
```html
<nav class="nav">
  <div class="tab-nav" id="tabNav" role="tablist">
    <button role="tab" aria-selected="true" data-tab="home">首頁</button>
    <button role="tab" data-tab="experience">體驗</button>
    <button role="tab" data-tab="host">舉辦</button>
    <button role="tab" data-tab="about">關於</button>
  </div>
</nav>

<main>
  <div class="tab-panel active" id="panel-home" role="tabpanel">
    <!-- Hero + HOA介紹 + 社會證明 + 即時統計 + CTA -->
  </div>

  <div class="tab-panel" id="panel-experience" role="tabpanel">
    <!-- 活動體驗 + Carousel + 固定底部 CTA -->
  </div>

  <div class="tab-panel" id="panel-host" role="tabpanel">
    <!-- 全頁表單 -->
  </div>

  <div class="tab-panel" id="panel-about" role="tabpanel">
    <!-- 四大支柱 + 背景資訊 + CTA -->
  </div>
</main>
```

### 3.2 Tab 切換機制

```javascript
// Tab 切換核心邏輯
function switchTab(tabId, pushState = true) {
    // 1. 更新 tab-nav active 狀態
    document.querySelectorAll('[role="tab"]').forEach(tab => {
        tab.setAttribute('aria-selected', tab.dataset.tab === tabId);
    });

    // 2. 切換 panel 可見性
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `panel-${tabId}`);
    });

    // 3. 更新 URL hash（支援分享連結）
    if (pushState) {
        history.pushState({ tab: tabId }, '', `#${tabId}`);
    }

    // 4. 滾動到頂部
    window.scrollTo({ top: 0, behavior: 'instant' });

    // 5. GA4 漏斗事件
    gtag('event', 'tab_view', {
        tab_name: tabId,
        event_category: 'navigation'
    });
}
```

### 3.3 URL Hash Routing

```javascript
// 支援直連 & 瀏覽器上一頁
const TAB_IDS = ['home', 'experience', 'host', 'about'];

function getTabFromHash() {
    const hash = window.location.hash.replace('#', '');
    return TAB_IDS.includes(hash) ? hash : 'home';
}

// 初始載入
window.addEventListener('DOMContentLoaded', () => {
    switchTab(getTabFromHash(), false);
});

// 瀏覽器上一頁 / 下一頁
window.addEventListener('popstate', (e) => {
    const tabId = e.state?.tab || getTabFromHash();
    switchTab(tabId, false);
});
```

### 3.4 Tab Panel CSS

```css
/* Tab Panel 基礎樣式 */
.tab-panel {
    display: none;
    min-height: calc(100vh - var(--nav-height));
}

.tab-panel.active {
    display: block;
}

/* 可選：加入切換動畫 */
.tab-panel.active {
    animation: tabFadeIn 0.25s ease-out;
}

@keyframes tabFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
}
```

### 3.5 CTA 按鈕元件

```html
<!-- 各 Tab 底部的引導 CTA -->
<div class="tab-cta-section">
    <p class="tab-cta-hint">準備好了嗎？</p>
    <button class="btn btn-primary tab-cta-btn" data-goto-tab="experience">
        先體驗看看
        <span class="material-icons">arrow_forward</span>
    </button>
</div>
```

```javascript
// CTA 按鈕切 Tab
document.querySelectorAll('[data-goto-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
        switchTab(btn.dataset.gotoTab);
    });
});
```

### 3.6 Tab 2 固定底部欄

```html
<!-- Tab 2 專屬：固定底部 CTA 欄 -->
<div class="sticky-bottom-bar" id="experienceBottomBar">
    <div class="container">
        <span>體驗完了？</span>
        <button class="btn btn-primary" data-goto-tab="host">
            我要舉辦活動
            <span class="material-icons">arrow_forward</span>
        </button>
    </div>
</div>
```

```css
.sticky-bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
    padding: var(--spacing-sm) 0;
    z-index: 100;
    /* 只在 Tab 2 active 時顯示 */
}
```

### 3.7 SEO 處理

Tab 隱藏內容可能影響 SEO。解決方案：

```css
/* 方案：用 visibility + position 隱藏而非 display:none */
.tab-panel {
    display: block;          /* 保持在 DOM flow 中 */
    position: absolute;
    visibility: hidden;
    pointer-events: none;
    height: 0;
    overflow: hidden;
}

.tab-panel.active {
    position: relative;
    visibility: visible;
    pointer-events: auto;
    height: auto;
    overflow: visible;
}
```

### 3.8 Analytics 漏斗追蹤

```javascript
// 漏斗步驟事件
const TAB_FUNNEL_STEP = {
    home: 1,
    experience: 2,
    host: 3,
    about: 0  // 非線性步驟
};

function trackTabSwitch(fromTab, toTab) {
    gtag('event', 'funnel_step', {
        from_tab: fromTab,
        to_tab: toTab,
        funnel_step: TAB_FUNNEL_STEP[toTab],
        event_category: 'conversion_funnel'
    });
}
```

---

## 4. 需調整的現有功能

### 4.1 Fade-in 動畫

現有 IntersectionObserver 觸發 `.fade-in → .visible`。Tab 切換後需重新觸發：

```javascript
function switchTab(tabId) {
    // ...切換邏輯...

    // 重新觸發新 panel 內的 fade-in
    const panel = document.getElementById(`panel-${tabId}`);
    panel.querySelectorAll('.fade-in:not(.visible)').forEach(el => {
        observer.observe(el);
    });
}
```

### 4.2 即時統計地圖

Leaflet 地圖在 `display:none` 時無法正確渲染。需在 Tab 首次可見時初始化：

```javascript
let mapInitialized = false;

function switchTab(tabId) {
    // ...
    if (tabId === 'home' && !mapInitialized) {
        initializeMap();
        mapInitialized = true;
    }
}
```

### 4.3 Events Carousel

Carousel 在隱藏 Tab 中寬度計算會出錯。需在 Tab 2 首次顯示時重新計算：

```javascript
function switchTab(tabId) {
    // ...
    if (tabId === 'experience') {
        recalculateCarousel();
    }
}
```

### 4.4 Counter 動畫

數字跳動動畫目前用 IntersectionObserver 觸發。改為 Tab 切換時觸發：

```javascript
let countersAnimated = false;

function switchTab(tabId) {
    if (tabId === 'home' && !countersAnimated) {
        animateCounters();
        countersAnimated = true;
    }
}
```

---

## 5. 實作階段

### Phase 1 — 骨架搭建（Tab 切換機制）

**目標**：用最少改動讓 Tab 機制運作

- [ ] 將 `.section-nav` 改為 `role="tablist"` 按鈕式 Tab
- [ ] 將所有 section 包進 4 個 `.tab-panel` 容器
- [ ] 實作 `switchTab()` 核心函數
- [ ] 實作 URL hash routing + popstate
- [ ] 移除 scroll-based section tracking
- [ ] 調整 CSS：tab panel 顯隱

**驗收**：4 個 Tab 可正常切換，URL hash 可分享

### Phase 2 — 內容重組

**目標**：將現有 section 搬移到正確的 Tab

- [ ] Tab 1：搬入 hero + about（重寫為 bullets）+ social-proof + live-stats
- [ ] Tab 2：搬入 activities section
- [ ] Tab 3：搬入 registration form
- [ ] Tab 4：搬入 pillars section
- [ ] 移除 stats-bar（或融入 Tab 1 hero）

**驗收**：每個 Tab 包含正確內容，無遺漏

### Phase 3 — CTA 引導系統

**目標**：建立 Tab 間的漏斗引導

- [ ] 每個 Tab 底部加入 CTA section
- [ ] Tab 2 固定底部 CTA 欄
- [ ] CTA 按鈕點擊 → switchTab()
- [ ] GA4 漏斗事件追蹤

**驗收**：完整的 Tab 1 → 2 → 3 引導路徑

### Phase 4 — 現有功能修復

**目標**：確保所有互動功能在 Tab 架構下正常運作

- [ ] 修復 Leaflet 地圖初始化時機
- [ ] 修復 Carousel 寬度計算
- [ ] 修復 Counter 動畫觸發
- [ ] 修復 fade-in 動畫在 Tab 切換後重新觸發
- [ ] 修復表單驗證 & 提交邏輯
- [ ] 修復 Pillar Modal

**驗收**：所有互動功能正常

### Phase 5 — 打磨 & 部署

- [ ] Tab 切換動畫
- [ ] Responsive 測試（手機 / 平板 / 桌面）
- [ ] SEO 確認（Google Search Console）
- [ ] GA4 漏斗報告設定
- [ ] A11y 無障礙檢查（keyboard navigation, screen reader）
- [ ] 部署到 Firebase Hosting

---

## 6. 風險與應對

| 風險 | 可能性 | 影響 | 應對策略 |
|------|-------|------|---------|
| Tab 1 內容過長 | 高 | 又變成單頁滾動 | 嚴格控制字數，HOA 介紹限 4 條 |
| Leaflet 地圖渲染異常 | 中 | 地圖空白或變形 | 延遲初始化 + invalidateSize() |
| SEO 排名下降 | 中 | 自然流量降低 | 用 visibility 而非 display:none |
| 表單填寫中誤切 Tab | 中 | 用戶輸入遺失 | 表單資料存 sessionStorage |
| 舊連結失效 | 低 | 外部分享連結 404 | 保留舊 hash 的 redirect 映射 |

---

## 7. 不在本次範圍

以下功能可作為後續迭代：

- Tab 4 擴充內容（AI Literacy Framework、教案下載、FAQ）
- Tab 切換手勢（左右滑動）
- A/B test：Tab 3 分步 vs 單頁展開
- Tab 2 體驗完成追蹤（偵測用戶從外部平台返回）
- i18n 多語系支援

---

*文件建立：2026-02-18*
