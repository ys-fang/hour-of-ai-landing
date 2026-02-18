# Tab-Based Landing Page Redesign Plan

## Design Overview

Convert the scroll-based landing page into a 4-tab single-page app layout.

```
MOBILE                              DESKTOP
┌──────────────────┐               ┌─────────────────────────────────────┐
│ 均一 x Hour of AI │               │ 均一 x Hour of AI  首頁 體驗 報名 關於│
├──────────────────┤               ├─────────────────────────────────────┤
│                  │               │                                     │
│   Tab Content    │               │         Tab Content                 │
│   (scrollable)   │               │         (scrollable, wider grids)   │
│                  │               │                                     │
├──────────────────┤               └─────────────────────────────────────┘
│ 首頁 體驗 報名 關於│
└──────────────────┘
```

- **Mobile**: Fixed bottom tab bar + minimal top brand bar
- **Desktop**: Tabs merge into top bar alongside logo (no bottom bar)
- One set of tab logic, CSS moves the bar position

---

## Tab Content Specification

### Tab 1: 首頁 (Home) — Hook the visitor

Source sections: Hero (148-176), Stats Bar (179-196), Live Stats (199-404)

**Content (top to bottom):**
1. Hero: headline + subtitle + hero image (keep existing image)
2. One-line mission: "AI 不是特權，是每位孩子的學習權利"
3. Stats shock: Taiwan global rank badge, total events/participants counters
4. Taiwan map + county rankings
5. Upcoming events carousel
6. Activity feed

**Removed from current hero:** The two CTA buttons ("我要舉辦活動", "了解活動內容") — tabs replace this navigation.

### Tab 2: 體驗 (Experience) — Try before you commit

Source sections: Activities (760-823)

**Content:**
1. Section title: "先體驗，再決定"
2. Active AI showcase (image + highlights + prominent CTA) — as currently redesigned
3. AI Square one-line footnote — as currently redesigned
4. Bridge text: "體驗完了？覺得適合帶進課堂？" with button that switches to Register tab

### Tab 3: 報名 (Register) — Convert

Source sections: Registration (826-1314)

**Content:**
1. Section title + subtitle
2. Registration hero image
3. Info banner (重要說明)
4. Full form — ALL fields on one page (no multi-step, no progress bar)
   - Contact info fields
   - Organization details fields
   - Activity details fields
   - Consent + submit
5. Success message (shown after submission)

**Flatten the form:** Remove multi-step wizard logic (currentPage, showPage, updateProgress, validatePage). Replace with simple single-page form with one submit button. Keep field validation on submit.

### Tab 4: 關於 (About) — For the curious

Source sections: About (407-414), Pillars (417-757), Footer (1317-1372)

**Content:**
1. "What is Hour of AI" description
2. Official selection badge
3. Four Pillars — each as an expand/collapse card:
   - Default: shows icon + title + subtitle + one-line brief (collapsed)
   - Click to expand: reveals full detail (progression tabs content, insight quote)
   - No modal — inline accordion style
4. Footer content: contact info, links, logo

---

## Implementation Steps

### Step 1: Tab Shell (HTML + CSS + JS)

**HTML changes to index.html:**
- Replace top `<nav>` (lines 130-145) with minimal brand bar
- Wrap all existing `<section>` elements into 4 `<div class="tab-panel">` containers
- Add tab bar HTML (renders at bottom on mobile, inside top bar on desktop)
- Remove floating CTA (lines 1375-1380)
- Remove pillar modal overlay (lines 1383-1395)

**CSS:**
- `.app-shell`: full viewport height, flex column
- `.brand-bar`: fixed top, minimal height, logo + branding text
- `.tab-content`: flex: 1, overflow-y: auto (scrollable)
- `.tab-panel`: hidden by default, `.tab-panel.active` shown
- `.tab-bar`: fixed bottom on mobile, flex row, equal-width items
- `@media (min-width: 769px)`: tab bar moves into brand bar (top), bottom bar hidden

**JS (new: tabNavigation.js):**
- `initTabs()`: set up click handlers on tab buttons
- `switchTab(tabId)`: hide all panels, show target, update active button
- Default to "home" tab on load
- Bridge buttons (e.g., "體驗完了？") call `switchTab('register')`

### Step 2: Migrate Content into Tabs

Move existing HTML sections into the 4 tab panels. No content rewrite needed — just re-parenting.

- **Tab 1 (home):** hero + stats-bar + live-stats-section
- **Tab 2 (experience):** activities section (already redesigned)
- **Tab 3 (register):** registration section
- **Tab 4 (about):** about section + pillars section + footer content

### Step 3: Flatten Registration Form

In main.js registration logic:
- Remove progress bar HTML
- Remove `currentPage`, `showPage()`, `updateProgress()`, `goToPage()`
- Remove next/prev button handlers
- Show all form pages at once (remove `.hidden` from page divs)
- Keep `validatePage()` logic but call it once on submit for ALL fields
- Keep form submission logic, honeypot, success state

### Step 4: Pillars — Modal to Inline Toggle

- Remove pillar modal overlay HTML
- Remove `openPillarModal()`, `closePillarModal()`, `setupPillarModal()` from JS
- Each pillar card gets a click handler that toggles `.expanded` class
- Expanded state reveals the detail content (progression tabs + insight) inline below the card
- Pillar detail panels move inside their respective cards
- Keep pillar tab switching logic (basic/proficient/advanced) within expanded cards

### Step 5: Cleanup

- Remove old top nav CSS (`.nav`, `.nav-links`, `.mobile-menu-toggle`)
- Remove floating CTA CSS (`.floating-cta`)
- Remove pillar modal CSS (`.pillar-modal-overlay`, `.pillar-modal`)
- Remove multi-step form CSS (`.form-progress`, page transitions)
- Remove floating CTA scroll listener JS
- Remove mobile menu toggle JS
- Update click tracking: ensure `initClickTracking()` runs on tab switch or on DOM ready
- Verify all 76 existing tests still pass

### Step 6: Final Polish

- Tab switch animations (fade or slide)
- Scroll to top on tab switch
- URL hash support (`#home`, `#experience`, `#register`, `#about`) for deep linking
- Active tab highlight styling
- Test on mobile and desktop viewports
