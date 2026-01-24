/**
 * Unit tests for Upcoming Events Service
 * TDD approach: Write tests first, then implement
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    validateEvent,
    validateEvents,
    filterActiveEvents,
    filterByDateRange,
    sortEvents,
    processEventsData,
    parseSheetDate,
} from '../../src/scripts/eventsService.js';

describe('Event Data Validation', () => {
    describe('validateEvent', () => {
        it('should return true for valid event with all required fields', () => {
            const event = {
                id: '1',
                title: 'AI 素養起步走｜學生體驗場',
                description: '由均一老師帶領體驗 AI',
                url: 'https://example.com',
                startDate: '2026-01-22',
                isActive: true,
            };
            expect(validateEvent(event)).toBe(true);
        });

        it('should return false when id is missing', () => {
            const event = {
                title: 'Test Event',
                description: 'Description',
                url: 'https://example.com',
                startDate: '2026-01-22',
                isActive: true,
            };
            expect(validateEvent(event)).toBe(false);
        });

        it('should return false when title is missing', () => {
            const event = {
                id: '1',
                description: 'Description',
                url: 'https://example.com',
                startDate: '2026-01-22',
                isActive: true,
            };
            expect(validateEvent(event)).toBe(false);
        });

        it('should return false when url is invalid', () => {
            const event = {
                id: '1',
                title: 'Test Event',
                description: 'Description',
                url: 'not-a-url',
                startDate: '2026-01-22',
                isActive: true,
            };
            expect(validateEvent(event)).toBe(false);
        });

        it('should return false when startDate is invalid', () => {
            const event = {
                id: '1',
                title: 'Test Event',
                description: 'Description',
                url: 'https://example.com',
                startDate: 'invalid-date',
                isActive: true,
            };
            expect(validateEvent(event)).toBe(false);
        });

        it('should handle empty string fields as invalid', () => {
            const event = {
                id: '',
                title: 'Test Event',
                description: 'Description',
                url: 'https://example.com',
                startDate: '2026-01-22',
                isActive: true,
            };
            expect(validateEvent(event)).toBe(false);
        });
    });

    describe('validateEvents', () => {
        it('should filter out invalid events from array', () => {
            const events = [
                {
                    id: '1',
                    title: 'Valid Event',
                    description: 'Desc',
                    url: 'https://example.com',
                    startDate: '2026-01-22',
                    isActive: true,
                },
                { id: '2', title: 'Missing URL', description: 'Desc', startDate: '2026-01-22', isActive: true },
                {
                    id: '3',
                    title: 'Another Valid',
                    description: 'Desc',
                    url: 'https://example.com',
                    startDate: '2026-01-23',
                    isActive: true,
                },
            ];
            const result = validateEvents(events);
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('1');
            expect(result[1].id).toBe('3');
        });

        it('should return empty array for null input', () => {
            expect(validateEvents(null)).toEqual([]);
        });

        it('should return empty array for non-array input', () => {
            expect(validateEvents('string')).toEqual([]);
            expect(validateEvents(123)).toEqual([]);
            expect(validateEvents({})).toEqual([]);
        });
    });
});

describe('Event Filtering', () => {
    describe('filterActiveEvents', () => {
        it('should only return events with isActive=true', () => {
            const events = [
                { id: '1', title: 'Active', isActive: true },
                { id: '2', title: 'Inactive', isActive: false },
                { id: '3', title: 'Also Active', isActive: true },
            ];
            const result = filterActiveEvents(events);
            expect(result).toHaveLength(2);
            expect(result.every((e) => e.isActive)).toBe(true);
        });

        it('should treat missing isActive as false', () => {
            const events = [{ id: '1', title: 'No isActive field' }, { id: '2', title: 'Active', isActive: true }];
            const result = filterActiveEvents(events);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('2');
        });
    });

    describe('filterByDateRange', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-01-24'));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should filter out events with endDate in the past', () => {
            const events = [
                { id: '1', title: 'Past Event', startDate: '2026-01-20', endDate: '2026-01-22' },
                { id: '2', title: 'Current Event', startDate: '2026-01-23', endDate: '2026-01-30' },
                { id: '3', title: 'Future Event', startDate: '2026-01-25', endDate: '2026-02-01' },
            ];
            const result = filterByDateRange(events);
            expect(result).toHaveLength(2);
            expect(result.find((e) => e.id === '1')).toBeUndefined();
        });

        it('should keep events without endDate (ongoing)', () => {
            const events = [
                { id: '1', title: 'No End Date', startDate: '2026-01-20' },
                { id: '2', title: 'Has End Date', startDate: '2026-01-20', endDate: '2026-01-30' },
            ];
            const result = filterByDateRange(events);
            expect(result).toHaveLength(2);
        });

        it('should include events ending today', () => {
            const events = [{ id: '1', title: 'Ends Today', startDate: '2026-01-20', endDate: '2026-01-24' }];
            const result = filterByDateRange(events);
            expect(result).toHaveLength(1);
        });
    });
});

describe('Event Sorting', () => {
    describe('sortEvents', () => {
        it('should sort by sortOrder ascending', () => {
            const events = [
                { id: '1', title: 'Third', sortOrder: 3 },
                { id: '2', title: 'First', sortOrder: 1 },
                { id: '3', title: 'Second', sortOrder: 2 },
            ];
            const result = sortEvents(events);
            expect(result[0].sortOrder).toBe(1);
            expect(result[1].sortOrder).toBe(2);
            expect(result[2].sortOrder).toBe(3);
        });

        it('should put events without sortOrder at the end', () => {
            const events = [
                { id: '1', title: 'No Order' },
                { id: '2', title: 'Has Order', sortOrder: 1 },
                { id: '3', title: 'Also No Order' },
            ];
            const result = sortEvents(events);
            expect(result[0].id).toBe('2');
        });

        it('should sort by startDate for same sortOrder', () => {
            const events = [
                { id: '1', title: 'Later', sortOrder: 1, startDate: '2026-01-25' },
                { id: '2', title: 'Earlier', sortOrder: 1, startDate: '2026-01-22' },
            ];
            const result = sortEvents(events);
            expect(result[0].id).toBe('2');
        });

        it('should not mutate original array', () => {
            const events = [
                { id: '1', sortOrder: 2 },
                { id: '2', sortOrder: 1 },
            ];
            const original = [...events];
            sortEvents(events);
            expect(events[0].id).toBe(original[0].id);
        });
    });
});

describe('Date Parsing', () => {
    describe('parseSheetDate', () => {
        it('should parse YYYY-MM-DD format', () => {
            const date = parseSheetDate('2026-01-22');
            expect(date.getFullYear()).toBe(2026);
            expect(date.getMonth()).toBe(0); // January
            expect(date.getDate()).toBe(22);
        });

        it('should parse YYYY/MM/DD format', () => {
            const date = parseSheetDate('2026/01/22');
            expect(date.getFullYear()).toBe(2026);
            expect(date.getMonth()).toBe(0);
            expect(date.getDate()).toBe(22);
        });

        it('should handle Google Sheets serial date number', () => {
            // 44583 is approximately 2022-01-22 in Google Sheets serial
            const date = parseSheetDate(44583);
            expect(date instanceof Date).toBe(true);
            expect(isNaN(date.getTime())).toBe(false);
        });

        it('should return null for invalid date', () => {
            expect(parseSheetDate('invalid')).toBeNull();
            expect(parseSheetDate('')).toBeNull();
            expect(parseSheetDate(null)).toBeNull();
        });
    });
});

describe('Full Processing Pipeline', () => {
    describe('processEventsData', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-01-24'));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should process raw sheet data through full pipeline', () => {
            const rawData = [
                {
                    id: '1',
                    title: 'Active Current',
                    description: 'Desc',
                    url: 'https://example.com',
                    startDate: '2026-01-22',
                    endDate: '2026-01-30',
                    isActive: true,
                    sortOrder: 2,
                },
                {
                    id: '2',
                    title: 'Inactive',
                    description: 'Desc',
                    url: 'https://example.com',
                    startDate: '2026-01-22',
                    isActive: false,
                    sortOrder: 1,
                },
                {
                    id: '3',
                    title: 'Expired',
                    description: 'Desc',
                    url: 'https://example.com',
                    startDate: '2026-01-20',
                    endDate: '2026-01-21',
                    isActive: true,
                    sortOrder: 1,
                },
                {
                    id: '4',
                    title: 'Active Future',
                    description: 'Desc',
                    url: 'https://example.com',
                    startDate: '2026-01-25',
                    isActive: true,
                    sortOrder: 1,
                },
            ];

            const result = processEventsData(rawData);

            // Should only have 2 events (active + not expired)
            expect(result).toHaveLength(2);

            // Should be sorted by sortOrder
            expect(result[0].id).toBe('4'); // sortOrder 1
            expect(result[1].id).toBe('1'); // sortOrder 2

            // Should not include inactive or expired
            expect(result.find((e) => e.id === '2')).toBeUndefined();
            expect(result.find((e) => e.id === '3')).toBeUndefined();
        });

        it('should return empty array when no valid events', () => {
            const rawData = [{ id: '1', title: 'Invalid - no URL', isActive: true }];
            const result = processEventsData(rawData);
            expect(result).toEqual([]);
        });

        it('should handle empty input', () => {
            expect(processEventsData([])).toEqual([]);
            expect(processEventsData(null)).toEqual([]);
        });
    });
});
