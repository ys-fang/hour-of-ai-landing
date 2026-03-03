# Ranking Speed + Carousel Multi-Placement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Speed up global ranking loading by serving pre-computed data from GAS API, and show upcoming events carousel on both Tab 1 (homepage) and Tab 2 (experience).

**Architecture:** Backend adds `?action=getGlobalRank` endpoint reading from `GlobalTop10History` sheet. Frontend replaces slow CSV fetch with fast API call. Carousel refactored from global functions into `EventsCarousel` class supporting multiple instances sharing one data source.

**Tech Stack:** Google Apps Script, Vanilla JS (ES6 classes), HTML/CSS, Vitest

---

## Task 1: Backend — Add `getGlobalRank` GAS Endpoint

**Files:**
- Modify: `backend/gas/Code.js`

### Step 1: Add `getGlobalRank` route to `doGet()`

In `doGet()` (line 175), add a new action handler:

```javascript
// After line 184 (the getUpcomingEvents handler)
if (action === 'getGlobalRank') {
  return getGlobalRank();
}
```

### Step 2: Implement `getGlobalRank()` function

Add before the `// ===== TAIWAN RANK TRACKER =====` section:

```javascript
/**
 * Get pre-computed global rank data from GlobalTop10History sheet
 * Returns the latest day's ranking data with Taiwan analysis
 */
function getGlobalRank() {
  try {
    // Check cache first (5 min)
    const cache = CacheService.getScriptCache();
    const cached = cache.get('global_rank_data');
    if (cached) {
      return ContentService.createTextOutput(cached)
        .setMimeType(ContentService.MimeType.JSON);
    }

    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.GLOBAL_TOP10_SHEET_NAME);

    if (!sheet || sheet.getLastRow() <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'No ranking data available'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Find the latest date in the sheet
    const data = sheet.getDataRange().getValues();
    const header = data[0]; // ['date', 'rank', 'country', 'count']
    const rows = data.slice(1);

    // Get the latest date
    const latestDate = rows[rows.length - 1][0];

    // Filter rows for latest date only
    const latestRows = rows.filter(row => row[0] === latestDate);

    // Build sorted array from sheet data
    const sorted = latestRows
      .map(row => ({ rank: row[1], country: row[2], count: row[3] }))
      .sort((a, b) => a.rank - b.rank);

    // Find Taiwan
    const taiwanEntry = sorted.find(item => item.country === CONFIG.RANK_TRACKER_TARGET_COUNTRY);

    if (!taiwanEntry) {
      // Taiwan not in Top 10 — need full data for accurate rank
      // Fall back to fetching CSV for complete analysis
      const fullData = fetchGlobalRankData();
      const fullSorted = fullData.filter(item => item.count > 0).sort((a, b) => b.count - a.count);
      const result = buildGlobalRankResponse(fullSorted, latestDate);

      const jsonStr = JSON.stringify(result);
      cache.put('global_rank_data', jsonStr, 300);
      return ContentService.createTextOutput(jsonStr)
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Taiwan is in Top 10 — we have enough data from sheet
    // But we need totalCountries count, so fetch full data
    const fullData = fetchGlobalRankData();
    const fullSorted = fullData.filter(item => item.count > 0).sort((a, b) => b.count - a.count);
    const result = buildGlobalRankResponse(fullSorted, latestDate);

    const jsonStr = JSON.stringify(result);
    cache.put('global_rank_data', jsonStr, 300);
    return ContentService.createTextOutput(jsonStr)
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error in getGlobalRank: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Build the global rank API response from sorted data
 */
function buildGlobalRankResponse(sorted, date) {
  const taiwanIndex = sorted.findIndex(item => item.country === CONFIG.RANK_TRACKER_TARGET_COUNTRY);
  const contextRange = 2;

  if (taiwanIndex === -1) {
    return { status: 'error', message: 'Taiwan not found in data' };
  }

  const taiwan = sorted[taiwanIndex];
  const rank = taiwanIndex + 1;
  const totalCountries = sorted.length;

  const nearbyCountries = [
    ...sorted.slice(Math.max(0, taiwanIndex - contextRange), taiwanIndex)
      .map((c, idx) => ({ ...c, rank: taiwanIndex - contextRange + idx + 1 + Math.max(0, contextRange - taiwanIndex), position: 'above' })),
    { ...taiwan, rank: rank, position: 'current' },
    ...sorted.slice(taiwanIndex + 1, taiwanIndex + contextRange + 1)
      .map((c, idx) => ({ ...c, rank: rank + idx + 1, position: 'below' }))
  ];

  return {
    status: 'success',
    globalRank: rank,
    totalCountries: totalCountries,
    percentile: ((totalCountries - rank + 1) / totalCountries * 100).toFixed(1),
    taiwanCount: taiwan.count,
    nearbyCountries: nearbyCountries,
    topCountry: sorted[0],
    lastUpdated: date || formatDateTW(new Date(), 'yyyy-MM-dd')
  };
}
```

