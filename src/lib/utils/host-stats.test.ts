import { describe, it, expect } from 'vitest';
import {
	buildStandings,
	completedWeeks,
	computeSeasonStats,
	coverMargin,
	currentStreak,
	findWorstPick,
	formatRecord,
	latestCompletedWeek,
	personAhead,
	tallyRecord,
	winPct,
	worstWeek,
	type StatsPick
} from './host-stats';

let pickCount = 0;

// a graded Chiefs -3 spread pick unless overridden. Kickoffs default to one per day, in the order
// the picks are made, so chronological order matches creation order
const makePick = (overrides: Partial<StatsPick> = {}): StatsPick => {
	pickCount++;
	const kickoff = new Date(Date.UTC(2026, 8, 1 + pickCount));
	return {
		id: `pick-${pickCount}`,
		person: 'Hank',
		week: 1,
		type: 'spreads',
		homeTeam: 'chiefs',
		awayTeam: 'bills',
		homeTeamScore: 24,
		awayTeamScore: 17,
		pickTeam: 'chiefs',
		pickTotalType: null,
		pickScore: -3,
		winner: 1,
		push: 0,
		gameDate: kickoff,
		createdAt: kickoff,
		...overrides
	};
};

const win = (overrides: Partial<StatsPick> = {}) => makePick({ winner: 1, push: 0, ...overrides });
const loss = (overrides: Partial<StatsPick> = {}) => makePick({ winner: 0, push: 0, ...overrides });
const push = (overrides: Partial<StatsPick> = {}) => makePick({ winner: 0, push: 1, ...overrides });
const ungraded = (overrides: Partial<StatsPick> = {}) =>
	makePick({ winner: null, push: null, homeTeamScore: null, awayTeamScore: null, ...overrides });

describe('tallyRecord', () => {
	it('counts wins, losses and pushes and skips ungraded picks', () => {
		expect(tallyRecord([win(), win(), loss(), push(), ungraded()])).toEqual({
			wins: 2,
			losses: 1,
			pushes: 1
		});
	});

	it('treats a push as a push even though its winner is 0, like the stats page', () => {
		expect(tallyRecord([push()])).toEqual({ wins: 0, losses: 0, pushes: 1 });
	});
});

describe('winPct', () => {
	it('leaves pushes out', () => {
		expect(winPct({ wins: 3, losses: 1, pushes: 4 })).toBe(0.75);
	});

	it('is null when there are no wins or losses yet', () => {
		expect(winPct({ wins: 0, losses: 0, pushes: 0 })).toBeNull();
		expect(winPct({ wins: 0, losses: 0, pushes: 2 })).toBeNull();
	});
});

describe('formatRecord', () => {
	it('only shows pushes when there are some', () => {
		expect(formatRecord({ wins: 23, losses: 31, pushes: 0 })).toBe('23–31');
		expect(formatRecord({ wins: 23, losses: 31, pushes: 2 })).toBe('23–31–2');
	});
});

describe('coverMargin', () => {
	it('measures a home spread pick from the home side', () => {
		// chiefs -3 at home, win 24-17: covered by 4
		expect(coverMargin(win())).toBe(4);
	});

	it('measures an away spread pick from the away side', () => {
		// bills +3 on the road, lose 24-17: missed by 4
		expect(coverMargin(loss({ pickTeam: 'bills', pickScore: 3 }))).toBe(-4);
	});

	it('measures overs and unders against the combined score', () => {
		const total = { type: 'totals', pickTeam: null, pickScore: 44.5 } as const;
		// 24 + 17 = 41
		expect(coverMargin(loss({ ...total, pickTotalType: 'over' }))).toBe(-3.5);
		expect(coverMargin(win({ ...total, pickTotalType: 'under' }))).toBe(3.5);
	});

	it('is null without a final score', () => {
		expect(coverMargin(ungraded())).toBeNull();
	});

	it('is null when the picked team is not in the game', () => {
		expect(coverMargin(loss({ pickTeam: 'jets' }))).toBeNull();
	});
});

describe('findWorstPick', () => {
	it('picks the loss that missed its line by the most', () => {
		const close = loss({ homeTeamScore: 20, awayTeamScore: 18 }); // chiefs -3, won by 2: missed by 1
		const blowout = loss({ homeTeamScore: 10, awayTeamScore: 34 }); // lost by 24: missed by 27
		expect(findWorstPick([close, blowout, win()])).toEqual({ pick: blowout, missedBy: 27 });
	});

	it('works for totals', () => {
		const over = loss({
			type: 'totals',
			pickTeam: null,
			pickTotalType: 'over',
			pickScore: 50.5,
			homeTeamScore: 10,
			awayTeamScore: 6
		});
		expect(findWorstPick([over])?.missedBy).toBe(34.5);
	});

	it('ignores pushes and wins', () => {
		expect(findWorstPick([push({ homeTeamScore: 20, awayTeamScore: 17 }), win()])).toBeNull();
	});

	it('takes the more recent pick when two misses tie', () => {
		const earlier = loss({ homeTeamScore: 17, awayTeamScore: 17 });
		const later = loss({ homeTeamScore: 17, awayTeamScore: 17 });
		expect(findWorstPick([later, earlier])?.pick).toBe(later);
	});

	it('takes a different definition when one is passed in', () => {
		const first = loss();
		const second = loss();
		expect(findWorstPick([first, second], (pick) => (pick === first ? 1 : 0))?.pick).toBe(first);
	});
});

