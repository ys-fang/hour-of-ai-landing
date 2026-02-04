/**
 * Unit tests for Activity CTA Click Tracking Service
 * TDD approach: Write tests first, then implement
 *
 * Feature: Track clicks on "開始學習" CTA buttons for Active AI and AI Square activities
 * Goal: Calculate conversion rate = CTA clicks / GA4 page views
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    trackActivityClick,
    getActivityIdFromElement,
    isTrackingEnabled,
    ACTIVITY_TYPES,
    createClickEventPayload,
} from '../../src/scripts/clickTracking.js';

describe('Click Tracking Service', () => {

    describe('ACTIVITY_TYPES constants', () => {
        it('should define Active AI activity type', () => {
            expect(ACTIVITY_TYPES.ACTIVE_AI).toBe('active_ai');
        });

        it('should define AI Square activity type', () => {
            expect(ACTIVITY_TYPES.AI_SQUARE).toBe('ai_square');
        });
    });

    describe('getActivityIdFromElement', () => {
        beforeEach(() => {
            document.body.innerHTML = '';
        });

        it('should return normalized activity id from data-activity attribute on card', () => {
            document.body.innerHTML = `
                <div class="activity-card" data-activity="data-world">
                    <a href="#" class="overlay-cta">開始學習</a>
                </div>
            `;
            const link = document.querySelector('.overlay-cta');
            // data-world maps to active_ai for consistent identification
            expect(getActivityIdFromElement(link)).toBe('active_ai');
        });

        it('should return activity id from link href containing 8c2slp (Active AI)', () => {
            document.body.innerHTML = `
                <div class="activity-card">
                    <a href="https://link.junyiacademy.org/8c2slp" class="overlay-cta">開始學習</a>
                </div>
            `;
            const link = document.querySelector('.overlay-cta');
            expect(getActivityIdFromElement(link)).toBe('active_ai');
        });

        it('should return activity id from link href containing 8c2s2q (AI Square)', () => {
            document.body.innerHTML = `
                <div class="activity-card">
                    <a href="https://link.junyiacademy.org/8c2s2q" class="overlay-cta">開始學習</a>
                </div>
            `;
            const link = document.querySelector('.overlay-cta');
            expect(getActivityIdFromElement(link)).toBe('ai_square');
        });

        it('should return "unknown" for unrecognized links', () => {
            document.body.innerHTML = `
                <div class="activity-card">
                    <a href="https://example.com/other" class="overlay-cta">開始學習</a>
                </div>
            `;
            const link = document.querySelector('.overlay-cta');
            expect(getActivityIdFromElement(link)).toBe('unknown');
        });

        it('should return "unknown" when element is null', () => {
            expect(getActivityIdFromElement(null)).toBe('unknown');
        });
    });

    describe('isTrackingEnabled', () => {
        let originalGtag;

        beforeEach(() => {
            originalGtag = window.gtag;
        });

        afterEach(() => {
            window.gtag = originalGtag;
        });

        it('should return true when gtag is defined', () => {
            window.gtag = vi.fn();
            expect(isTrackingEnabled()).toBe(true);
        });

        it('should return false when gtag is undefined', () => {
            window.gtag = undefined;
            expect(isTrackingEnabled()).toBe(false);
        });
    });

    describe('createClickEventPayload', () => {
        it('should create payload with correct structure for Active AI', () => {
            const payload = createClickEventPayload('active_ai');

            expect(payload).toEqual({
                event_category: 'activity_engagement',
                event_label: 'active_ai',
                activity_name: '數據世界：AI 原來如此',
                link_url: 'https://link.junyiacademy.org/8c2slp',
            });
        });

        it('should create payload with correct structure for AI Square', () => {
            const payload = createClickEventPayload('ai_square');

            expect(payload).toEqual({
                event_category: 'activity_engagement',
                event_label: 'ai_square',
                activity_name: '我的半導體冒險',
                link_url: 'https://link.junyiacademy.org/8c2s2q',
            });
        });

        it('should handle unknown activity type gracefully', () => {
            const payload = createClickEventPayload('unknown');

            expect(payload.event_category).toBe('activity_engagement');
            expect(payload.event_label).toBe('unknown');
            expect(payload.activity_name).toBe('未知活動');
        });
    });

    describe('trackActivityClick', () => {
        let gtagMock;

        beforeEach(() => {
            gtagMock = vi.fn();
            window.gtag = gtagMock;
        });

        afterEach(() => {
            window.gtag = undefined;
        });

        it('should call gtag with correct event name and payload for Active AI', () => {
            trackActivityClick('active_ai');

            expect(gtagMock).toHaveBeenCalledTimes(1);
            expect(gtagMock).toHaveBeenCalledWith('event', 'activity_cta_click', {
                event_category: 'activity_engagement',
                event_label: 'active_ai',
                activity_name: '數據世界：AI 原來如此',
                link_url: 'https://link.junyiacademy.org/8c2slp',
            });
        });

        it('should call gtag with correct event name and payload for AI Square', () => {
            trackActivityClick('ai_square');

            expect(gtagMock).toHaveBeenCalledTimes(1);
            expect(gtagMock).toHaveBeenCalledWith('event', 'activity_cta_click', {
                event_category: 'activity_engagement',
                event_label: 'ai_square',
                activity_name: '我的半導體冒險',
                link_url: 'https://link.junyiacademy.org/8c2s2q',
            });
        });

        it('should not throw when gtag is undefined', () => {
            window.gtag = undefined;

            expect(() => trackActivityClick('active_ai')).not.toThrow();
        });

        it('should return true when tracking succeeds', () => {
            const result = trackActivityClick('active_ai');
            expect(result).toBe(true);
        });

        it('should return false when gtag is undefined', () => {
            window.gtag = undefined;
            const result = trackActivityClick('active_ai');
            expect(result).toBe(false);
        });

        it('should log to console when tracking is disabled', () => {
            window.gtag = undefined;
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            trackActivityClick('active_ai');

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Click tracking disabled')
            );
            consoleSpy.mockRestore();
        });
    });
});

describe('Click Tracking Integration', () => {
    let gtagMock;

    beforeEach(() => {
        gtagMock = vi.fn();
        window.gtag = gtagMock;
        document.body.innerHTML = '';
    });

    afterEach(() => {
        window.gtag = undefined;
    });

    it('should track click when overlay-cta link is clicked', () => {
        document.body.innerHTML = `
            <div class="activity-card" data-activity="data-world">
                <a href="https://link.junyiacademy.org/8c2slp" class="overlay-cta">
                    <span>開始學習</span>
                </a>
            </div>
        `;

        const link = document.querySelector('.overlay-cta');
        const activityId = getActivityIdFromElement(link);
        trackActivityClick(activityId);

        expect(gtagMock).toHaveBeenCalledWith('event', 'activity_cta_click', expect.objectContaining({
            event_label: 'active_ai',
        }));
    });
});