### Step 3: Deploy and test

```bash
cd backend/gas && clasp push
```

Run `testGetGlobalRank()` (add simple test function) in Apps Script Editor. Verify response has `globalRank`, `nearbyCountries`, etc.

### Step 4: Commit

```bash
git add backend/gas/Code.js
git commit -m "feat: add getGlobalRank GAS endpoint with 5-min cache"
```

---

## Task 2: Frontend — Replace CSV Fetch with API Call

**Files:**
- Modify: `src/scripts/main.js` (lines 1662-1836)

### Step 1: Update `globalRankConfig`

Replace `CSV_URL` with API URL pattern (line 1662-1669):

```javascript
const globalRankConfig = {
    CACHE_KEY: 'hourOfAI_global_rank_cache',
    CACHE_TIMESTAMP_KEY: 'hourOfAI_global_rank_timestamp',
    CACHE_DURATION: 3600000, // 1 hour
};
```

### Step 2: Add API URL helper

```javascript
function getGlobalRankApiUrl() {
    const formUrl = document.getElementById('registrationForm')?.action;
    if (!formUrl) return null;
    const base = formUrl.replace('/exec', '/exec');
    return base + '?action=getGlobalRank';
}
```

### Step 3: Replace `fetchTaiwanGlobalRank()`

Replace the function (lines 1674-1697) to call the GAS API instead of fetching CSV:

```javascript
async function fetchTaiwanGlobalRank() {
    try {
        // Check cache first
        const cached = getGlobalRankCache();
        if (cached) {
            console.log('Using cached global rank data');
            return cached;
        }

        const apiUrl = getGlobalRankApiUrl();
        if (!apiUrl) {
            console.warn('Global rank API URL not available');
            return null;
        }

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.status !== 'success') {
            throw new Error(data.message || 'API error');
        }

        // Save to cache
        saveGlobalRankCache(data);
        return data;
    } catch (error) {
        console.error('Error fetching global rank:', error);
        return null;
    }
}
```

### Step 4: Remove dead code

Delete these functions that are no longer needed:
- `parseCSV()` (lines 1702-1720)
- `analyzeTaiwanGlobalRank()` (lines 1725-1775)

The `updateGlobalRankUI()` function stays as-is — the API response matches the same shape it already expects.

### Step 5: Test manually

Open the site, verify the global rank section loads faster and displays correctly.

### Step 6: Commit

```bash
git add src/scripts/main.js
git commit -m "feat: replace CSV fetch with GAS API for global ranking"
```

---

## Task 3: Frontend — Add Loading Skeleton to Global Rank

**Files:**
- Modify: `src/index.html` (lines 210-264)
- Modify: `src/styles/main.css`

### Step 1: Add skeleton class to rank placeholders in HTML

In `index.html`, add `skeleton-text` class to the `--` placeholder elements:

```html
<div class="rank-number-large skeleton-text" id="globalRankNumber">--</div>
```

Apply to: `#globalRankNumber`, `#globalRankTotal`, `#globalPercentile`, `#localEventCount`, `#globalEventCount`

### Step 2: Add skeleton CSS

```css
.skeleton-text {
    position: relative;
    color: transparent !important;
    background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s infinite;
    border-radius: 4px;
    min-width: 2em;
    display: inline-block;
}

@keyframes skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
```

### Step 3: Remove skeleton class when data loads

In `updateGlobalRankUI()`, remove `skeleton-text` class from each element before setting values:

```javascript
function updateGlobalRankUI(rankData, localStats) {
    if (!rankData) return;

    // Remove skeleton states
    ['globalRankNumber', 'globalRankTotal', 'globalPercentile', 'localEventCount', 'globalEventCount']
        .forEach(id => document.getElementById(id)?.classList.remove('skeleton-text'));

    // ... rest of existing code
}
```

