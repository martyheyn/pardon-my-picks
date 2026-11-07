import { describe, it, expect } from 'vitest';
import { daysSinceWeekStart, easternHour, getCurrentWeek, getWeekDates } from './nfl-week';

// kickoffs below are real games from the picks table, written in ET (-04:00 before the first
// Sunday of November, -05:00 after)
describe('getCurrentWeek', () => {
	it('puts the season opener in week 1', () => {
		expect(getCurrentWeek(2025, new Date('2025-09-04T20:20:00-04:00'))).toBe(1);
		expect(getCurrentWeek(2026, new Date('2026-09-10T20:20:00-04:00'))).toBe(1);
	});

	it('is the new week by the Friday picks get entered', () => {
		// the day week 9 picks went in under week 8 because the env var had not been bumped
		expect(getCurrentWeek(2026, new Date('2026-11-06T10:57:00-05:00'))).toBe(9);
	});

	it('keeps a week together from Thursday through Monday night', () => {
		// Thanksgiving Thursday through the next Monday
		expect(getCurrentWeek(2024, new Date('2024-11-28T12:30:00-05:00'))).toBe(13);
		expect(getCurrentWeek(2024, new Date('2024-12-02T20:15:00-05:00'))).toBe(13);
		// a 10pm Monday night doubleheader game, and the small hours after it
		expect(getCurrentWeek(2025, new Date('2025-09-15T22:00:00-04:00'))).toBe(2);
		expect(getCurrentWeek(2025, new Date('2025-09-16T01:30:00-04:00'))).toBe(2);
	});

	it('counts Wednesday and Saturday games in the week they are played', () => {
		expect(getCurrentWeek(2024, new Date('2024-12-25T13:00:00-05:00'))).toBe(17);
		expect(getCurrentWeek(2025, new Date('2025-12-20T17:00:00-05:00'))).toBe(16);
	});

	it('rolls over at midnight ET Tuesday night', () => {
		expect(getCurrentWeek(2026, new Date('2026-11-10T23:59:59-05:00'))).toBe(9);
		expect(getCurrentWeek(2026, new Date('2026-11-11T00:00:00-05:00'))).toBe(10);
	});

	it('uses the date in New York, not where the server is', () => {
		// 03:00 UTC Wednesday is still 10pm Tuesday in New York
		expect(getCurrentWeek(2026, new Date('2026-11-11T03:00:00Z'))).toBe(9);
	});

	it('is not thrown off by the clocks going back', () => {
		// DST ended at 2am on Sunday 2026-11-01, mid week 8
		expect(getCurrentWeek(2026, new Date('2026-11-01T20:20:00-05:00'))).toBe(8);
		expect(getCurrentWeek(2026, new Date('2026-11-03T23:59:00-05:00'))).toBe(8);
	});

	it('carries the season into the playoffs in January', () => {
		expect(getCurrentWeek(2025, new Date('2026-01-04T20:20:00-05:00'))).toBe(18);
		expect(getCurrentWeek(2025, new Date('2026-01-17T16:30:00-05:00'))).toBe(20);
		expect(getCurrentWeek(2025, new Date('2026-01-25T18:00:00-05:00'))).toBe(21);
	});

	it('sits on week 1 before the season starts', () => {
		expect(getCurrentWeek(2026, new Date('2026-08-01T12:00:00-04:00'))).toBe(1);
		// Tuesday after Labor Day, the day before week 1 starts
		expect(getCurrentWeek(2026, new Date('2026-09-08T23:59:00-04:00'))).toBe(1);
	});

	it('stays on week 21 after the conference championships', () => {
		// Super Bowl Sunday, then the middle of the offseason
		expect(getCurrentWeek(2025, new Date('2026-02-08T18:30:00-05:00'))).toBe(21);
		expect(getCurrentWeek(2025, new Date('2026-06-01T12:00:00-04:00'))).toBe(21);
	});
});

describe('getWeekDates', () => {
	it('runs from a Wednesday to the next one', () => {
		expect(getWeekDates(2026, 9)).toEqual({ start: '2026-11-04', end: '2026-11-11' });
	});

	it('starts week 1 the Wednesday after Labor Day', () => {
		// Labor Day 2026 is Sept 7
		expect(getWeekDates(2026, 1)).toEqual({ start: '2026-09-09', end: '2026-09-16' });
		// Labor Day 2025 fell on Sept 1, the earliest it can be
		expect(getWeekDates(2025, 1)).toEqual({ start: '2025-09-03', end: '2025-09-10' });
	});

	it('crosses into the new year for week 18', () => {
		expect(getWeekDates(2024, 18)).toEqual({ start: '2025-01-01', end: '2025-01-08' });
	});
});

describe('daysSinceWeekStart', () => {
	it('is 0 on the Wednesday a week starts and 6 on its Tuesday', () => {
		// week 9 of 2026 runs Wed Nov 4 to Tue Nov 10
		expect(daysSinceWeekStart(2026, 9, new Date('2026-11-04T00:00:00-05:00'))).toBe(0);
		expect(daysSinceWeekStart(2026, 9, new Date('2026-11-10T00:30:00-05:00'))).toBe(6);
		expect(daysSinceWeekStart(2026, 9, new Date('2026-11-10T23:59:00-05:00'))).toBe(6);
	});

	it('keeps counting into the next week, and is negative before the week starts', () => {
		expect(daysSinceWeekStart(2026, 9, new Date('2026-11-13T12:00:00-05:00'))).toBe(9);
		expect(daysSinceWeekStart(2026, 9, new Date('2026-11-03T12:00:00-05:00'))).toBe(-1);
	});

	it('uses the date in New York', () => {
		// 03:00 UTC Wednesday is still 10pm Tuesday in New York
		expect(daysSinceWeekStart(2026, 9, new Date('2026-11-11T03:00:00Z'))).toBe(6);
	});

	it('is not thrown off by the clocks going back', () => {
		// week 8 of 2026 starts Wed Oct 28; DST ended Sunday Nov 1
		expect(daysSinceWeekStart(2026, 8, new Date('2026-11-03T23:00:00-05:00'))).toBe(6);
	});

	it('counts past week 21, where getCurrentWeek stops', () => {
		// the Tuesday after the 2025 conference championships (week 21 starts Wed Jan 21)
		expect(daysSinceWeekStart(2025, 21, new Date('2026-01-27T10:00:00-05:00'))).toBe(6);
		expect(daysSinceWeekStart(2025, 21, new Date('2026-02-04T10:00:00-05:00'))).toBe(14);
	});
});

describe('easternHour', () => {
	it('reads the hour on a New York clock', () => {
		expect(easternHour(new Date('2026-11-10T01:30:00-05:00'))).toBe(1);
		expect(easternHour(new Date('2026-11-10T13:00:00Z'))).toBe(8);
		expect(easternHour(new Date('2026-07-01T04:00:00Z'))).toBe(0);
	});
});
