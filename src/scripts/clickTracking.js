/**
 * Activity CTA Click Tracking Service
 *
 * Tracks clicks on "開始學習" CTA buttons for:
 * - Active AI (數據世界：AI 原來如此)
 * - AI Square (我的半導體冒險)
 *
 * Uses GA4 events to enable conversion rate calculation:
 * Conversion Rate = activity_cta_click events / page views
 */

// ===== Constants =====

/**
 * Activity type identifiers
 */
export const ACTIVITY_TYPES = {
    ACTIVE_AI: 'active_ai',
    AI_SQUARE: 'ai_square',
    UNKNOWN: 'unknown',
};

/**
 * Activity metadata mapping
 */
const ACTIVITY_METADATA = {
    active_ai: {
        name: '數據世界：AI 原來如此',
        url: 'https://link.junyiacademy.org/8c2slp',
        shortCode: '8c2slp',
    },
    ai_square: {
        name: '我的半導體冒險',
        url: 'https://link.junyiacademy.org/8c2s2q',
        shortCode: '8c2s2q',
    },
    unknown: {
        name: '未知活動',
        url: '',
        shortCode: '',
    },
};

/**
 * GA4 Event name for click tracking
 */
export const GA4_EVENT_NAME = 'activity_cta_click';

// ===== Utility Functions =====

/**
 * Check if GA4 tracking is enabled (gtag is available)
 * @returns {boolean} True if tracking is enabled
 */
export function isTrackingEnabled() {
    return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/**
 * Get activity ID from a DOM element
 * Checks data-activity attribute first, then falls back to URL detection
 *
 * @param {HTMLElement|null} element - The element to extract activity ID from
 * @returns {string} Activity ID ('active_ai', 'ai_square', or 'unknown')
 */
export function getActivityIdFromElement(element) {
    if (!element) {
        return ACTIVITY_TYPES.UNKNOWN;
    }

    // Try to get from data-activity attribute on parent card
    const card = element.closest('.activity-card');
    if (card && card.dataset.activity) {
        // Map data-activity values to our constants
        const dataActivity = card.dataset.activity;
        if (dataActivity === 'data-world') {
            return ACTIVITY_TYPES.ACTIVE_AI;
        }
        if (dataActivity === 'semiconductor') {
            return ACTIVITY_TYPES.AI_SQUARE;
        }
    }

    // Fall back to URL detection from href
    const href = element.getAttribute('href') || '';

    if (href.includes(ACTIVITY_METADATA.active_ai.shortCode)) {
        return ACTIVITY_TYPES.ACTIVE_AI;
    }

    if (href.includes(ACTIVITY_METADATA.ai_square.shortCode)) {
        return ACTIVITY_TYPES.AI_SQUARE;
    }

    return ACTIVITY_TYPES.UNKNOWN;
}

/**
 * Create GA4 event payload for activity click
 *
 * @param {string} activityId - The activity identifier
 * @returns {Object} GA4 event payload
 */
export function createClickEventPayload(activityId) {
    const metadata = ACTIVITY_METADATA[activityId] || ACTIVITY_METADATA.unknown;

    return {
        event_category: 'activity_engagement',
        event_label: activityId,
        activity_name: metadata.name,
        link_url: metadata.url,
    };
}

// ===== Main Tracking Function =====

/**
 * Track an activity CTA click via GA4
 *
 * @param {string} activityId - The activity identifier ('active_ai' or 'ai_square')
 * @returns {boolean} True if tracking was successful
 */
export function trackActivityClick(activityId) {
    if (!isTrackingEnabled()) {
        console.log(`[Click Tracking] Click tracking disabled - gtag not available. Activity: ${activityId}`);
        return false;
    }

    const payload = createClickEventPayload(activityId);

    try {
        window.gtag('event', GA4_EVENT_NAME, payload);
        console.log(`[Click Tracking] Tracked: ${activityId}`, payload);
        return true;
    } catch (error) {
        console.error('[Click Tracking] Error tracking click:', error);
        return false;
    }
}

// ===== DOM Integration =====

/**
 * Initialize click tracking on all overlay-cta links
 * Call this function after DOM is ready
 */
export function initClickTracking() {
    const ctaLinks = document.querySelectorAll('.overlay-cta');

    ctaLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            const activityId = getActivityIdFromElement(link);
            trackActivityClick(activityId);
            // Don't prevent default - let the link navigate
        });
    });

    console.log(`[Click Tracking] Initialized tracking on ${ctaLinks.length} CTA links`);
}