### Step 4: Commit

```bash
git add src/index.html src/styles/main.css src/scripts/main.js
git commit -m "feat: add loading skeleton to global rank section"
```

---

## Task 4: Refactor Carousel into Reusable `EventsCarousel` Class

**Files:**
- Modify: `src/scripts/main.js` (lines 1115-1378)

### Step 1: Create `EventsCarousel` class

Replace the global carousel state and functions with a class. This class takes a config object with DOM element IDs so multiple instances can coexist.

```javascript
class EventsCarousel {
    constructor(config) {
        this.carouselId = config.carouselId;
        this.prevBtnId = config.prevBtnId;
        this.nextBtnId = config.nextBtnId;
        this.dotsId = config.dotsId;
        this.autoplayInterval = config.autoplayInterval || 5000;

        this.currentIndex = 0;
        this.autoplayTimer = null;
        this.events = [];
    }

    getCarousel() { return document.getElementById(this.carouselId); }
    getPrevBtn() { return document.getElementById(this.prevBtnId); }
    getNextBtn() { return document.getElementById(this.nextBtnId); }
    getDotsContainer() { return document.getElementById(this.dotsId); }

    async init(events) {
        const carousel = this.getCarousel();
        if (!carousel) return;

        this.events = events;
        this.renderCards(events);
        this.renderDots(this.getTotalPages());
        this.updateNavButtons();
        this.setupEventListeners();
        this.startAutoplay();
    }

    renderCards(events) {
        const carousel = this.getCarousel();
        if (!carousel || !events || events.length === 0) return;

        carousel.innerHTML = events.map((event, index) => {
            const status = event._status || getEventStatus(event);
            const dateStr = formatEventDate(event);
            return `
                <a href="${event.url}"
                   class="event-card fade-in event-card-${status}"
                   target="_blank" rel="noopener noreferrer"
                   data-event-index="${index}">
                    <div class="event-card-arrow">
                        <span class="material-icons">arrow_forward</span>
                    </div>
                    <div class="event-card-meta">
                        ${getStatusBadgeHTML(status)}
                        ${dateStr ? `<span class="event-date"><span class="material-icons">calendar_today</span>${dateStr}</span>` : ''}
                    </div>
                    <div class="event-card-content">
                        <h3 class="event-card-title">${event.title}</h3>
                        <p class="event-card-description">${event.description}</p>
                        <span class="event-card-btn">
                            <span class="material-icons small">open_in_new</span>
                            前往活動
                        </span>
                    </div>
                </a>`;
        }).join('');

        setTimeout(() => {
            carousel.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
        }, 100);
    }

    renderDots(totalPages) {
        const dotsContainer = this.getDotsContainer();
        if (!dotsContainer || totalPages <= 1) {
            if (dotsContainer) dotsContainer.innerHTML = '';
            return;
        }

        dotsContainer.innerHTML = Array.from({ length: totalPages }, (_, i) =>
            `<button class="carousel-dot ${i === 0 ? 'active' : ''}"
                     data-page="${i}" aria-label="前往第 ${i + 1} 頁"></button>`
        ).join('');

        dotsContainer.querySelectorAll('.carousel-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                this.scrollToPage(parseInt(dot.dataset.page));
                this.resetAutoplay();
            });
        });
    }

    getVisibleCardsCount() { return 1; }

    getTotalPages() {
        return Math.ceil(this.events.length / this.getVisibleCardsCount());
    }

    scrollToPage(page) {
        const carousel = this.getCarousel();
        if (!carousel) return;
        const cards = carousel.querySelectorAll('.event-card');
        if (cards.length === 0) return;

        const targetIndex = Math.min(page * this.getVisibleCardsCount(), cards.length - 1);
        const targetCard = cards[targetIndex];
        if (targetCard) {
            carousel.scrollTo({ left: targetCard.offsetLeft - carousel.offsetLeft, behavior: 'smooth' });
        }

        this.currentIndex = page;
        this.updateDots(page);
        this.updateNavButtons();
    }

    updateDots(activePage) {
        const dotsContainer = this.getDotsContainer();
        if (!dotsContainer) return;
        dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === activePage);
        });
    }

    updateNavButtons() {
        const prevBtn = this.getPrevBtn();
        const nextBtn = this.getNextBtn();
        const totalPages = this.getTotalPages();
        if (prevBtn) prevBtn.disabled = this.currentIndex === 0;
        if (nextBtn) nextBtn.disabled = this.currentIndex >= totalPages - 1;
    }

    startAutoplay() {
        this.stopAutoplay();
        this.autoplayTimer = setInterval(() => {
            const totalPages = this.getTotalPages();
            this.scrollToPage((this.currentIndex + 1) % totalPages);
        }, this.autoplayInterval);
    }

    stopAutoplay() {
        if (this.autoplayTimer) {
            clearInterval(this.autoplayTimer);
            this.autoplayTimer = null;
        }
    }

    resetAutoplay() { this.startAutoplay(); }

    setupEventListeners() {
        const carousel = this.getCarousel();
        const prevBtn = this.getPrevBtn();
        const nextBtn = this.getNextBtn();

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentIndex > 0) {
                    this.scrollToPage(this.currentIndex - 1);
                    this.resetAutoplay();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentIndex < this.getTotalPages() - 1) {
                    this.scrollToPage(this.currentIndex + 1);
                    this.resetAutoplay();
                }
            });
        }

        carousel.addEventListener('mouseenter', () => this.stopAutoplay());
        carousel.addEventListener('mouseleave', () => this.startAutoplay());
        carousel.addEventListener('touchstart', () => this.stopAutoplay(), { passive: true });
        carousel.addEventListener('touchend', () => {
            setTimeout(() => this.startAutoplay(), 1000);
        }, { passive: true });

        let scrollTimeout;
        carousel.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const cardWidth = carousel.querySelector('.event-card')?.offsetWidth || 0;
                const gap = parseFloat(getComputedStyle(carousel).gap) || 0;
                const pageWidth = (cardWidth + gap) * this.getVisibleCardsCount();
                const newPage = Math.round(carousel.scrollLeft / pageWidth);
                if (newPage !== this.currentIndex) {
                    this.currentIndex = newPage;
                    this.updateDots(newPage);
                    this.updateNavButtons();
                }
            }, 100);
        });

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.renderDots(this.getTotalPages());
                this.scrollToPage(0);
            }, 200);
        });
    }
}
```

