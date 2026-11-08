import { describe, it, expect } from 'vitest';
import { computeSeasonStats, type StatsPick } from './host-stats';
import {
	MAX_POST_LENGTH,
	canAttempt,
	cleanFadeLine,
	decideFadePost,
	decideStandingsPost,
	defaultFadeLine,
	fadeLineError,
	fadePostText,
	postLength,
	standingsPostText,
	type BotPostRecord
} from './x-bot';

let nextId = 0;
const pick = (overrides: Partial<StatsPick>): StatsPick => ({
	id: `pick-${nextId++}`,
	person: 'Hank',
	week: 9,
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
	// Sunday of week 9, 1pm ET
	gameDate: '2026-11-08T13:00:00-05:00',
	// entered the Friday morning before
	createdAt: '2026-11-06T10:57:00-05:00',
	...overrides
});

const won = { winner: 1, push: 0 };
const lost = { winner: 0, push: 0 };
const pushed = { winner: 0, push: 1 };

const row = (overrides: Partial<BotPostRecord>): BotPostRecord => ({
	type: 'fade',
	year: 2026,
	week: 9,
	status: 'posted',
	attempts: 1,
	...overrides
});

const nameOf = (person: string) => person;

// week 9 of 2026 runs Wed Nov 4 to Tue Nov 10. Times are written in ET (-05:00 after DST ended Nov 1)
const fridayNoon = new Date('2026-11-06T12:00:00-05:00');

describe('canAttempt', () => {
	it('goes ahead when nothing has been tried yet', () => {
		expect(canAttempt(undefined)).toEqual({ ok: true });
	});

	it('never goes again once posted, or while a post is in flight', () => {
		expect(canAttempt(row({ status: 'posted' })).ok).toBe(false);
		expect(canAttempt(row({ status: 'posting' })).ok).toBe(false);
	});

	it('retries a failed post until it has failed 3 times', () => {
		expect(canAttempt(row({ status: 'failed', attempts: 2 }))).toEqual({ ok: true });
		expect(canAttempt(row({ status: 'failed', attempts: 3 }))).toEqual({
			ok: false,
			reason: 'gave up after 3 failed attempts'
		});
	});
});

