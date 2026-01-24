/**
 * Integration tests for Events API
 * Tests the fetch, caching, and error handling behavior
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    fetchEvents,
    getEventsApiUrl,
    getCachedEvents,
    setCachedEvents,
    clearEventsCache,
    EVENTS_CONFIG,
} from '../../src/scripts/eventsService.js';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('Events API URL Configuration', () => {
    describe('getEventsApiUrl', () => {
        it('should return DEMO_MODE when config is null', () => {
            expect(getEventsApiUrl(null)).toBe('DEMO_MODE');
        });

        it('should return DEMO_MODE when IS_DEMO_MODE returns true', () => {
            const config = {
                IS_DEMO_MODE: () => true,
                FORM_SUBMIT_URL: 'https://script.google.com/exec',
            };
            expect(getEventsApiUrl(config)).toBe('DEMO_MODE');
        });

        it('should return WORDPRESS_CONFIG_NEEDED when config invalid', () => {
            const config = {
                IS_DEMO_MODE: () => false,
                isWordPressConfigValid: () => false,
            };
            expect(getEventsApiUrl(config)).toBe('WORDPRESS_CONFIG_NEEDED');
        });

        it('should return correct API URL with action parameter', () => {
            const config = {
                IS_DEMO_MODE: () => false,
                isWordPressConfigValid: () => true,
                FORM_SUBMIT_URL: 'https://script.google.com/macros/s/xxx/exec',
            };
            const url = getEventsApiUrl(config);
            expect(url).toBe('https://script.google.com/macros/s/xxx/exec?action=getUpcomingEvents');
        });
    });
});

describe('Events Caching', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    describe('setCachedEvents', () => {
        it('should store events in localStorage', () => {
            const events = [{ id: '1', title: 'Test' }];
            setCachedEvents(events);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(EVENTS_CONFIG.CACHE_KEY, JSON.stringify(events));
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                EVENTS_CONFIG.CACHE_TIMESTAMP_KEY,
                expect.any(String)
            );
        });
    });

    describe('getCachedEvents', () => {
        it('should return null when cache is empty', () => {
            expect(getCachedEvents()).toBeNull();
        });

        it('should return cached events when valid', () => {
            const events = [{ id: '1', title: 'Test' }];
            localStorageMock.setItem(EVENTS_CONFIG.CACHE_KEY, JSON.stringify(events));
            localStorageMock.setItem(EVENTS_CONFIG.CACHE_TIMESTAMP_KEY, Date.now().toString());

            // Reset the mock to return the stored values
            localStorageMock.getItem.mockImplementation((key) => {
                if (key === EVENTS_CONFIG.CACHE_KEY) return JSON.stringify(events);
                if (key === EVENTS_CONFIG.CACHE_TIMESTAMP_KEY) return Date.now().toString();
                return null;
            });

            const result = getCachedEvents();
            expect(result).toEqual(events);
        });

        it('should return null when cache is expired', () => {
            const events = [{ id: '1', title: 'Test' }];
            const oldTimestamp = Date.now() - EVENTS_CONFIG.CACHE_DURATION - 1000;

            localStorageMock.getItem.mockImplementation((key) => {
                if (key === EVENTS_CONFIG.CACHE_KEY) return JSON.stringify(events);
                if (key === EVENTS_CONFIG.CACHE_TIMESTAMP_KEY) return oldTimestamp.toString();
                return null;
            });

            const result = getCachedEvents();
            expect(result).toBeNull();
        });

        it('should return expired cache when ignoreExpiry is true', () => {
            const events = [{ id: '1', title: 'Test' }];
            const oldTimestamp = Date.now() - EVENTS_CONFIG.CACHE_DURATION - 1000;

            localStorageMock.getItem.mockImplementation((key) => {
                if (key === EVENTS_CONFIG.CACHE_KEY) return JSON.stringify(events);
                if (key === EVENTS_CONFIG.CACHE_TIMESTAMP_KEY) return oldTimestamp.toString();
                return null;
            });

            const result = getCachedEvents(true);
            expect(result).toEqual(events);
        });
    });

    describe('clearEventsCache', () => {
        it('should remove cache items from localStorage', () => {
            clearEventsCache();
            expect(localStorageMock.removeItem).toHaveBeenCalledWith(EVENTS_CONFIG.CACHE_KEY);
            expect(localStorageMock.removeItem).toHaveBeenCalledWith(EVENTS_CONFIG.CACHE_TIMESTAMP_KEY);
        });
    });
});

describe('Events Fetching', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchEvents', () => {
        it('should return fallback data for DEMO_MODE', async () => {
            const result = await fetchEvents('DEMO_MODE');
            expect(result.length).toBeGreaterThan(0);
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('should return fallback data for WORDPRESS_CONFIG_NEEDED', async () => {
            const result = await fetchEvents('WORDPRESS_CONFIG_NEEDED');
            expect(result.length).toBeGreaterThan(0);
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('should fetch from API and process data', async () => {
            const apiResponse = {
                events: [
                    {
                        id: '1',
                        title: 'API Event',
                        description: 'From API',
                        url: 'https://example.com',
                        startDate: '2026-01-25',
                        isActive: true,
                        sortOrder: 1,
                    },
                ],
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(apiResponse),
            });

            // Mock localStorage to return null (no cache)
            localStorageMock.getItem.mockReturnValue(null);

            const result = await fetchEvents('https://api.example.com/events', true);

            expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/events', expect.any(Object));
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('API Event');
        });

        it('should return cached data when available', async () => {
            const cachedEvents = [{ id: '1', title: 'Cached Event' }];

            localStorageMock.getItem.mockImplementation((key) => {
                if (key === EVENTS_CONFIG.CACHE_KEY) return JSON.stringify(cachedEvents);
                if (key === EVENTS_CONFIG.CACHE_TIMESTAMP_KEY) return Date.now().toString();
                return null;
            });

            const result = await fetchEvents('https://api.example.com/events');

            expect(global.fetch).not.toHaveBeenCalled();
            expect(result).toEqual(cachedEvents);
        });

        it('should fetch fresh data when forceRefresh is true', async () => {
            const cachedEvents = [{ id: '1', title: 'Cached Event' }];
            const freshEvents = {
                events: [
                    {
                        id: '2',
                        title: 'Fresh Event',
                        description: 'Fresh',
                        url: 'https://example.com',
                        startDate: '2026-01-25',
                        isActive: true,
                    },
                ],
            };

            localStorageMock.getItem.mockImplementation((key) => {
                if (key === EVENTS_CONFIG.CACHE_KEY) return JSON.stringify(cachedEvents);
                if (key === EVENTS_CONFIG.CACHE_TIMESTAMP_KEY) return Date.now().toString();
                return null;
            });

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(freshEvents),
            });

            const result = await fetchEvents('https://api.example.com/events', true);

            expect(global.fetch).toHaveBeenCalled();
            expect(result[0].title).toBe('Fresh Event');
        });

        it('should return fallback on fetch error', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));
            localStorageMock.getItem.mockReturnValue(null);

            const result = await fetchEvents('https://api.example.com/events', true);

            expect(result.length).toBeGreaterThan(0);
            // Should be fallback data
            expect(result[0].id).toContain('fallback');
        });

        it('should return stale cache on fetch error if available', async () => {
            const staleEvents = [{ id: 'stale', title: 'Stale Event' }];
            const oldTimestamp = Date.now() - EVENTS_CONFIG.CACHE_DURATION - 1000;

            // First call returns null (expired), second call with ignoreExpiry returns stale
            let callCount = 0;
            localStorageMock.getItem.mockImplementation((key) => {
                if (key === EVENTS_CONFIG.CACHE_KEY) return JSON.stringify(staleEvents);
                if (key === EVENTS_CONFIG.CACHE_TIMESTAMP_KEY) return oldTimestamp.toString();
                return null;
            });

            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await fetchEvents('https://api.example.com/events', true);

            // Should return stale cache
            expect(result).toEqual(staleEvents);
        });
    });
});
