import { describe, it, expect } from 'vitest';
import { espnEventToOdds, espnWeekDateRange, type EspnEvent } from './espn';

type EspnOdds = NonNullable<EspnEvent['competitions'][number]['odds']>;

const espnEvent = (
	home: string,
	away: string,
	odds: EspnOdds | undefined,
	date = '2026-11-13T01:15Z'
): EspnEvent => ({
	id: '401873052',
	date,
	competitions: [
		{
			status: { type: { state: 'pre', completed: false } },
			competitors: [
				{ homeAway: 'home', team: { displayName: home } },
				{ homeAway: 'away', team: { displayName: away } }
			],
			odds
		}
	]
});

const draftKings = (spread: number, overUnder: number) => ({
	provider: { name: 'DraftKings' },
	spread,
	overUnder
});

const spreadsOf = (event: EspnEvent) =>
	espnEventToOdds(event)?.markets.find((m) => m.key === 'spreads')?.outcomes;

describe('espnEventToOdds', () => {
	it('gives the home favorite the negative line and the away dog the positive one', () => {
		const event = espnEvent('New York Giants', 'Washington Commanders', [draftKings(-1.5, 42.5)]);

		expect(spreadsOf(event)).toEqual([
			{ id: '', name: 'Washington Commanders', point: 1.5 },
			{ id: '', name: 'New York Giants', point: -1.5 }
		]);
	});

	it('flips the sign when the away team is favored', () => {
		// ESPN's "KC -3" at Atlanta comes through as spread 3 - the home team's line
		const event = espnEvent('Atlanta Falcons', 'Kansas City Chiefs', [draftKings(3, 46.5)]);

		expect(spreadsOf(event)).toEqual([
			{ id: '', name: 'Kansas City Chiefs', point: -3 },
			{ id: '', name: 'Atlanta Falcons', point: 3 }
		]);
	});

	it("keeps a pick'em line at 0 rather than -0", () => {
		const event = espnEvent('Atlanta Falcons', 'Kansas City Chiefs', [draftKings(0, 46.5)]);
		const [away, home] = spreadsOf(event) ?? [];

		expect(Object.is(away.point, 0)).toBe(true);
		expect(Object.is(home.point, 0)).toBe(true);
	});

	it('puts the over/under on both sides of the total', () => {
		const event = espnEvent('New York Giants', 'Washington Commanders', [draftKings(-1.5, 42.5)]);
		const totals = espnEventToOdds(event)?.markets.find((m) => m.key === 'totals')?.outcomes;

		expect(totals).toEqual([
			{ id: '', name: 'Over', point: 42.5 },
			{ id: '', name: 'Under', point: 42.5 }
		]);
	});

	it('uses the DraftKings line when ESPN lists more than one book', () => {
		const event = espnEvent('New York Giants', 'Washington Commanders', [
			{ provider: { name: 'ESPN BET' }, spread: -2.5, overUnder: 44 },
			draftKings(-1.5, 42.5)
		]);

		expect(spreadsOf(event)?.[1].point).toBe(-1.5);
	});

	it('returns null when the game has no line yet', () => {
		expect(espnEventToOdds(espnEvent('New York Giants', 'Washington Commanders', undefined))).toBe(
			null
		);
		expect(espnEventToOdds(espnEvent('New York Giants', 'Washington Commanders', []))).toBe(null);
		expect(
			espnEventToOdds(
				espnEvent('New York Giants', 'Washington Commanders', [
					{ provider: { name: 'DraftKings' }, spread: -1.5 }
				])
			)
		).toBe(null);
	});

	it('returns null for games that are not a regular NFL matchup, like the Pro Bowl', () => {
		expect(espnEventToOdds(espnEvent('AFC', 'NFC', [draftKings(-1.5, 60.5)]))).toBe(null);
	});

	it('keeps the game id and teams, and turns the kickoff into a full UTC ISO string', () => {
		const odds = espnEventToOdds(
			espnEvent('New York Giants', 'Washington Commanders', [draftKings(-1.5, 42.5)])
		);

		expect(odds).toMatchObject({
			id: '401873052',
			gameId: '401873052',
			home_team: 'New York Giants',
			away_team: 'Washington Commanders',
			commence_time: '2026-11-13T01:15:00.000Z'
		});
	});
});

describe('espnWeekDateRange', () => {
	it('asks for the Wednesday through the Tuesday, not the next Wednesday', () => {
		expect(espnWeekDateRange({ start: '2026-11-11', end: '2026-11-18' })).toBe('20261111-20261117');
	});

	it('handles a week that crosses into the next month', () => {
		expect(espnWeekDateRange({ start: '2026-11-25', end: '2026-12-02' })).toBe('20261125-20261201');
	});

	it('handles a week that crosses into the next year', () => {
		expect(espnWeekDateRange({ start: '2026-12-30', end: '2027-01-06' })).toBe('20261230-20270105');
	});
});
