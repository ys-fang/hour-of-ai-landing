# Dev Plan: Option C — Vertical Scroll + Sticky Section Nav

## Current State Analysis

The page is **already a single scrollable page** with a sticky top nav. However:
- **Mobile nav is a hamburger menu** → user can't see where they are
- **No section-awareness** → nav doesn't highlight the current section
- **Current section order is info-heavy before the funnel payoff** (About → Pillars → Activities → Register)
- **Floating CTA is the only mobile wayfinding** — and it disappears near the form

## Goal

Restructure into a clear **4-section funnel** with an always-visible compact section nav on mobile that tracks scroll position:

```
首頁 (Hero/Shock) → 體驗 (Experience) → 報名 (Register) → 關於 (About)
```

---

## Implementation Steps

### Step 1: Add `id="hero"` to Hero Section

The hero `<section class="hero">` currently has no `id`. Add `id="hero"` so the section nav can target it.

**File:** `src/index.html` line ~148

### Step 2: Add Section Nav Bar (HTML)

Add a new compact section nav **inside** the existing `<nav id="nav">`, right after `.nav-container`. On mobile, this replaces the hamburger menu as the primary wayfinding.

```html
<div class="section-nav" id="sectionNav">
  <a href="#hero" class="section-nav-item active" data-section="hero">首頁</a>
  <a href="#activities" class="section-nav-item" data-section="activities">體驗</a>
  <a href="#register" class="section-nav-item" data-section="register">報名</a>
  <a href="#about" class="section-nav-item" data-section="about">關於</a>
</div>
```

### Step 3: Style Section Nav (CSS)

**Mobile (≤768px) — visible:**
- Horizontal flex, full-width, inside sticky nav
- Each item: equal `flex: 1`, centered text, ~40px height
- Active: `border-bottom: 3px solid var(--color-primary-orange)`, `color: var(--color-navy)`, `font-weight: 700`
- Inactive: `color: var(--color-text-secondary)`, `font-weight: 400`
- Animated underline using `::after` with `transform: scaleX()` transition
- Hide `.mobile-menu-toggle` and `.nav-links` dropdown on mobile

**Desktop (>768px) — hidden:**
- `display: none`
- Keep existing full desktop nav-links as-is

### Step 4: Reorder HTML Sections for Funnel Flow

Current order:
```
Hero → Stats Bar → Live Stats → About → Pillars → Activities → Register → Footer
```

New order:
```
Hero → Stats Bar → Activities → Register → About → Pillars → Live Stats → Footer
```

Moves:
1. **Cut `#activities` section** (lines ~760-823) → paste after Stats Bar (after line ~196)
2. **Cut `#register` section** (lines ~826-1314) → paste after Activities
3. `#about`, `#pillars`, `#live-stats` stay in their relative order but now come after Register

This creates the funnel: **Shock (hero + stats) → Try it (experience) → Sign up (register) → Learn more (about + pillars + stats dashboard)**

### Step 5: IntersectionObserver for Section Tracking (JS)

New function in `main.js`:

```js
function initSectionNav() {
  const sectionIds = ['hero', 'activities', 'register', 'about'];
  const navItems = document.querySelectorAll('.section-nav-item');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navItems.forEach(item => item.classList.remove('active'));
        const activeItem = document.querySelector(
          `.section-nav-item[data-section="${entry.target.id}"]`
        );
        if (activeItem) activeItem.classList.add('active');
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '-20% 0px -50% 0px'
  });

  sectionIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}
```

The `rootMargin: '-20% 0px -50% 0px'` creates a trigger zone in the upper 30% of the viewport, so the section near the top of the screen gets highlighted.

### Step 6: Smooth Scroll Click Handlers (JS)

Add to `initSectionNav()`:

```js
navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = item.dataset.section;
    const target = document.getElementById(targetId);
    if (target) {
      const navHeight = document.getElementById('nav').offsetHeight;
      window.scrollTo({
        top: target.offsetTop - navHeight,
        behavior: 'smooth'
      });
    }
  });
});
```

### Step 7: Update Floating CTA Context-Awareness (JS)

Current: Always shows "免費體驗 AI 課程" → `#activities`

New behavior based on scroll position:
- **Hero visible**: Show "免費體驗 AI 課程" → `#activities`
- **Activities visible**: Show "我要舉辦活動" → `#register`
- **Register/About visible**: Hide

### Step 8: Hide Hamburger on Mobile (CSS)

In `@media (max-width: 768px)`:
- `.mobile-menu-toggle { display: none; }`
- `.nav-links { display: none !important; }` (the dropdown, not the section nav)
- Section nav is always visible

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/index.html` | Add `id="hero"`, add section nav HTML, reorder sections |
| `src/styles/main.css` | Add `.section-nav-*` styles, mobile media query for hide hamburger + show section nav |
| `src/scripts/main.js` | Add `initSectionNav()` with IO + smooth scroll, update floating CTA logic |

## What Stays the Same

- **Desktop nav** (full nav-links) — unchanged
- **All section content** — unchanged, just reordered
- **Multi-step form logic** — unchanged
- **Pillar modal** — unchanged
- **Analytics/tracking** — unchanged
- **Fade-in animations** — unchanged
- **All backend/GAS integration** — unchanged

## Execution Order

1. ~~Explore codebase~~ ✅
2. Add `id="hero"` to hero section
3. Add section nav HTML inside `<nav>`
4. Add section nav CSS (mobile-first)
5. Reorder HTML sections for funnel flow
6. Add IntersectionObserver JS for section tracking
7. Add smooth scroll click handlers
8. Update floating CTA context-awareness
9. Hide hamburger on mobile, show section nav
10. Test & verify
11. Commit & push
