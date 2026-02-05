# Daily Click Tracker - Google Sheet Logging

**Date**: 2026-02-05 12:30
**Feature**: Store daily click summaries in Google Sheet (Option 1)

---

## 📊 Overview

Similar to the Taiwan Rank Tracker, this feature automatically logs daily click statistics to a Google Sheet for historical tracking and analysis.

### Sheet Structure

**Sheet Name**: `ClickHistory`

| Column | Type | Description |
|--------|------|-------------|
| `date` | Date | YYYY-MM-DD format |
| `total_clicks` | Number | Total clicks (active_ai + ai_square) |
| `active_ai_clicks` | Number | Active AI (數據世界) clicks |
| `ai_square_clicks` | Number | AI Square (半導體冒險) clicks |
| `notes` | Text | Auto-logging info |

### Example Data
```
date       | total_clicks | active_ai_clicks | ai_square_clicks | notes
-----------|--------------|------------------|------------------|------------
2026-02-05 | 43           | 25               | 18               | Auto-logged
2026-02-06 | 67           | 38               | 29               | Auto-logged
2026-02-07 | 52           | 30               | 22               | Auto-logged
```

---

## 🔧 Implementation Details

### Configuration (CONFIG in Code.js)

```javascript
// ===== Click Tracking 設定 =====
ENABLE_CLICK_TRACKER: true,
CLICK_HISTORY_SHEET_NAME: 'ClickHistory',  // 點擊歷史資料工作表
```

### Main Function: `trackDailyClicks()`

**What it does**:
1. Queries GA4 for **yesterday's** click data (more accurate than today)
2. Aggregates clicks by event type (`active_ai_click`, `ai_square_click`)
3. Logs summary to `ClickHistory` sheet
4. Auto-creates sheet if it doesn't exist
5. Updates existing record if date already exists (prevents duplicates)

**Why yesterday's data?**
- GA4 has processing delay (can take hours)
- Yesterday's data is complete and final
- More reliable for historical tracking

### Helper Function: `logDailyClicksToSheet()`

Similar to `logGlobalTop10ToSheet()` pattern:
- Creates sheet with headers if missing
- Checks for existing date to avoid duplicates
- Updates instead of duplicating if date exists

---

## 🚀 Setup Instructions

### Step 1: Manual Test (Do This First)

1. Open Apps Script Editor: https://script.google.com/home/projects/1Uu7UG3oLNkX_cFI54eeYrjqp1oN5gj-FJ36kMvT37AJGL1eNCCU0Oi48
2. Run function: `testDailyClickTracker()`
3. Check execution logs
4. Open Google Sheet: https://docs.google.com/spreadsheets/d/1am2e_RU_fkx--338b7F76NjjP8CM5O1wnKYJmDRubhM
5. Verify new `ClickHistory` sheet was created

**Expected logs**:
```
✅ Created new sheet: ClickHistory
✅ Logged click data to ClickHistory for 2026-02-04
✅ Successfully tracked daily clicks for 2026-02-04: Total=0, ActiveAI=0, AISquare=0
```

*Note: Counts will be 0 initially (new events, GA4 delay)*

### Step 2: Set Up Daily Trigger

1. Go to: **Apps Script Editor > Triggers** (clock icon)
2. Click: **Add Trigger**
3. Configure:
   - **Function**: `trackDailyClicks`
   - **Event source**: Time-driven
   - **Type**: Day timer
   - **Time**: 9am-10am (or any time, but later is better for complete data)
4. Save

**Recommended time**: 9am-10am (gives GA4 overnight to process previous day)

---

## 🧪 Testing

### Test 1: Manual Execution

```javascript
testDailyClickTracker()
```

**Expected Result**:
- ✅ Sheet created (if first run)
- ✅ Row added with yesterday's date
- ✅ Counts may be 0 (normal for new events)

### Test 2: Check Sheet

1. Open: https://docs.google.com/spreadsheets/d/1am2e_RU_fkx--338b7F76NjjP8CM5O1wnKYJmDRubhM
2. Look for: `ClickHistory` sheet
3. Verify: Headers and first data row

### Test 3: Duplicate Prevention

Run `testDailyClickTracker()` twice:
- ✅ First run: Creates new row
- ✅ Second run: Updates existing row (not duplicate)

---

## 📊 Data Analysis Examples

### Calculate 7-day Average
```
=AVERAGE(B2:B8)  // Average of last 7 days total clicks
```

### Find Peak Day
```
=MAX(B:B)  // Maximum clicks in any day
```

### Growth Trend
Create a line chart:
- X-axis: `date`
- Y-axis: `total_clicks`, `active_ai_clicks`, `ai_square_clicks`

### Compare Activities
```
=ARRAYFORMULA(C2:C / D2:D)  // Active AI / AI Square ratio
```

---

## 🔄 How It Relates to Other Systems

### Taiwan Rank Tracker
- **Similar pattern**: Daily automated logging to sheet
- **Similar function**: `logGlobalTop10ToSheet()` vs `logDailyClicksToSheet()`
- **Similar trigger**: Time-driven daily execution

### Weekly Report
- **Different purpose**: Weekly report queries GA4 for recent data
- **This feature**: Logs historical data for long-term analysis
- **Complementary**: Both use `getGA4ClickStats()` logic

### GA4 Integration
- **Source**: Both read from GA4 Data API
- **Difference**: Weekly report = real-time query, Daily logger = historical snapshot

---

## ⚙️ Configuration Options

### Enable/Disable
```javascript
ENABLE_CLICK_TRACKER: false,  // Set to false to disable
```

### Change Sheet Name
```javascript
CLICK_HISTORY_SHEET_NAME: 'MyCustomSheetName',
```

### Log Today Instead of Yesterday
Modify `trackDailyClicks()`:
```javascript
// Change from:
yesterday.setDate(yesterday.getDate() - 1);

// To:
const today = new Date();
const dateStr = formatDateTW(today, 'yyyy-MM-dd');
```

*Not recommended due to GA4 delay*

---

## 🐛 Troubleshooting

### Issue: Sheet not created
**Solution**: Run `testDailyClickTracker()` manually first

### Issue: All counts are 0
**Causes**:
1. New events (need 24-48h for GA4 to process)
2. No actual clicks happened yesterday
3. Event names changed (check frontend uses `active_ai_click`, `ai_square_click`)

**Verify**: Check GA4 real-time events

### Issue: Duplicate rows
**Shouldn't happen**: Function checks for existing date
**If it does**: Check date format consistency

### Issue: Trigger not running
**Check**:
1. Trigger exists in Apps Script > Triggers
2. Trigger function name is correct: `trackDailyClicks`
3. Check trigger execution logs for errors

---

## 📅 Timeline

- **Today (2/5)**: Feature deployed, waiting for data
- **Tomorrow (2/6 9am)**: First automatic log (for 2/5 data)
- **In 1 week**: 7 days of historical data accumulated
- **In 1 month**: Enough data for trend analysis

---

## 🎯 Benefits

✅ **Historical tracking**: Long-term click trends
✅ **Easy analysis**: Use Google Sheets formulas and charts
✅ **Data persistence**: Independent of GA4 data retention
✅ **Audit trail**: Know exactly what was tracked when
✅ **Correlation**: Compare with registration data in same spreadsheet

---

**Status**: ✅ Code deployed, ready for testing
**Next Step**: Run `testDailyClickTracker()` in Apps Script Editor
**Then**: Set up daily trigger for automated logging

---

*Similar to Taiwan Rank Tracker pattern*
*Deployed: 2026-02-05 12:30*