### Step 2: Delete old global carousel functions

Remove these (they are replaced by the class):
- Global vars: `carouselAutoplayTimer`, `carouselCurrentIndex` (lines 1115-1116)
- `renderEventCards()` (lines 1137-1173)
- `renderCarouselDots()` (lines 1178-1199)
- `getVisibleCardsCount()` (lines 1205-1207)
- `getTotalPages()` (lines 1212-1216)
- `scrollToPage()` (lines 1221-1242)
- `updateCarouselDots()` (lines 1247-1252)
- `updateNavButtons()` (lines 1257-1264)
- `startAutoplay()` (lines 1269-1276)
- `stopAutoplay()` (lines 1281-1286)
- `resetAutoplay()` (lines 1291-1293)
- `initEventsCarousel()` (lines 1298-1378)

Keep these shared utility functions (used by both instances):
- `getEventStatus()` (line 1018)
- `formatEventDate()` (line 1040)
- `getStatusBadgeHTML()` (line 1121)
- `filterAndSortEvents()` (line 1070)
- `fetchUpcomingEvents()` (line 958)

### Step 3: Update initialization to use class

Replace the old `initEventsCarousel()` call with:

```javascript
// Shared data — fetch once, use for all instances
let sharedEventsData = null;

async function initAllCarousels() {
    // Fetch events once
    const events = await fetchUpcomingEvents();
    sharedEventsData = events;

    // Tab 2 carousel (experience)
    const experienceCarousel = new EventsCarousel({
        carouselId: 'eventsCarousel',
        prevBtnId: 'carouselPrev',
        nextBtnId: 'carouselNext',
        dotsId: 'carouselDots',
    });
    await experienceCarousel.init(events);

    // Tab 1 carousel (home)
    const homeCarousel = new EventsCarousel({
        carouselId: 'homeEventsCarousel',
        prevBtnId: 'homeCarouselPrev',
        nextBtnId: 'homeCarouselNext',
        dotsId: 'homeCarouselDots',
    });
    await homeCarousel.init(events);
}
```