describe('currentStreak', () => {
	it('counts back from the most recent decided pick', () => {
		expect(currentStreak([win(), loss(), loss(), loss()])).toEqual({ outcome: 'L', count: 3 });
	});

	it('steps over pushes without breaking or extending the streak', () => {
		expect(currentStreak([loss(), win(), push(), win(), push()])).toEqual({
			outcome: 'W',
			count: 2
		});
	});

	it('orders by kickoff, not by array order', () => {
		const first = win();
		const second = loss();
		expect(currentStreak([second, first])).toEqual({ outcome: 'L', count: 1 });
	});

	it('is null with nothing decided', () => {
		expect(currentStreak([])).toBeNull();
		expect(currentStreak([push(), ungraded()])).toBeNull();
	});
});

describe('completedWeeks', () => {
	it('leaves out a week that still has an ungraded pick', () => {
		const picks = [win({ week: 1 }), loss({ week: 2 }), ungraded({ week: 2 }), win({ week: 3 })];
		expect(completedWeeks(picks)).toEqual([1, 3]);
		expect(latestCompletedWeek(picks)).toBe(3);
	});

	it('has nothing in week 1 before grading', () => {
		expect(latestCompletedWeek([ungraded({ week: 1 }), ungraded({ week: 1 })])).toBeNull();
		expect(latestCompletedWeek([])).toBeNull();
	});
});

describe('buildStandings', () => {
	it('ranks by wins plus half a point per push, like the homepage race', () => {
		const picks = [
			win({ person: 'PFT' }),
			push({ person: 'PFT' }),
			win({ person: 'Hank' }),
			loss({ person: 'Hank' }),
			win({ person: 'Big Cat' }),
			win({ person: 'Big Cat' })
		];
		expect(buildStandings(picks).map((row) => [row.person, row.points, row.rank])).toEqual([
			['Big Cat', 2, 1],
			['PFT', 1.5, 2],
			['Hank', 1, 3]
		]);
	});

	it('gives tied hosts the same rank and skips the next one', () => {
		const picks = [
			win({ person: 'PFT' }),
			win({ person: 'Hank' }),
			loss({ person: 'Max' }),
			win({ person: 'Big Cat' }),
			win({ person: 'Big Cat' })
		];
		expect(buildStandings(picks).map((row) => [row.person, row.rank])).toEqual([
			['Big Cat', 1],
			['Hank', 2],
			['PFT', 2],
			['Max', 4]
		]);
	});

	it('puts the host with fewer losses first within a tie', () => {
		const picks = [win({ person: 'Hank' }), loss({ person: 'Hank' }), win({ person: 'Zach' })];
		const standings = buildStandings(picks);
		expect(standings.map((row) => row.person)).toEqual(['Zach', 'Hank']);
		expect(standings.map((row) => row.rank)).toEqual([1, 1]);
	});

	it('still lists a host who sat out bets, on fewer points', () => {
		const picks = [win({ person: 'Hank' }), win({ person: 'Hank' }), win({ person: 'Max' })];
		expect(buildStandings(picks).map((row) => [row.person, row.points])).toEqual([
			['Hank', 2],
			['Max', 1]
		]);
	});

	it('handles a host with only pushes', () => {
		const standings = buildStandings([push({ person: 'Memes' }), push({ person: 'Memes' })]);
		expect(standings[0]).toMatchObject({
			person: 'Memes',
			points: 1,
			rank: 1,
			record: { wins: 0, losses: 0, pushes: 2 }
		});
	});
});

