# Design: Global Ranking Speed + Carousel Multi-Placement

**Date**: 2026-03-03
**Status**: Approved

---

## Challenge 1: Global Ranking Loading Speed

### Problem
Frontend fetches a large external CSV (~1-2s), parses it in-browser, and computes Taiwan's rank on every page load. Users see "--" placeholders with no loading indicator, potentially thinking it's broken.

### Solution: GAS API with Pre-computed Data

Leverage the existing daily cron job (`logGlobalTop10ToSheet()`) that already writes ranking data to `GlobalTop10History` sheet.

**New GAS endpoint**: `?action=getGlobalRank`
- Reads latest row from `GlobalTop10History` sheet
- Returns pre-computed: `{ globalRank, totalCountries, percentile, taiwanCount, nearbyCountries, lastUpdated }`
- Backend CacheService (5-min TTL) for repeated calls
- Frontend localStorage cache (24h, same as current)

**Data flow**:
```
Daily cron → GlobalTop10History sheet → GAS API → Frontend (cached 24h)
```

**What changes**:
- Backend: New `getGlobalRank()` handler in `doGet()`
- Backend: Cron job may need to store additional fields (nearbyCountries, percentile)
- Frontend: Replace `fetchTaiwanGlobalRank()` CSV fetch with API call
- Frontend: Add skeleton/loading state while fetching

**Expected improvement**: ~1-2s → ~200-500ms (GAS sheet read)

---

## Challenge 2: Activity Carousel Multi-Placement

### Problem
Upcoming events carousel only appears on Tab 2 (體驗). Users on Tab 1 (首頁) never see activity info.

### Solution: Reusable Carousel Component

Refactor carousel into a class/factory that supports multiple instances sharing one data source.

**Placement**:
- **Tab 1** (首頁): Between Global Rank section and Live Stats Dashboard
- **Tab 2** (體驗): Keep current position (unchanged)

**Architecture**:
```
eventsService.js (data layer - fetch once, shared cache)
       ↓
EventsCarousel class (UI component - multiple instances)
       ↓
  Tab 1 instance    Tab 2 instance
  (id: home-*)      (id: experience-*)
```

**What changes**:
- Refactor: Extract carousel logic into `EventsCarousel` class with configurable container ID
- Data: Single `fetchEvents()` call shared between instances (existing cache handles this)
- HTML: Add carousel container to Tab 1 between global rank and live stats
- CSS: Ensure styles work in both contexts (no ID-specific selectors)
- Each instance has independent autoplay, scroll position, navigation

---

## Non-Goals
- No new infrastructure (Firebase Functions, CDN JSON, etc.)
- No changes to the daily cron job schedule
- No changes to UpcomingEvents sheet structure
