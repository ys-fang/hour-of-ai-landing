# Click Tracking - Activity Split Implementation

**Date**: 2026-02-05 12:00
**Status**: ✅ Deployed and Ready

---

## 🎯 What Changed

### Problem
- Previous implementation couldn't differentiate between Active AI and AI Square clicks
- Required GA4 custom dimensions (24-48 hour delay)

### Solution
- **Use separate event names** for each activity type
- No GA4 configuration needed
- Works immediately after deployment

---

## 📊 Implementation Details

### Frontend Changes (src/scripts/clickTracking.js)

**Before**:
```javascript
// 所有點擊使用同一個事件名稱
gtag('event', 'activity_cta_click', {
  event_label: 'active_ai',  // 用參數區分
  ...
})
```

**After**:
```javascript
// 使用不同的事件名稱
// Active AI → 'active_ai_click'
// AI Square → 'ai_square_click'
gtag('event', 'active_ai_click', { ... })
gtag('event', 'ai_square_click', { ... })
```

### Backend Changes (backend/gas/Code.js)

**Query Strategy**:
```javascript
// 使用 OR filter 查詢兩個事件
dimensionFilter: {
  orGroup: {
    expressions: [
      { eventName: 'active_ai_click' },
      { eventName: 'ai_square_click' }
    ]
  }
}

// 根據事件名稱分類計數
if (eventName === 'active_ai_click') {
  activeAiClicks += clickCount;
} else if (eventName === 'ai_square_click') {
  aiSquareClicks += clickCount;
}
```

---

## ✅ Deployment Status

### Frontend
- **Built**: 2026-02-05 12:00 (156ms)
- **Deployed**: Firebase Hosting
- **File**: `assets/main-D24DRxYY.js` (41.74 kB)
- **Verification**: ✅ Both event names found in bundle

### Backend
- **Pushed**: `clasp push` completed
- **Function**: `getGA4ClickStats()` updated
- **Test Function**: `testGA4ClickStats()`

---

## 🧪 Testing

### Manual Frontend Test

1. Visit: https://hour-of-ai-landing-junyi.web.app
2. Open DevTools → Console
3. Click "開始學習" on **Active AI** card
4. Verify log: `[Click Tracking] Tracked: active_ai (event: active_ai_click)`
5. Click "開始學習" on **AI Square** card
6. Verify log: `[Click Tracking] Tracked: ai_square (event: ai_square_click)`

### GA4 Real-time Verification

1. Open: https://analytics.google.com/analytics/web/#/p266069252/realtime
2. Click both CTA buttons
3. Check Events section for:
   - `active_ai_click` event
   - `ai_square_click` event

### Backend API Test

Run in Apps Script Editor:
```javascript
testGA4ClickStats()
```

**Expected Output** (after clicks accumulate):
```
✅ GA4 Click Stats:
本週總點擊: 15
  - Active AI: 8
  - AI Square: 7
上週總點擊: 0
成長率: +100.0%
```

**Note**: Will show 0 initially (GA4 24-48h delay for new events)

---

## 📧 Weekly Report Format

Once data accumulates, the Slack weekly report will show:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 活動連結點擊追蹤
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 數據世界 (Active AI)：25 次 📈 (+150.0% vs 上週)
🎮 半導體冒險 (AI Square)：18 次 📈 (+80.0% vs 上週)
📊 總點擊數：43 次 📈 (+115.0% vs 上週)
🎯 點擊轉換率：2.15% (43 clicks / 2000 pageviews)
```

---

## 🎯 Advantages of This Approach

✅ **Immediate**: No GA4 configuration needed
✅ **Simple**: No custom dimensions to manage
✅ **Clear**: Event names are self-documenting in GA4
✅ **Reliable**: Uses standard GA4 dimensions
✅ **Flexible**: Easy to add more activity types

---

## 📝 Future Activities

To add tracking for a new activity:

1. **Frontend**: Add event name constant
```javascript
export const GA4_EVENT_NAMES = {
    ACTIVE_AI: 'active_ai_click',
    AI_SQUARE: 'ai_square_click',
    NEW_ACTIVITY: 'new_activity_click',  // Add here
};
```

2. **Backend**: Add to OR filter
```javascript
{
  filter: {
    fieldName: 'eventName',
    stringFilter: {
      matchType: 'EXACT',
      value: 'new_activity_click'
    }
  }
}
```

3. **Report**: Add to Slack message format

---

## 🔄 Migration Notes

### Backward Compatibility
- Old events (`activity_cta_click`) will continue to work
- New events (`active_ai_click`, `ai_square_click`) are now used
- Historical data using old event name is preserved

### Data Timeline
- **Before 2026-02-05 12:00**: Data under `activity_cta_click` (no split)
- **After 2026-02-05 12:00**: Data under separate event names (with split)

---

## 🎉 Result

**Click tracking now fully supports activity-specific analytics!**

- ✅ Frontend deployed
- ✅ Backend deployed
- ✅ No GA4 configuration needed
- ✅ Ready to collect data immediately

**Next**: Wait 24-48 hours for GA4 data, then verify with `testGA4ClickStats()`

---

**Deployed**: 2026-02-05 12:00
**Status**: LIVE and Ready to Track