describe('decideFadePost', () => {
	const weekPicks = [pick({ person: 'Big Cat' }), pick({ person: 'Hank' })];

	it('posts once the week has picks and they have settled', () => {
		expect(decideFadePost({ year: 2026, now: fridayNoon, picks: weekPicks, existing: [] })).toEqual(
			{
				post: true,
				type: 'fade',
				year: 2026,
				week: 9
			}
		);
	});

	it('waits for picks when the week has none yet', () => {
		const lastWeek = [pick({ week: 8 })];
		expect(
			decideFadePost({ year: 2026, now: fridayNoon, picks: lastWeek, existing: [] })
		).toMatchObject({
			post: false,
			week: 9,
			reason: 'no picks for week 9 yet'
		});
	});

	it('waits 45 minutes after the last pick is entered', () => {
		const stillEntering = [...weekPicks, pick({ createdAt: '2026-11-06T11:30:00-05:00' })];
		expect(
			decideFadePost({ year: 2026, now: fridayNoon, picks: stillEntering, existing: [] })
		).toMatchObject({ post: false, reason: expect.stringContaining('30 min ago') });

		const settled = new Date('2026-11-06T12:15:00-05:00');
		expect(
			decideFadePost({ year: 2026, now: settled, picks: stillEntering, existing: [] }).post
		).toBe(true);
	});

	it('does not post a week that has already been posted or claimed', () => {
		for (const status of ['posted', 'posting']) {
			const decision = decideFadePost({
				year: 2026,
				now: fridayNoon,
				picks: weekPicks,
				existing: [row({ status })]
			});
			expect(decision.post).toBe(false);
		}
	});

	it('retries a failed post, but not past the attempt limit', () => {
		const retry = [row({ status: 'failed', attempts: 1 })];
		expect(
			decideFadePost({ year: 2026, now: fridayNoon, picks: weekPicks, existing: retry }).post
		).toBe(true);

		const givenUp = [row({ status: 'failed', attempts: 3 })];
		expect(
			decideFadePost({ year: 2026, now: fridayNoon, picks: weekPicks, existing: givenUp }).post
		).toBe(false);
	});

	it("isn't held up by another week's post, or the other post type", () => {
		const existing = [row({ week: 8 }), row({ type: 'standings', week: 9 }), row({ year: 2025 })];
		expect(decideFadePost({ year: 2026, now: fridayNoon, picks: weekPicks, existing }).post).toBe(
			true
		);
	});

	it('gives up once every picked game has kicked off', () => {
		const mondayNight = new Date('2026-11-09T23:00:00-05:00');
		expect(
			decideFadePost({ year: 2026, now: mondayNight, picks: weekPicks, existing: [] })
		).toMatchObject({ post: false, reason: 'every week 9 pick has already kicked off' });
	});

	it('still posts while some picked games are yet to start', () => {
		// a Saturday game has started, the Sunday one hasn't
		const picks = [pick({ gameDate: '2026-11-07T16:30:00-05:00' }), pick({})];
		const saturdayEvening = new Date('2026-11-07T19:00:00-05:00');
		expect(decideFadePost({ year: 2026, now: saturdayEvening, picks, existing: [] }).post).toBe(
			true
		);
	});

	it('holds a post overnight until 8am ET', () => {
		const lateEntry = [pick({ createdAt: '2026-11-07T23:30:00-05:00' })];
		const twoAm = new Date('2026-11-08T02:00:00-05:00');
		expect(
			decideFadePost({ year: 2026, now: twoAm, picks: lateEntry, existing: [] })
		).toMatchObject({
			post: false,
			reason: 'no posts before 8am ET'
		});

		const eightAm = new Date('2026-11-08T08:00:00-05:00');
		expect(decideFadePost({ year: 2026, now: eightAm, picks: lateEntry, existing: [] }).post).toBe(
			true
		);
	});
});

describe('decideStandingsPost', () => {
	type Graded = { latestCompletedWeek: number | null };
	const weekNineDone: Graded = { latestCompletedWeek: 9 };
	const decide = (now: string, stats = weekNineDone, existing: BotPostRecord[] = []) =>
		decideStandingsPost({ year: 2026, now: new Date(now), stats, existing });

	it('waits until a week is fully graded', () => {
		expect(decide('2026-11-10T10:00:00-05:00', { latestCompletedWeek: null })).toMatchObject({
			post: false,
			week: null,
			reason: 'no week is fully graded yet'
		});
	});

	it("waits for the week's Tuesday, even when every pick so far is graded", () => {
		expect(decide('2026-11-09T23:30:00-05:00')).toMatchObject({
			post: false,
			reason: "week 9 isn't over until Tuesday"
		});
	});

	it('posts Tuesday morning, not in the small hours after Monday night is graded', () => {
		expect(decide('2026-11-10T01:30:00-05:00')).toMatchObject({
			post: false,
			reason: 'no posts before 8am ET'
		});
		expect(decide('2026-11-10T09:00:00-05:00')).toEqual({
			post: true,
			type: 'standings',
			year: 2026,
			week: 9
		});
	});

	it('still posts when grading runs late into the next week', () => {
		// Thursday of week 10
		expect(decide('2026-11-12T20:00:00-05:00').post).toBe(true);
	});

	it('stops once the next week has reached Friday', () => {
		expect(decide('2026-11-13T09:00:00-05:00')).toMatchObject({
			post: false,
			reason: 'week 9 standings are too old to post'
		});
		// the day this bot first deploys: week 8 is the latest graded, and it's Saturday of week 9
		expect(decide('2026-11-07T12:00:00-05:00', { latestCompletedWeek: 8 }).post).toBe(false);
	});

	it('does not post a week twice', () => {
		const existing = [row({ type: 'standings', status: 'posted' })];
		expect(decide('2026-11-10T09:00:00-05:00', weekNineDone, existing)).toMatchObject({
			post: false,
			reason: 'already posted'
		});
	});
});

