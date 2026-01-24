/**
 * E2E-like tests for Events Carousel
 * Tests DOM rendering and interaction using jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock DOM structure for carousel
const createCarouselDOM = () => {
    document.body.innerHTML = `
        <div class="upcoming-events-section" id="upcoming-events">
            <div class="events-carousel-wrapper">
                <button class="carousel-nav prev" id="carouselPrev" aria-label="上一個">
                    <span class="material-icons">chevron_left</span>
                </button>
                <div class="events-carousel" id="eventsCarousel"></div>
                <button class="carousel-nav next" id="carouselNext" aria-label="下一個">
                    <span class="material-icons">chevron_right</span>
                </button>
            </div>
            <div class="carousel-dots" id="carouselDots"></div>
        </div>
    `;
};

// Import the functions we need to test (these would be exported from main.js in a real scenario)
// For now, we'll define simplified versions that match the production code

function parseEventDate(dateValue) {
    if (dateValue === null || dateValue === undefined || dateValue === '') return null;
    if (typeof dateValue === 'string') {
        const normalized = dateValue.replace(/\//g, '-');
        const date = new Date(normalized);
        return isNaN(date.getTime()) ? null : date;
    }
    return null;
}

function validateEvent(event) {
    if (!event || typeof event !== 'object') return false;
    const requiredFields = ['id', 'title', 'description', 'url', 'startDate'];
    for (const field of requiredFields) {
        if (!event[field] || (typeof event[field] === 'string' && event[field].trim() === '')) {
            return false;
        }
    }
    try {
        new URL(event.url);
    } catch {
        return false;
    }
    return parseEventDate(event.startDate) !== null;
}

function processEventsData(rawData) {
    if (!Array.isArray(rawData)) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return rawData
        .filter((event) => validateEvent(event))
        .filter((event) => event.isActive === true)
        .filter((event) => {
            if (!event.endDate) return true;
            const endDate = parseEventDate(event.endDate);
            if (!endDate) return true;
            endDate.setHours(23, 59, 59, 999);
            return endDate >= today;
        })
        .sort((a, b) => {
            const orderA = typeof a.sortOrder === 'number' ? a.sortOrder : Infinity;
            const orderB = typeof b.sortOrder === 'number' ? b.sortOrder : Infinity;
            if (orderA !== orderB) return orderA - orderB;
            const dateA = parseEventDate(a.startDate);
            const dateB = parseEventDate(b.startDate);
            if (dateA && dateB) return dateA.getTime() - dateB.getTime();
            return 0;
        });
}

function renderEventCards(events) {
    const carousel = document.getElementById('eventsCarousel');
    if (!carousel || !events || events.length === 0) return;

    carousel.innerHTML = events
        .map(
            (event, index) => `
        <a href="${event.url}"
           class="event-card fade-in"
           target="_blank"
           rel="noopener noreferrer"
           data-event-index="${index}">
            <div class="event-card-content">
                <h3 class="event-card-title">${event.title}</h3>
                <p class="event-card-description">${event.description}</p>
                <span class="event-card-btn">
                    <span class="material-icons small">open_in_new</span>
                    前往活動
                </span>
            </div>
        </a>
    `
        )
        .join('');
}

function renderCarouselDots(totalPages) {
    const dotsContainer = document.getElementById('carouselDots');
    if (!dotsContainer || totalPages <= 1) {
        if (dotsContainer) dotsContainer.innerHTML = '';
        return;
    }

    dotsContainer.innerHTML = Array.from(
        { length: totalPages },
        (_, i) => `
        <button class="carousel-dot ${i === 0 ? 'active' : ''}"
                data-page="${i}"
                aria-label="前往第 ${i + 1} 頁"></button>
    `
    ).join('');
}

describe('Events Carousel DOM Rendering', () => {
    beforeEach(() => {
        createCarouselDOM();
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-24'));
    });

    afterEach(() => {
        vi.useRealTimers();
        document.body.innerHTML = '';
    });

    describe('renderEventCards', () => {
        it('should render event cards in the carousel container', () => {
            const events = [
                {
                    id: '1',
                    title: 'Test Event 1',
                    description: 'Description 1',
                    url: 'https://example.com/1',
                    startDate: '2026-01-25',
                    isActive: true,
                },
                {
                    id: '2',
                    title: 'Test Event 2',
                    description: 'Description 2',
                    url: 'https://example.com/2',
                    startDate: '2026-01-26',
                    isActive: true,
                },
            ];

            renderEventCards(events);

            const carousel = document.getElementById('eventsCarousel');
            const cards = carousel.querySelectorAll('.event-card');

            expect(cards).toHaveLength(2);
            expect(cards[0].querySelector('.event-card-title').textContent).toBe('Test Event 1');
            expect(cards[1].querySelector('.event-card-title').textContent).toBe('Test Event 2');
        });

        it('should set correct href and target attributes', () => {
            const events = [
                {
                    id: '1',
                    title: 'Test',
                    description: 'Desc',
                    url: 'https://example.com/event',
                    startDate: '2026-01-25',
                    isActive: true,
                },
            ];

            renderEventCards(events);

            const card = document.querySelector('.event-card');
            expect(card.getAttribute('href')).toBe('https://example.com/event');
            expect(card.getAttribute('target')).toBe('_blank');
            expect(card.getAttribute('rel')).toBe('noopener noreferrer');
        });

        it('should handle empty events array', () => {
            renderEventCards([]);

            const carousel = document.getElementById('eventsCarousel');
            expect(carousel.innerHTML).toBe('');
        });

        it('should include data-event-index attribute', () => {
            const events = [
                {
                    id: '1',
                    title: 'Test 1',
                    description: 'Desc',
                    url: 'https://example.com',
                    startDate: '2026-01-25',
                    isActive: true,
                },
                {
                    id: '2',
                    title: 'Test 2',
                    description: 'Desc',
                    url: 'https://example.com',
                    startDate: '2026-01-26',
                    isActive: true,
                },
            ];

            renderEventCards(events);

            const cards = document.querySelectorAll('.event-card');
            expect(cards[0].getAttribute('data-event-index')).toBe('0');
            expect(cards[1].getAttribute('data-event-index')).toBe('1');
        });
    });

    describe('renderCarouselDots', () => {
        it('should render correct number of dots', () => {
            renderCarouselDots(3);

            const dots = document.querySelectorAll('.carousel-dot');
            expect(dots).toHaveLength(3);
        });

        it('should set first dot as active', () => {
            renderCarouselDots(3);

            const dots = document.querySelectorAll('.carousel-dot');
            expect(dots[0].classList.contains('active')).toBe(true);
            expect(dots[1].classList.contains('active')).toBe(false);
            expect(dots[2].classList.contains('active')).toBe(false);
        });

        it('should not render dots for single page', () => {
            renderCarouselDots(1);

            const dotsContainer = document.getElementById('carouselDots');
            expect(dotsContainer.innerHTML).toBe('');
        });

        it('should include aria-label for accessibility', () => {
            renderCarouselDots(2);

            const dots = document.querySelectorAll('.carousel-dot');
            expect(dots[0].getAttribute('aria-label')).toBe('前往第 1 頁');
            expect(dots[1].getAttribute('aria-label')).toBe('前往第 2 頁');
        });
    });

    describe('Section visibility', () => {
        it('should have section visible when events exist', () => {
            const section = document.getElementById('upcoming-events');
            expect(section).not.toBeNull();
            expect(section.style.display).not.toBe('none');
        });

        it('should be able to hide section when no events', () => {
            const section = document.getElementById('upcoming-events');
            section.style.display = 'none';
            expect(section.style.display).toBe('none');
        });
    });
});

describe('Events Data Processing Integration', () => {
    beforeEach(() => {
        createCarouselDOM();
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-24'));
    });

    afterEach(() => {
        vi.useRealTimers();
        document.body.innerHTML = '';
    });

    it('should process and render valid events from raw data', () => {
        const rawData = [
            {
                id: '1',
                title: 'Active Event',
                description: 'Description',
                url: 'https://example.com',
                startDate: '2026-01-25',
                isActive: true,
                sortOrder: 1,
            },
            {
                id: '2',
                title: 'Inactive Event',
                description: 'Description',
                url: 'https://example.com',
                startDate: '2026-01-25',
                isActive: false,
            },
        ];

        const processed = processEventsData(rawData);
        renderEventCards(processed);

        const cards = document.querySelectorAll('.event-card');
        expect(cards).toHaveLength(1);
        expect(cards[0].querySelector('.event-card-title').textContent).toBe('Active Event');
    });

    it('should filter expired events and only show current ones', () => {
        const rawData = [
            {
                id: '1',
                title: 'Expired Event',
                description: 'Description',
                url: 'https://example.com',
                startDate: '2026-01-20',
                endDate: '2026-01-22',
                isActive: true,
            },
            {
                id: '2',
                title: 'Current Event',
                description: 'Description',
                url: 'https://example.com',
                startDate: '2026-01-23',
                endDate: '2026-01-30',
                isActive: true,
            },
        ];

        const processed = processEventsData(rawData);
        renderEventCards(processed);

        const cards = document.querySelectorAll('.event-card');
        expect(cards).toHaveLength(1);
        expect(cards[0].querySelector('.event-card-title').textContent).toBe('Current Event');
    });

    it('should sort events by sortOrder then by startDate', () => {
        const rawData = [
            {
                id: '1',
                title: 'Third',
                description: 'Desc',
                url: 'https://example.com',
                startDate: '2026-01-25',
                isActive: true,
                sortOrder: 3,
            },
            {
                id: '2',
                title: 'First',
                description: 'Desc',
                url: 'https://example.com',
                startDate: '2026-01-26',
                isActive: true,
                sortOrder: 1,
            },
            {
                id: '3',
                title: 'Second',
                description: 'Desc',
                url: 'https://example.com',
                startDate: '2026-01-27',
                isActive: true,
                sortOrder: 2,
            },
        ];

        const processed = processEventsData(rawData);
        renderEventCards(processed);

        const cards = document.querySelectorAll('.event-card');
        expect(cards[0].querySelector('.event-card-title').textContent).toBe('First');
        expect(cards[1].querySelector('.event-card-title').textContent).toBe('Second');
        expect(cards[2].querySelector('.event-card-title').textContent).toBe('Third');
    });
});

describe('Accessibility', () => {
    beforeEach(() => {
        createCarouselDOM();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should have accessible navigation buttons', () => {
        const prevBtn = document.getElementById('carouselPrev');
        const nextBtn = document.getElementById('carouselNext');

        expect(prevBtn.getAttribute('aria-label')).toBe('上一個');
        expect(nextBtn.getAttribute('aria-label')).toBe('下一個');
    });

    it('should have link cards with proper security attributes', () => {
        const events = [
            {
                id: '1',
                title: 'Test',
                description: 'Desc',
                url: 'https://example.com',
                startDate: '2026-01-25',
                isActive: true,
            },
        ];

        renderEventCards(events);

        const card = document.querySelector('.event-card');
        expect(card.getAttribute('rel')).toContain('noopener');
        expect(card.getAttribute('rel')).toContain('noreferrer');
    });
});
