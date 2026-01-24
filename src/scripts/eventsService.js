/**
 * Events Service Module
 * Handles fetching, validating, filtering, and processing upcoming events data
 * from Google Sheets via Google Apps Script API
 */

// ===== Date Parsing =====

/**
 * Parse date from various formats (Google Sheets may return different formats)
 * @param {string|number} dateValue - Date value from sheet
 * @returns {Date|null} - Parsed Date object or null if invalid
 */
export function parseSheetDate(dateValue) {
  if (dateValue === null || dateValue === undefined || dateValue === '') {
    return null;
  }

  // Handle Google Sheets serial date number
  if (typeof dateValue === 'number') {
    // Google Sheets epoch is December 30, 1899
    const sheetsEpoch = new Date(1899, 11, 30);
    const date = new Date(sheetsEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }

  // Handle string formats
  if (typeof dateValue === 'string') {
    // Try YYYY-MM-DD or YYYY/MM/DD format
    const normalized = dateValue.replace(/\//g, '-');
    const date = new Date(normalized);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

// ===== Validation =====

/**
 * Validate a single event object
 * @param {Object} event - Event object to validate
 * @returns {boolean} - True if valid
 */
export function validateEvent(event) {
  if (!event || typeof event !== 'object') {
    return false;
  }

  // Check required fields
  const requiredFields = ['id', 'title', 'description', 'url', 'startDate'];
  for (const field of requiredFields) {
    if (!event[field] || (typeof event[field] === 'string' && event[field].trim() === '')) {
      return false;
    }
  }

  // Validate URL format
  try {
    new URL(event.url);
  } catch {
    return false;
  }

  // Validate startDate
  const parsedDate = parseSheetDate(event.startDate);
  if (!parsedDate) {
    return false;
  }

  return true;
}

/**
 * Validate and filter an array of events
 * @param {Array} events - Array of event objects
 * @returns {Array} - Array of valid events only
 */
export function validateEvents(events) {
  if (!Array.isArray(events)) {
    return [];
  }
  return events.filter(validateEvent);
}

// ===== Filtering =====

/**
 * Filter events to only include active ones
 * @param {Array} events - Array of event objects
 * @returns {Array} - Array of active events
 */
export function filterActiveEvents(events) {
  if (!Array.isArray(events)) {
    return [];
  }
  return events.filter((event) => event.isActive === true);
}

/**
 * Filter events by date range (exclude expired events)
 * @param {Array} events - Array of event objects
 * @param {Date} [referenceDate] - Date to compare against (defaults to now)
 * @returns {Array} - Array of non-expired events
 */
export function filterByDateRange(events, referenceDate = new Date()) {
  if (!Array.isArray(events)) {
    return [];
  }

  // Normalize reference date to start of day
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  return events.filter((event) => {
    // If no endDate, event is considered ongoing
    if (!event.endDate) {
      return true;
    }

    const endDate = parseSheetDate(event.endDate);
    if (!endDate) {
      return true; // If endDate is invalid, keep the event
    }

    // Include events that end today or later
    endDate.setHours(23, 59, 59, 999);
    return endDate >= today;
  });
}

// ===== Sorting =====

/**
 * Sort events by sortOrder (ascending) then by startDate
 * @param {Array} events - Array of event objects
 * @returns {Array} - Sorted array (new array, doesn't mutate original)
 */
export function sortEvents(events) {
  if (!Array.isArray(events)) {
    return [];
  }

  return [...events].sort((a, b) => {
    // First sort by sortOrder (events without sortOrder go to end)
    const orderA = typeof a.sortOrder === 'number' ? a.sortOrder : Infinity;
    const orderB = typeof b.sortOrder === 'number' ? b.sortOrder : Infinity;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // Then sort by startDate
    const dateA = parseSheetDate(a.startDate);
    const dateB = parseSheetDate(b.startDate);

    if (dateA && dateB) {
      return dateA.getTime() - dateB.getTime();
    }

    return 0;
  });
}

// ===== Full Processing Pipeline =====

/**
 * Process raw events data through the full pipeline:
 * validate -> filter active -> filter by date -> sort
 * @param {Array} rawData - Raw events data from API
 * @returns {Array} - Processed events ready for display
 */
export function processEventsData(rawData) {
  if (!rawData) {
    return [];
  }

  // Pipeline: validate -> filter active -> filter expired -> sort
  const validated = validateEvents(rawData);
  const active = filterActiveEvents(validated);
  const current = filterByDateRange(active);
  const sorted = sortEvents(current);

  return sorted;
}

// ===== Configuration =====

export const EVENTS_CONFIG = {
  CACHE_KEY: 'hourOfAI_events_cache',
  CACHE_TIMESTAMP_KEY: 'hourOfAI_events_timestamp',
  CACHE_DURATION: 30 * 60 * 1000, // 30 minutes
  AUTOPLAY_INTERVAL: 5000, // 5 seconds

  // Fallback data when API is unavailable
  fallbackEvents: [
    {
      id: 'fallback-1',
      title: 'AI 素養起步走｜學生體驗場',
      description: '由均一老師全程線上帶領，讓孩子趣味體驗 AI',
      url: 'https://link.junyiacademy.org/8k8ckh',
      startDate: '2026-01-22',
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 'fallback-2',
      title: 'AI 素養起步走｜教師增能場',
      description: '陪老師一起學習如何在課堂中引導孩子培養 AI 素養',
      url: 'https://link.junyiacademy.org/8k8ckh',
      startDate: '2026-01-27',
      isActive: true,
      sortOrder: 2,
    },
  ],
};

// ===== API Fetching =====

/**
 * Get the events API URL based on configuration
 * @param {Object} config - Global CONFIG object
 * @returns {string} - API URL or special mode identifier
 */
export function getEventsApiUrl(config) {
  if (!config) {
    return 'DEMO_MODE';
  }

  if (typeof config.IS_DEMO_MODE === 'function' && config.IS_DEMO_MODE()) {
    return 'DEMO_MODE';
  }

  if (typeof config.isWordPressConfigValid === 'function' && !config.isWordPressConfigValid()) {
    return 'WORDPRESS_CONFIG_NEEDED';
  }

  if (config.FORM_SUBMIT_URL) {
    return config.FORM_SUBMIT_URL.replace('/exec', '/exec?action=getUpcomingEvents');
  }

  return 'DEMO_MODE';
}

/**
 * Fetch events from API with caching
 * @param {string} apiUrl - API endpoint URL
 * @param {boolean} [forceRefresh=false] - Force refresh ignoring cache
 * @returns {Promise<Array>} - Array of processed events
 */
export async function fetchEvents(apiUrl, forceRefresh = false) {
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = getCachedEvents();
    if (cached) {
      return cached;
    }
  }

  // Handle special modes
  if (apiUrl === 'DEMO_MODE' || apiUrl === 'WORDPRESS_CONFIG_NEEDED') {
    console.log('📋 Events: Using fallback data (demo mode)');
    return processEventsData(EVENTS_CONFIG.fallbackEvents);
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const events = processEventsData(data.events || data);

    // Cache the results
    setCachedEvents(events);

    return events;
  } catch (error) {
    console.warn('⚠️ Events API fetch failed, using fallback:', error.message);

    // Try to return stale cache
    const staleCache = getCachedEvents(true);
    if (staleCache) {
      console.log('📋 Using stale cached events');
      return staleCache;
    }

    return processEventsData(EVENTS_CONFIG.fallbackEvents);
  }
}

// ===== Caching =====

/**
 * Get cached events if valid
 * @param {boolean} [ignoreExpiry=false] - Return cache even if expired
 * @returns {Array|null} - Cached events or null
 */
export function getCachedEvents(ignoreExpiry = false) {
  try {
    const cached = localStorage.getItem(EVENTS_CONFIG.CACHE_KEY);
    const timestamp = localStorage.getItem(EVENTS_CONFIG.CACHE_TIMESTAMP_KEY);

    if (!cached || !timestamp) {
      return null;
    }

    const age = Date.now() - parseInt(timestamp, 10);
    if (!ignoreExpiry && age > EVENTS_CONFIG.CACHE_DURATION) {
      return null;
    }

    return JSON.parse(cached);
  } catch {
    return null;
  }
}

/**
 * Cache events data
 * @param {Array} events - Events to cache
 */
export function setCachedEvents(events) {
  try {
    localStorage.setItem(EVENTS_CONFIG.CACHE_KEY, JSON.stringify(events));
    localStorage.setItem(EVENTS_CONFIG.CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.warn('⚠️ Failed to cache events:', error.message);
  }
}

/**
 * Clear events cache
 */
export function clearEventsCache() {
  try {
    localStorage.removeItem(EVENTS_CONFIG.CACHE_KEY);
    localStorage.removeItem(EVENTS_CONFIG.CACHE_TIMESTAMP_KEY);
  } catch {
    // Ignore errors
  }
}