// through week 8: Big Cat 2–0, PFT 1–1, Hank 0–2
const throughWeekEight = [
	pick({ person: 'Big Cat', week: 8, ...won }),
	pick({ person: 'Big Cat', week: 8, ...won }),
	pick({ person: 'PFT', week: 8, ...won }),
	pick({ person: 'PFT', week: 8, ...lost }),
	pick({ person: 'Hank', week: 8, ...lost }),
	pick({ person: 'Hank', week: 8, ...lost })
];

describe('fadePostText', () => {
	it('names the fade and lists their picks in kickoff order', () => {
		const weekPicks = [
			pick({ person: 'Big Cat' }),
			pick({ person: 'PFT' }),
			// entered first but kicks off last
			pick({
				person: 'Hank',
				pickTeam: null,
				pickTotalType: 'over',
				type: 'totals',
				pickScore: 44.5,
				gameDate: '2026-11-08T16:25:00-05:00'
			}),
			pick({
				person: 'Hank',
				pickTeam: 'jets',
				homeTeam: 'jets',
				awayTeam: 'patriots',
				pickScore: 3
			})
		];
		const stats = computeSeasonStats([...throughWeekEight, ...weekPicks]);

		expect(fadePostText({ week: 9, stats, weekPicks, nameOf })).toBe(
			"Week 9 picks are in.\n\nThe fade: Hank, 0–2 on the season.\nHank's picks: Jets +3 · BUF @ KC Over 44.5"
		);
	});

	it('uses display names', () => {
		const weekPicks = [pick({ person: 'Big Cat' }), pick({ person: 'Hank' })];
		const stats = computeSeasonStats([...throughWeekEight, ...weekPicks]);
		const text = fadePostText({ week: 9, stats, weekPicks, nameOf: (p) => `${p} (display)` });

		expect(text).toContain('The fade: Hank (display), 0–2');
	});

	it('just says the picks are in before anyone has a record to fade', () => {
		const weekPicks = [pick({ person: 'Big Cat', week: 1 }), pick({ person: 'Hank', week: 1 })];
		expect(fadePostText({ week: 1, stats: computeSeasonStats(weekPicks), weekPicks, nameOf })).toBe(
			"Week 1 picks are in. Every host's picks are on the card."
		);
	});

	it('stays inside the limit with six hosts and the longest pick labels', () => {
		const hosts = ['Big Cat', 'PFT', 'Hank', 'Memes', 'Max', 'Zach'];
		const longTotal = {
			type: 'totals',
			pickTeam: null,
			pickTotalType: 'under' as const,
			pickScore: 44.5,
			homeTeam: 'jaguars' as const,
			awayTeam: 'chargers' as const
		};
		const history = hosts.flatMap((person) => [pick({ person, week: 8, ...lost })]);
		const weekPicks = hosts.flatMap((person) => [
			pick({ person, pickTeam: 'fortyNiners', homeTeam: 'fortyNiners', pickScore: -10.5 }),
			pick({ person, ...longTotal })
		]);
		const text = fadePostText({
			week: 18,
			stats: computeSeasonStats([...history, ...weekPicks]),
			weekPicks,
			nameOf
		});

		expect(text).toContain("'s picks:");
		expect(postLength(text)).toBeLessThanOrEqual(MAX_POST_LENGTH);
	});

	it('drops the pick list rather than run over the limit', () => {
		const weekPicks = [pick({ person: 'Big Cat' }), pick({ person: 'Hank' })];
		const stats = computeSeasonStats([...throughWeekEight, ...weekPicks]);
		const text = fadePostText({ week: 9, stats, weekPicks, nameOf: () => 'X'.repeat(120) });

		expect(text).not.toContain('picks:');
		expect(postLength(text)).toBeLessThanOrEqual(MAX_POST_LENGTH);
	});

	describe('with the admin’s own middle line', () => {
		const weekPicks = [
			pick({ person: 'Big Cat' }),
			pick({
				person: 'Hank',
				pickTeam: 'jets',
				homeTeam: 'jets',
				awayTeam: 'patriots',
				pickScore: 3
			})
		];
		const stats = computeSeasonStats([...throughWeekEight, ...weekPicks]);
		const withLine = (customLine: string | null) =>
			fadePostText({ week: 9, stats, weekPicks, nameOf, customLine });

		it('swaps out only the middle line', () => {
			expect(withLine('Hank has lost 6 straight. You know what to do.')).toBe(
				"Week 9 picks are in.\n\nHank has lost 6 straight. You know what to do.\nHank's picks: Jets +3"
			);
		});

		it('keeps the default for a blank line', () => {
			expect(withLine('  \n ')).toBe(withLine(null));
		});

		it('drops the pick list when the line leaves no room for it', () => {
			const line = 'x'.repeat(250);
			expect(withLine(line)).toBe(`Week 9 picks are in.\n\n${line}`);
		});

		it('falls back to the default rather than send a post X would turn down', () => {
			expect(withLine('x'.repeat(300))).toBe(withLine(null));
		});

		it('uses the line before anyone has a record to fade, too', () => {
			const weekOne = [pick({ person: 'Big Cat', week: 1 }), pick({ person: 'Hank', week: 1 })];
			expect(
				fadePostText({
					week: 1,
					stats: computeSeasonStats(weekOne),
					weekPicks: weekOne,
					nameOf,
					customLine: 'Season one, week one.'
				})
			).toBe('Week 1 picks are in.\n\nSeason one, week one.');
		});
	});
});