Update `DOMContentLoaded` handler to call `initAllCarousels()` instead of `initEventsCarousel()`.

### Step 4: Run existing tests

```bash
npm test
```

Fix any test failures caused by the refactor (tests reference `renderEventCards` etc.)

### Step 5: Commit

```bash
git add src/scripts/main.js
git commit -m "refactor: extract EventsCarousel class for multi-instance support"
```

---

## Task 5: Add Carousel HTML to Tab 1 (Homepage)

**Files:**
- Modify: `src/index.html`

### Step 1: Add carousel section between social proof and live stats

Insert after line 291 (`</section>` closing social proof), before line 293 (`<!-- Live Statistics Dashboard -->`):

```html
<!-- Upcoming Events on Homepage -->
<section class="upcoming-events-section home-events-section" id="home-upcoming-events">
    <div class="container">
        <div class="upcoming-events-header">
            <h3 class="section-title fade-in">
                <span class="material-icons medium" style="color: var(--color-primary-orange);">campaign</span>
                近期推廣活動
            </h3>
        </div>
        <div class="events-carousel-wrapper">
            <button class="carousel-nav prev" id="homeCarouselPrev" aria-label="上一個">
                <span class="material-icons">chevron_left</span>
            </button>
            <div class="events-carousel" id="homeEventsCarousel">
                <!-- Event cards rendered by JS -->
            </div>
            <button class="carousel-nav next" id="homeCarouselNext" aria-label="下一個">
                <span class="material-icons">chevron_right</span>
            </button>
        </div>
        <div class="carousel-dots" id="homeCarouselDots">
            <!-- Dots rendered by JS -->
        </div>
    </div>
</section>
```

Note the IDs: `homeEventsCarousel`, `homeCarouselPrev`, `homeCarouselNext`, `homeCarouselDots` — matching the config in Task 4.

### Step 2: Verify visually

Open the site, check Tab 1 shows the carousel between global ranking and the map. Check Tab 2 carousel still works independently.

### Step 3: Commit

```bash
git add src/index.html
git commit -m "feat: add upcoming events carousel to Tab 1 homepage"
```

---

## Task 6: Update Tests

**Files:**
- Modify: `tests/e2e/eventsCarousel.test.js`
- Modify: `tests/unit/eventsService.test.js` (if needed)

### Step 1: Update carousel tests for class-based API

Update tests that reference old global functions to use `EventsCarousel` class:

```javascript
// Old:
renderEventCards(mockEvents);
// New:
const carousel = new EventsCarousel({ carouselId: 'eventsCarousel', ... });
carousel.renderCards(mockEvents);
```

### Step 2: Add test for multi-instance

```javascript
test('two carousel instances operate independently', () => {
    // Setup two carousel containers in JSDOM
    // Init both with same events
    // Scroll one, verify the other's index unchanged
});
```

### Step 3: Run all tests

```bash
npm test
```

### Step 4: Commit

```bash
git add tests/
git commit -m "test: update carousel tests for EventsCarousel class"
```

---

## Task 7: Deploy and Verify End-to-End

### Step 1: Deploy GAS backend

```bash
cd backend/gas && clasp push
```

### Step 2: Verify GAS endpoint

Run `testGetGlobalRank()` in Apps Script Editor. Check `clasp logs`.

### Step 3: Deploy frontend

Push to main → Firebase CI/CD auto-deploys.

### Step 4: End-to-end verification

- Tab 1: Global rank loads fast (< 500ms), skeleton shows briefly, data appears
- Tab 1: Carousel shows upcoming events between rank and map
- Tab 2: Carousel still works independently
- Both carousels autoplay, pause on hover, navigate correctly

### Step 5: Final commit

```bash
git commit -m "chore: verify end-to-end deployment"
```

---

## Summary

| Task | What | Est. Changes |
|------|------|-------------|
| 1 | Backend: `getGlobalRank` endpoint | +80 lines GAS |
| 2 | Frontend: API call replaces CSV | ~50 lines changed |
| 3 | Frontend: Loading skeleton | +20 CSS, ~10 HTML/JS |
| 4 | Frontend: `EventsCarousel` class | ~200 lines refactor |
| 5 | HTML: Carousel on Tab 1 | +20 lines HTML |
| 6 | Tests: Update for new class | ~30 lines tests |
| 7 | Deploy + verify | No code changes |
