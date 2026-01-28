/**
 * Hour of AI - Taiwan Rank Tracker
 * Fetches data daily and sends email notification to Slack
 *
 * @version 1.0.0
 * @author Claude Code
 * @description Tracks Taiwan's ranking in Hour of AI event registrations
 */

// Configuration
const CONFIG = {
  dataUrl: 'https://docs.google.com/spreadsheets/d/1QDTmNNP3i6Nfhg6y7qp5V_cSL6ciNsMyF3bEjyKXTsY/export?format=csv',
  targetCountry: 'Taiwan',
  emailRecipient: '2026sap2_ai-lit-aaaarjgmcggbpb4ikuucdkubve@junyiacademy.slack.com',
  spreadsheetId: '', // Optional: Set this to store historical data
};

/**
 * Main function - Run this daily
 */
function trackTaiwanRank() {
  try {
    const data = fetchAndParseCSV();
    const taiwanData = analyzeTaiwanRank(data);
    sendEmailNotification(taiwanData);

    // Optional: Store to spreadsheet
    if (CONFIG.spreadsheetId) {
      logToSpreadsheet(taiwanData);
    }

    Logger.log('✅ Successfully tracked Taiwan rank: ' + taiwanData.rank);
  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
    sendErrorNotification(error);
  }
}

/**
 * Fetch and parse CSV data
 */
function fetchAndParseCSV() {
  const response = UrlFetchApp.fetch(CONFIG.dataUrl);
  const csvText = response.getContentText();
  const lines = csvText.split('\n');

  const data = [];
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const [country, count] = line.split(',');
    if (country && count) {
      data.push({
        country: country.trim().replace(/^"|"$/g, ''), // Remove quotes
        count: parseInt(count.trim())
      });
    }
  }

  return data;
}

/**
 * Analyze Taiwan's rank and surrounding countries
 */
function analyzeTaiwanRank(data) {
  // Sort by count descending
  const sorted = data
    .filter(item => item.count > 0) // Only countries with events
    .sort((a, b) => b.count - a.count);

  // Find Taiwan
  const taiwanIndex = sorted.findIndex(item => item.country === CONFIG.targetCountry);

  if (taiwanIndex === -1) {
    throw new Error('Taiwan not found in data');
  }

  const taiwan = sorted[taiwanIndex];
  const rank = taiwanIndex + 1;
  const totalCountries = sorted.length;

  // Get surrounding countries (2 above, 2 below)
  const context = {
    above: sorted.slice(Math.max(0, taiwanIndex - 2), taiwanIndex),
    below: sorted.slice(taiwanIndex + 1, taiwanIndex + 3)
  };

  return {
    rank: rank,
    count: taiwan.count,
    totalCountries: totalCountries,
    percentile: ((totalCountries - rank + 1) / totalCountries * 100).toFixed(1),
    context: context,
    topCountry: sorted[0],
    timestamp: new Date()
  };
}

/**
 * Send email notification (Plain text optimized for Slack)
 */
function sendEmailNotification(data) {
  const subject = `🇹🇼 Taiwan Hour of AI Rank: #${data.rank} (${data.count} events)`;

  let body = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🇹🇼 TAIWAN HOUR OF AI EVENT TRACKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Date: ${Utilities.formatDate(data.timestamp, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 TAIWAN'S RANKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏅 Rank: #${data.rank} out of ${data.totalCountries} countries
📈 Events: ${data.count} registered events
⭐ Percentile: Top ${data.percentile}% globally

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 CONTEXT - NEARBY COUNTRIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▲ Countries Ranked Above Taiwan:
`;

  data.context.above.forEach((country, idx) => {
    const rank = data.rank - data.context.above.length + idx;
    body += `   #${rank.toString().padEnd(3)} ${country.country.padEnd(30)} ${country.count} events\n`;
  });

  body += `
➡️  #${data.rank.toString().padEnd(3)} TAIWAN ${' '.repeat(24)} ${data.count} events ⬅️

▼ Countries Ranked Below Taiwan:
`;

  data.context.below.forEach((country, idx) => {
    const rank = data.rank + idx + 1;
    body += `   #${rank.toString().padEnd(3)} ${country.country.padEnd(30)} ${country.count} events\n`;
  });

  body += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 TOP COUNTRY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👑 ${data.topCountry.country} leads with ${data.topCountry.count} events

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Data source: https://csforall.org/en-US/hour-of-ai/how-to/global
🤖 Automated by Google Apps Script
`;

  MailApp.sendEmail({
    to: CONFIG.emailRecipient,
    subject: subject,
    body: body
  });
}

/**
 * Send error notification
 */
function sendErrorNotification(error) {
  MailApp.sendEmail({
    to: CONFIG.emailRecipient,
    subject: '⚠️ Taiwan Hour of AI Tracker - Error',
    body: 'An error occurred while tracking Taiwan\'s rank:\n\n' + error.toString()
  });
}

/**
 * Optional: Log historical data to spreadsheet
 */
function logToSpreadsheet(data) {
  if (!CONFIG.spreadsheetId) return;

  const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  let sheet = ss.getSheetByName('Taiwan Rank History');

  // Create sheet if doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet('Taiwan Rank History');
    sheet.appendRow(['Timestamp', 'Rank', 'Event Count', 'Total Countries', 'Percentile', 'Top Country', 'Top Country Count']);
  }

  sheet.appendRow([
    data.timestamp,
    data.rank,
    data.count,
    data.totalCountries,
    data.percentile,
    data.topCountry.country,
    data.topCountry.count
  ]);
}

/**
 * Test function - Run this manually to test
 */
function testTracker() {
  trackTaiwanRank();
}