describe('defaultFadeLine', () => {
	it('is the middle line the post uses when the admin has not written one', () => {
		const weekPicks = [pick({ person: 'Big Cat' }), pick({ person: 'Hank' })];
		const stats = computeSeasonStats([...throughWeekEight, ...weekPicks]);
		expect(defaultFadeLine({ stats, weekPicks, nameOf })).toBe(
			'The fade: Hank, 0–2 on the season.'
		);
	});

	it('is null before anyone has a record to fade', () => {
		const weekPicks = [pick({ person: 'Big Cat', week: 1 })];
		expect(defaultFadeLine({ stats: computeSeasonStats(weekPicks), weekPicks, nameOf })).toBe(null);
	});
});

describe('cleanFadeLine', () => {
	it("trims and turns a textarea's line breaks into the ones X uses", () => {
		expect(cleanFadeLine('  Fade Hank.\r\nTrust me.\r\n ')).toBe('Fade Hank.\nTrust me.');
	});
});

describe('fadeLineError', () => {
	// "Week 9 picks are in.\n\n" takes 22 of the 280
	it('accepts a line that fits', () => {
		expect(fadeLineError(9, 'x'.repeat(258))).toBe(null);
	});

	it('turns down a line that would push the post over the limit', () => {
		expect(fadeLineError(9, 'x'.repeat(259))).toBe(
			'Too long: the post would be 281 characters, and X allows 280'
		);
	});

	it('counts an emoji as two, like X does', () => {
		expect(fadeLineError(9, '🔥'.repeat(129))).toBe(null);
		expect(fadeLineError(9, '🔥'.repeat(130))).not.toBe(null);
	});

	it('turns down an empty line', () => {
		expect(fadeLineError(9, '')).toBe('The line is empty');
	});
});

