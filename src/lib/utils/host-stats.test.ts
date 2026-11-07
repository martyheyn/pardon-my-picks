import { describe, it, expect } from 'vitest';
import { computeSeasonStats, weekFade, type StatsPick } from './host-stats';

let nextId = 0;
const pick = (overrides: Partial<StatsPick>): StatsPick => ({
	id: `pick-${nextId++}`,
	person: 'Hank',
	week: 8,
	type: 'spreads',
	homeTeam: 'chiefs',
	awayTeam: 'bills',
	homeTeamScore: null,
	awayTeamScore: null,
	pickTeam: 'chiefs',
	pickTotalType: null,
	pickScore: -3.5,
	winner: null,
	push: null,
	gameDate: '2026-11-01T18:00:00Z',
	createdAt: '2026-10-30T15:00:00Z',
	...overrides
});

const won = { winner: 1, push: 0 };
const lost = { winner: 0, push: 0 };
const pushed = { winner: 0, push: 1 };

// through week 8: Big Cat 2–0, PFT 1–1, Hank 0–2
const season = [
	pick({ person: 'Big Cat', ...won }),
	pick({ person: 'Big Cat', ...won }),
	pick({ person: 'PFT', ...won }),
	pick({ person: 'PFT', ...lost }),
	pick({ person: 'Hank', ...lost }),
	pick({ person: 'Hank', ...lost })
];

describe('weekFade', () => {
	it('fades whoever is last on the season among the hosts playing this week', () => {
		const weekPicks = ['Big Cat', 'PFT', 'Hank'].map((person) => pick({ person, week: 9 }));
		const { playing, fade } = weekFade(computeSeasonStats([...season, ...weekPicks]), weekPicks);

		expect(playing.map((host) => host.person)).toEqual(['Big Cat', 'PFT', 'Hank']);
		expect(fade?.person).toBe('Hank');
	});

	it('leaves out a host sitting the week out, so the next one up is the fade', () => {
		const weekPicks = ['Big Cat', 'PFT'].map((person) => pick({ person, week: 9 }));
		const { playing, fade } = weekFade(computeSeasonStats([...season, ...weekPicks]), weekPicks);

		expect(playing.map((host) => host.person)).toEqual(['Big Cat', 'PFT']);
		expect(fade?.person).toBe('PFT');
	});

	it('has no fade until last place has a win or a loss', () => {
		// week 1: nobody has a record yet
		const weekOne = ['Big Cat', 'Hank'].map((person) => pick({ person, week: 1 }));
		expect(weekFade(computeSeasonStats(weekOne), weekOne).fade).toBeNull();

		// a host with nothing but a push isn't fade material either
		const pushOnly = [
			pick({ person: 'Hank', week: 1, ...pushed }),
			pick({ person: 'Hank', week: 2 })
		];
		expect(weekFade(computeSeasonStats(pushOnly), [pushOnly[1]]).fade).toBeNull();
	});

	it('has nobody playing when the week has no picks', () => {
		expect(weekFade(computeSeasonStats(season), [])).toEqual({ playing: [], fade: null });
	});
});
