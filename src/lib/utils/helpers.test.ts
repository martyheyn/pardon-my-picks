import { describe, it, expect } from 'vitest';
import { hasGameStarted, normalizePickType, planPickSave } from './helpers';

describe('hasGameStarted', () => {
	const kickoff = new Date('2026-10-26T00:20:00Z');

	it('returns false before kickoff', () => {
		expect(hasGameStarted(kickoff, new Date('2026-10-26T00:19:59Z'))).toBe(false);
	});

	it('returns true at kickoff', () => {
		expect(hasGameStarted(kickoff, new Date('2026-10-26T00:20:00Z'))).toBe(true);
	});

	it('returns true after kickoff', () => {
		expect(hasGameStarted(kickoff, new Date('2026-10-26T03:00:00Z'))).toBe(true);
	});

	it('accepts an ISO string, the shape gameDate has after JSON serialization', () => {
		expect(hasGameStarted('2026-10-26T00:20:00.000Z', new Date('2026-10-26T00:21:00Z'))).toBe(true);
		expect(hasGameStarted('2026-10-26T00:20:00.000Z', new Date('2026-10-26T00:19:00Z'))).toBe(
			false
		);
	});

	it('compares real instants, not wall-clock times', () => {
		// 8:21 PM ET is one minute after an 8:20 PM ET (00:20Z) kickoff - dropping the -04:00
		// offset would turn it into 20:21Z and make the game look hours away
		expect(hasGameStarted(kickoff, new Date('2026-10-25T20:21:00-04:00'))).toBe(true);
	});
});

describe('normalizePickType', () => {
	it('treats the form label and the saved label for spreads as the same type', () => {
		expect(normalizePickType('spread')).toBe('spreads');
		expect(normalizePickType('spreads')).toBe('spreads');
	});

	it('keeps totals as totals', () => {
		expect(normalizePickType('totals')).toBe('totals');
	});

	it('returns null for anything else', () => {
		expect(normalizePickType('moneyline')).toBeNull();
	});
});

describe('planPickSave', () => {
	// Friday of a week with a Thursday night game that has already been played
	const now = new Date('2026-10-23T16:00:00Z');
	const thursdayNight = new Date('2026-10-23T00:15:00Z');
	const sundayLate = new Date('2026-10-25T20:25:00Z');

	it('creates both picks on a first save', () => {
		const plan = planPickSave(
			[],
			[
				{ id: 'a', type: 'spread' },
				{ id: 'b', type: 'totals' }
			],
			now
		);

		expect(plan).toEqual({
			ok: true,
			deleteIds: [],
			newPicks: [
				{ id: 'a', type: 'spread' },
				{ id: 'b', type: 'totals' }
			]
		});
	});

	it('leaves picks alone when the same 2 saved picks are resubmitted', () => {
		const plan = planPickSave(
			[
				{ id: 'a', type: 'spreads', gameDate: sundayLate },
				{ id: 'b', type: 'totals', gameDate: sundayLate }
			],
			[
				{ id: 'a', type: 'spreads' },
				{ id: 'b', type: 'totals' }
			],
			now
		);

		expect(plan).toEqual({ ok: true, deleteIds: [], newPicks: [] });
	});

	it('lets the user swap their unstarted pick while the started one stays put', () => {
		const plan = planPickSave(
			[
				{ id: 'thursday', type: 'spreads', gameDate: thursdayNight },
				{ id: 'sunday', type: 'totals', gameDate: sundayLate }
			],
			[
				{ id: 'thursday', type: 'spreads' },
				{ id: 'replacement', type: 'totals' }
			],
			now
		);

		expect(plan).toEqual({
			ok: true,
			deleteIds: ['sunday'],
			newPicks: [{ id: 'replacement', type: 'totals' }]
		});
	});

	it('refuses to drop a pick whose game has started', () => {
		const plan = planPickSave(
			[
				{ id: 'thursday', type: 'spreads', gameDate: thursdayNight },
				{ id: 'sunday', type: 'totals', gameDate: sundayLate }
			],
			[
				{ id: 'replacement', type: 'spread' },
				{ id: 'sunday', type: 'totals' }
			],
			now
		);

		expect(plan.ok).toBe(false);
	});

	it('allows dropping a saved pick that has no game date', () => {
		const plan = planPickSave(
			[{ id: 'old', type: 'totals', gameDate: null }],
			[
				{ id: 'a', type: 'spread' },
				{ id: 'b', type: 'totals' }
			],
			now
		);

		expect(plan).toMatchObject({ ok: true, deleteIds: ['old'] });
	});

	it('requires exactly 2 distinct picks', () => {
		expect(planPickSave([], [{ id: 'a', type: 'spread' }], now).ok).toBe(false);
		expect(
			planPickSave(
				[],
				[
					{ id: 'a', type: 'spread' },
					{ id: 'a', type: 'totals' }
				],
				now
			).ok
		).toBe(false);
	});

	it('rejects two picks of the same type', () => {
		const plan = planPickSave(
			[],
			[
				{ id: 'a', type: 'totals' },
				{ id: 'b', type: 'totals' }
			],
			now
		);

		expect(plan.ok).toBe(false);
	});

	it('counts a saved spread and a new spread as the same type', () => {
		const plan = planPickSave(
			[{ id: 'saved', type: 'spreads', gameDate: thursdayNight }],
			[
				{ id: 'saved', type: 'spreads' },
				{ id: 'new', type: 'spread' }
			],
			now
		);

		expect(plan.ok).toBe(false);
	});

	it('uses the saved type for a kept pick, not whatever the request says', () => {
		const plan = planPickSave(
			[{ id: 'saved', type: 'spreads', gameDate: thursdayNight }],
			[
				{ id: 'saved', type: 'totals' },
				{ id: 'new', type: 'spread' }
			],
			now
		);

		expect(plan.ok).toBe(false);
	});
});
