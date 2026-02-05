# Google Apps Script Backend

Backend code for Hour of AI Landing Page, deployed via clasp CLI.

## 📁 Files

- `Code.js` - Main GAS script (all functions)
- `appsscript.json` - GAS project manifest
- `.clasp.json` - clasp configuration
- `creds.json` - OAuth credentials (gitignored)
- `DEPLOYMENT-CHECKLIST.md` - **Read this before deploying!**

## 🚀 Quick Start

```bash
# Deploy code
clasp push

# View logs
clasp logs | head -30

# Test in Apps Script Editor (required for UrlFetchApp, SpreadsheetApp)
# https://script.google.com/home/projects/1Uu7UG3oLNkX_cFI54eeYrjqp1oN5gj-FJ36kMvT37AJGL1eNCCU0Oi48
```

## ⚠️ Critical Rule

**After modifying `Code.js`, you MUST run `clasp push`!**

Otherwise, triggers will continue executing the old version.

## 📋 Deployment Process

See [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) for complete workflow.

Short version:
1. Modify `Code.js`
2. `clasp push`
3. Test in Apps Script Editor
4. Verify logs: `clasp logs`
5. Commit to git

## 🤖 Active Triggers

| Function | Schedule | Purpose |
|----------|----------|---------|
| `trackTaiwanRank` | Daily 8-9 AM | Taiwan global ranking tracker |
| `sendWeeklyReport` | Weekly Tue 9-10 AM | Statistics weekly report |

## 🔗 Links

- Apps Script Editor: https://script.google.com/home/projects/1Uu7UG3oLNkX_cFI54eeYrjqp1oN5gj-FJ36kMvT37AJGL1eNCCU0Oi48
- Data Spreadsheet: https://docs.google.com/spreadsheets/d/1am2e_RU_fkx--338b7F76NjjP8CM5O1wnKYJmDRubhM
- GCP Project: https://console.cloud.google.com/home/dashboard?project=hour-of-ai-landing-junyi

## 📊 Test Functions

Run these in Apps Script Editor (not CLI):

```javascript
testGetStatistics()       // Test statistics API
testWeeklyReport()        // Test weekly Slack report
testTaiwanRankTracker()   // Test Taiwan rank tracker
testGetUpcomingEvents()   // Test events API
testInstantNotification() // Test instant Slack notification
testGa4Connection()       // Test GA4 API connection
```

---

*For detailed deployment guide, see [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)*
