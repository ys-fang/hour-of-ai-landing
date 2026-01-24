/**
 * Google Apps Script - Upcoming Events API for Hour of AI
 *
 * VERSION 1.0
 * This code should be ADDED to the existing google-apps-script-stats-api-updated.js
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a new sheet in your Google Spreadsheet named "UpcomingEvents"
 * 2. Add the following headers in row 1:
 *    id | title | description | url | startDate | endDate | isActive | sortOrder
 * 3. Add this code to your existing Google Apps Script
 * 4. Redeploy the web app
 *
 * SHEET COLUMNS:
 * - id: Unique identifier (required, e.g., "event-001")
 * - title: Event title (required, e.g., "AI 素養起步走｜學生體驗場")
 * - description: Event description (required)
 * - url: Link to event registration page (required, must be valid URL)
 * - startDate: Event start date (required, format: YYYY-MM-DD)
 * - endDate: Event end date (optional, format: YYYY-MM-DD)
 * - isActive: TRUE/FALSE to show/hide event (required)
 * - sortOrder: Number for display order, lower = first (optional)
 *
 * USAGE:
 * GET request with ?action=getUpcomingEvents
 * Example: https://script.google.com/.../exec?action=getUpcomingEvents
 */

// ===== UPCOMING EVENTS CONFIGURATION =====

const UPCOMING_EVENTS_CONFIG = {
  SHEET_NAME: 'UpcomingEvents',  // Name of the sheet containing events
  CACHE_DURATION: 5 * 60,        // Cache duration in seconds (5 minutes)
  CACHE_KEY: 'upcoming_events_cache',
};

// ===== UPCOMING EVENTS API =====

/**
 * Get upcoming events from the UpcomingEvents sheet
 * Call this from doGet when action === 'getUpcomingEvents'
 *
 * Add this to your existing doGet function:
 *
 *   if (action === 'getUpcomingEvents') {
 *     return getUpcomingEvents();
 *   }
 */
function getUpcomingEvents() {
  try {
    // Try to get from cache first
    const cache = CacheService.getScriptCache();
    const cached = cache.get(UPCOMING_EVENTS_CONFIG.CACHE_KEY);

    if (cached) {
      Logger.log('Returning cached upcoming events');
      return ContentService.createTextOutput(cached)
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Get the UpcomingEvents sheet
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(UPCOMING_EVENTS_CONFIG.SHEET_NAME);

    if (!sheet) {
      Logger.log('UpcomingEvents sheet not found, returning empty array');
      return createEventsResponse([]);
    }

    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      // Only headers or empty
      return createEventsResponse([]);
    }

    const headers = data[0];
    const rows = data.slice(1);

    // Map column indices
    const columns = {
      id: headers.indexOf('id'),
      title: headers.indexOf('title'),
      description: headers.indexOf('description'),
      url: headers.indexOf('url'),
      startDate: headers.indexOf('startDate'),
      endDate: headers.indexOf('endDate'),
      isActive: headers.indexOf('isActive'),
      sortOrder: headers.indexOf('sortOrder'),
    };

    // Validate required columns exist
    const requiredColumns = ['id', 'title', 'description', 'url', 'startDate', 'isActive'];
    for (const col of requiredColumns) {
      if (columns[col] === -1) {
        Logger.log(`Missing required column: ${col}`);
        return createEventsResponse([], `Missing required column: ${col}`);
      }
    }

    // Process rows into event objects
    const events = rows
      .map((row, index) => {
        try {
          return {
            id: String(row[columns.id] || ''),
            title: String(row[columns.title] || ''),
            description: String(row[columns.description] || ''),
            url: String(row[columns.url] || ''),
            startDate: formatDateValue(row[columns.startDate]),
            endDate: columns.endDate !== -1 ? formatDateValue(row[columns.endDate]) : null,
            isActive: parseBoolean(row[columns.isActive]),
            sortOrder: columns.sortOrder !== -1 ? parseNumber(row[columns.sortOrder]) : index,
          };
        } catch (error) {
          Logger.log(`Error processing row ${index + 2}: ${error.toString()}`);
          return null;
        }
      })
      .filter(event => event !== null);

    Logger.log(`Found ${events.length} events in sheet`);

    // Create response and cache it
    const response = createEventsResponse(events);
    cache.put(
      UPCOMING_EVENTS_CONFIG.CACHE_KEY,
      response.getContent(),
      UPCOMING_EVENTS_CONFIG.CACHE_DURATION
    );

    return response;

  } catch (error) {
    Logger.log('Error in getUpcomingEvents: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString(),
      events: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Create standardized events response
 */
function createEventsResponse(events, warning = null) {
  const response = {
    status: 'success',
    events: events,
    count: events.length,
    timestamp: new Date().toISOString()
  };

  if (warning) {
    response.warning = warning;
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Format date value from Google Sheets
 * Handles both Date objects and string formats
 */
function formatDateValue(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return Utilities.formatDate(value, 'Asia/Taipei', 'yyyy-MM-dd');
  }

  if (typeof value === 'string') {
    // Already a string, try to parse and reformat
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return Utilities.formatDate(date, 'Asia/Taipei', 'yyyy-MM-dd');
    }
    return value; // Return as-is if can't parse
  }

  if (typeof value === 'number') {
    // Google Sheets serial date
    const date = new Date((value - 25569) * 86400 * 1000);
    return Utilities.formatDate(date, 'Asia/Taipei', 'yyyy-MM-dd');
  }

  return null;
}

/**
 * Parse boolean from various formats
 */
function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === 'yes' || lower === '是' || lower === '1';
  }
  if (typeof value === 'number') return value !== 0;
  return false;
}

/**
 * Parse number from various formats
 */
function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Clear the events cache
 * Useful when you update the sheet and want immediate refresh
 */
function clearEventsCache() {
  const cache = CacheService.getScriptCache();
  cache.remove(UPCOMING_EVENTS_CONFIG.CACHE_KEY);
  Logger.log('Events cache cleared');
}

/**
 * Test function - run this to verify the setup
 */
function testGetUpcomingEvents() {
  const result = getUpcomingEvents();
  Logger.log('Result: ' + result.getContent());
}

// ===== INTEGRATION INSTRUCTIONS =====
/*

To integrate this with your existing doGet function, modify it like this:

function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === 'getStats') {
      return getStatistics();
    }

    // ADD THIS NEW CONDITION:
    if (action === 'getUpcomingEvents') {
      return getUpcomingEvents();
    }

    // Default response
    return ContentService.createTextOutput('Hour of AI Statistics API v3.1')
      .setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

*/
