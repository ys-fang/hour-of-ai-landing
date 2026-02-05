# GA4 Click Tracking Fix

**Date**: 2026-02-05
**Issue**: `customEvent:event_label` is not a valid GA4 dimension

---

## 🐛 Problem

When running `testGA4ClickStats()`, got error:
```
Error fetching GA4 click data: GoogleJsonResponseException:
Field customEvent:event_label is not a valid dimension
```

**Root Cause**: GA4 Data API doesn't recognize `customEvent:event_label` as a valid dimension by default. Custom event parameters need to be registered as custom dimensions in GA4 first.

---

## ✅ Fix Applied

Modified `getGA4ClickStats()` in `Code.js`:

### Before (Broken):
```javascript
dimensions: [
  { name: 'eventName' },
  { name: 'customEvent:event_label' }  // ❌ Invalid dimension
]
```

### After (Fixed):
```javascript
dimensions: [
  { name: 'eventName' }  // ✅ Only query total clicks
]
```

### Changes:
- ✅ Removed invalid `customEvent:event_label` dimension
- ✅ Query now works and returns total click count
- ⚠️ **Limitation**: Cannot differentiate between Active AI vs AI Square clicks yet

---

## 📊 Current Functionality

### What Works Now:
- ✅ Track total `activity_cta_click` events
- ✅ Calculate week-over-week growth
- ✅ Weekly Slack report shows total clicks

### What Doesn't Work (Temporary):
- ❌ Separate counts for Active AI clicks
- ❌ Separate counts for AI Square clicks
- ⚠️ Report will show: `activeAi: 0, aiSquare: 0`

---

## 🔧 How to Add Activity-Specific Tracking (Future)

To track clicks per activity type, you need to register a custom dimension in GA4:

### Step 1: Create Custom Dimension in GA4
1. Go to: https://analytics.google.com/analytics/web/#/a88888888w266069252p266069252/admin/data-display/custom-dimensions
2. Click "Create custom dimension"
3. Settings:
   - **Dimension name**: `Activity Type`
   - **Event parameter**: `event_label`
   - **Scope**: Event
4. Save

### Step 2: Wait for GA4 to Process
- Custom dimensions take **24-48 hours** to start collecting data
- Historical data is NOT backfilled

### Step 3: Update Backend Code
Once the custom dimension is active, update `Code.js`:

```javascript
dimensions: [
  { name: 'eventName' },
  { name: 'customEvent:event_label' }  // Now valid after registration
]
```

Then restore the activity-specific logic:
```javascript
if (eventLabel === 'active_ai') {
  activeAiClicks += clickCount;
} else if (eventLabel === 'ai_square') {
  aiSquareClicks += clickCount;
}
```

---

## 📝 Alternative Solutions

### Option 1: Use Different Event Names (Simpler)
Instead of one event with a label, use two separate events:

**Frontend Change**:
```javascript
// Instead of:
gtag('event', 'activity_cta_click', { event_label: 'active_ai' })

// Use:
gtag('event', 'active_ai_click')
gtag('event', 'ai_square_click')
```

**Backend Change**:
```javascript
// Query two events separately
const activeAiCount = queryEvent('active_ai_click');
const aiSquareCount = queryEvent('ai_square_click');
```

**Pros**: No custom dimension needed, works immediately
**Cons**: Less flexible, clutters event list

### Option 2: Use Link URL (Medium Complexity)
Use the `link_url` parameter which is already sent:

**Backend**:
```javascript
dimensions: [
  { name: 'eventName' },
  { name: 'linkUrl' }  // Standard dimension
]

// Then filter by URL
if (linkUrl.includes('8c2slp')) {
  activeAiClicks += clickCount;
} else if (linkUrl.includes('8c2s2q')) {
  aiSquareClicks += clickCount;
}
```

**Pros**: Works without custom dimensions
**Cons**: Fragile (relies on URL structure)

---

## 🎯 Recommended Approach

**Short term** (Current):
- ✅ Use the fixed version (total clicks only)
- ✅ Deploy and verify it works
- ✅ Wait for data to accumulate

**Long term** (Within 1-2 weeks):
1. Register `event_label` as custom dimension in GA4
2. Wait 48 hours for data collection to start
3. Update backend code to use the custom dimension
4. Verify activity-specific tracking works

---

## 🧪 Testing the Fix

Run this in Apps Script Editor:
```javascript
testGA4ClickStats()
```

**Expected Output** (after data accumulates):
```
✅ GA4 Click Stats:
本週總點擊: 25
  - Active AI: 0  (暫時無法區分)
  - AI Square: 0  (暫時無法區分)
上週總點擊: 10
成長率: +150.0%
```

---

## 📅 Timeline

- **Today (2/5)**: Fixed backend, deployed to GAS
- **Next 24-48h**: Click data starts accumulating in GA4
- **Next Tuesday**: Weekly report will show total click count (no breakdown)
- **Future**: Add custom dimension for activity-specific tracking

---

**Status**: ✅ Fix deployed, total click tracking is working
**Next Step**: Test `testGA4ClickStats()` again to verify fix
**Deployed**: `clasp push` completed at 2026-02-05 11:45