describe('standingsPostText', () => {
	it('calls out the worst week and the leader', () => {
		// Big Cat 3–1, Hank 1–3, PFT 1–3 and 0–2 in week 9
		const picks = [
			pick({ person: 'Big Cat', week: 8, ...won }),
			pick({ person: 'Big Cat', week: 8, ...won }),
			pick({ person: 'Big Cat', week: 9, ...won }),
			pick({ person: 'Big Cat', week: 9, ...lost }),
			pick({ person: 'PFT', week: 8, ...won }),
			pick({ person: 'PFT', week: 8, ...lost }),
			pick({ person: 'PFT', week: 9, ...lost }),
			pick({ person: 'PFT', week: 9, ...lost }),
			pick({ person: 'Hank', week: 8, ...lost }),
			pick({ person: 'Hank', week: 8, ...lost }),
			pick({ person: 'Hank', week: 9, ...won }),
			pick({ person: 'Hank', week: 9, ...lost })
		];

		expect(standingsPostText({ week: 9, stats: computeSeasonStats(picks), nameOf })).toBe(
			'Week 9 is graded.\n\nWorst week: PFT went 0–2. Last place. 2 games behind Big Cat.\nLeading the show: Big Cat at 3–1.'
		);
	});

	it('leaves out the leader line when the leader had the worst week', () => {
		// Big Cat 3–2 and 0–2 in week 9, Hank 2–2, PFT 1–3
		const picks = [
			pick({ person: 'Big Cat', week: 7, ...won }),
			pick({ person: 'Big Cat', week: 8, ...won }),
			pick({ person: 'Big Cat', week: 8, ...won }),
			pick({ person: 'Big Cat', week: 9, ...lost }),
			pick({ person: 'Big Cat', week: 9, ...lost }),
			pick({ person: 'Hank', week: 8, ...lost }),
			pick({ person: 'Hank', week: 8, ...lost }),
			pick({ person: 'Hank', week: 9, ...won }),
			pick({ person: 'Hank', week: 9, ...won }),
			pick({ person: 'PFT', week: 8, ...lost }),
			pick({ person: 'PFT', week: 8, ...lost }),
			pick({ person: 'PFT', week: 9, ...won }),
			pick({ person: 'PFT', week: 9, ...lost })
		];

		expect(standingsPostText({ week: 9, stats: computeSeasonStats(picks), nameOf })).toBe(
			'Week 9 is graded.\n\nWorst week: Big Cat went 0–2. 1st place. Hank is 1 game back.'
		);
	});

	it('lists everyone tied for 1st', () => {
		// Hank 2–0–2 and Big Cat 3–1 share 1st on points, PFT 1–3
		const picks = [
			pick({ person: 'Hank', week: 8, ...won }),
			pick({ person: 'Hank', week: 8, ...pushed }),
			pick({ person: 'Hank', week: 9, ...won }),
			pick({ person: 'Hank', week: 9, ...pushed }),
			pick({ person: 'Big Cat', week: 8, ...won }),
			pick({ person: 'Big Cat', week: 8, ...won }),
			pick({ person: 'Big Cat', week: 9, ...won }),
			pick({ person: 'Big Cat', week: 9, ...lost }),
			pick({ person: 'PFT', week: 8, ...won }),
			pick({ person: 'PFT', week: 8, ...lost }),
			pick({ person: 'PFT', week: 9, ...lost }),
			pick({ person: 'PFT', week: 9, ...lost })
		];

		expect(standingsPostText({ week: 9, stats: computeSeasonStats(picks), nameOf })).toBe(
			'Week 9 is graded.\n\nWorst week: PFT went 0–2. Last place. 2 games behind Big Cat.\nTied at the top: Hank (2–0–2) and Big Cat (3–1).'
		);
	});
});

describe('postLength', () => {
	it('counts plain text, en dashes and middle dots as one each', () => {
		expect(postLength('Hank 12–20 · Jets +3')).toBe(20);
	});

	it('counts emoji as two, the way X does', () => {
		expect(postLength('🏈')).toBe(2);
	});
});