describe('personAhead', () => {
	const standings = [
		{ person: 'Big Cat', points: 10, rank: 1 },
		{ person: 'PFT', points: 9, rank: 2 },
		{ person: 'Hank', points: 7, rank: 3 },
		{ person: 'Max', points: 7, rank: 3 },
		{ person: 'Zach', points: 4, rank: 5 }
	];

	it('names the host directly above and the gap', () => {
		expect(personAhead(standings, 'PFT')).toEqual({
			relation: 'behind',
			person: 'Big Cat',
			gap: 1
		});
	});

	it('skips past a host tied with them', () => {
		expect(personAhead(standings, 'Max')).toEqual({ relation: 'behind', person: 'PFT', gap: 2 });
	});

	it('names the lower of two hosts tied directly above', () => {
		expect(personAhead(standings, 'Zach')).toEqual({ relation: 'behind', person: 'Max', gap: 3 });
	});

	it('names the chaser for 1st place', () => {
		expect(personAhead(standings, 'Big Cat')).toEqual({
			relation: 'chased-by',
			person: 'PFT',
			gap: 1
		});
	});

	it('calls out a tie for 1st', () => {
		const tiedAtTop = [
			{ person: 'Big Cat', points: 5, rank: 1 },
			{ person: 'PFT', points: 5, rank: 1 }
		];
		expect(personAhead(tiedAtTop, 'PFT')).toEqual({ relation: 'tied', person: 'Big Cat', gap: 0 });
	});

	it('is null with nobody to compare against', () => {
		expect(personAhead([{ person: 'Hank', points: 3, rank: 1 }], 'Hank')).toBeNull();
		expect(personAhead(standings, 'Jake')).toBeNull();
	});
});

describe('worstWeek', () => {
	it('finds the worst wins minus losses that week', () => {
		const picks = [
			win({ person: 'PFT', week: 4 }),
			loss({ person: 'PFT', week: 4 }),
			loss({ person: 'Hank', week: 4 }),
			loss({ person: 'Hank', week: 4 }),
			loss({ person: 'Max', week: 3 }),
			loss({ person: 'Max', week: 3 })
		];
		expect(worstWeek(picks, 4)).toMatchObject({ person: 'Hank', record: { wins: 0, losses: 2 } });
	});

	it('breaks a tie by how badly the losses missed', () => {
		const picks = [
			loss({ person: 'PFT', week: 4, homeTeamScore: 20, awayTeamScore: 18 }), // missed by 1
			loss({ person: 'Hank', week: 4, homeTeamScore: 10, awayTeamScore: 34 }) // missed by 27
		];
		expect(worstWeek(picks, 4)).toMatchObject({ person: 'Hank', lossMargin: 27 });
	});

	it('falls back to name order when everything else ties', () => {
		const picks = [loss({ person: 'PFT', week: 4 }), loss({ person: 'Hank', week: 4 })];
		expect(worstWeek(picks, 4)?.person).toBe('Hank');
	});

	it('is null for a week with no picks', () => {
		expect(worstWeek([win({ week: 1 })], 2)).toBeNull();
	});
});

describe('computeSeasonStats', () => {
	it('returns empty results for a season with no picks', () => {
		expect(computeSeasonStats([])).toEqual({
			standings: [],
			latestCompletedWeek: null,
			worstWeek: null
		});
	});

	it('lists hosts with 0-0 records before anything is graded', () => {
		const stats = computeSeasonStats([ungraded({ person: 'Hank' }), ungraded({ person: 'PFT' })]);
		expect(stats.latestCompletedWeek).toBeNull();
		expect(stats.worstWeek).toBeNull();
		expect(stats.standings.map((host) => [host.person, host.rank, host.winPct])).toEqual([
			['Hank', 1, null],
			['PFT', 1, null]
		]);
		expect(stats.standings[0]).toMatchObject({
			lastWeek: null,
			streak: null,
			worstPick: null,
			fadeNet: 0
		});
	});

	it('builds every host stat from the same picks', () => {
		const picks = [
			win({ person: 'Hank', week: 1 }),
			loss({ person: 'Hank', week: 1 }),
			loss({ person: 'Hank', week: 2, homeTeamScore: 10, awayTeamScore: 30 }),
			push({ person: 'Hank', week: 2 }),
			win({ person: 'PFT', week: 1 }),
			win({ person: 'PFT', week: 1 }),
			win({ person: 'PFT', week: 2 }),
			loss({ person: 'PFT', week: 2 }),
			ungraded({ person: 'Hank', week: 3 })
		];
		const stats = computeSeasonStats(picks);
		const hank = stats.standings.find((host) => host.person === 'Hank');

		expect(stats.latestCompletedWeek).toBe(2);
		expect(stats.worstWeek).toMatchObject({ person: 'Hank', week: 2 });
		expect(hank).toMatchObject({
			record: { wins: 1, losses: 2, pushes: 1 },
			rank: 2,
			points: 1.5,
			personAhead: { relation: 'behind', person: 'PFT', gap: 1.5 },
			fadeRecord: { wins: 2, losses: 1, pushes: 1 },
			fadeNet: 1,
			lastWeek: { week: 2, record: { wins: 0, losses: 1, pushes: 1 } },
			streak: { outcome: 'L', count: 2 },
			worstPick: { missedBy: 23 }
		});
		expect(hank?.winPct).toBeCloseTo(1 / 3);
	});
});
