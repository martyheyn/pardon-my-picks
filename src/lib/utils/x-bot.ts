import {
	chronological,
	formatRecord,
	weekFade,
	type SeasonStats,
	type StatsPick
} from './host-stats';
import { shortPickLabel, standingLine } from './host-copy';
import { daysSinceWeekStart, easternHour, getCurrentWeek } from './nfl-week';

// when the X bot posts and what it says. Pure and env-free like host-stats - the server side
// (src/lib/server/x-bot/run.ts) loads the picks and the BotPost rows and hands them in, so every
// rule here can be tested with a made-up clock

export type BotPostType = 'fade' | 'standings';

// a BotPost row: 'posting' is claimed and in flight (or a run died mid-post), 'posted' is done,
// 'failed' means X turned it down before anything went public, so it's safe to try again
export type BotPostStatus = 'posting' | 'posted' | 'failed';

export type BotPostRecord = {
	type: string;
	year: number;
	week: number;
	status: string;
	attempts: number;
};

export type BotDecision =
	| { post: true; type: BotPostType; year: number; week: number }
	| { post: false; type: BotPostType; year: number; week: number | null; reason: string };

// a post X keeps turning down stops being retried after this many tries, so a bad card or an empty
// credit balance doesn't get re-sent every hour all week
export const MAX_ATTEMPTS = 3;

// the admin form saves every host's picks in one submit, so a week with nothing new for this long
// is taken as all in. Hosts sitting the week out don't hold it up
export const PICKS_QUIET_MINUTES = 45;

// nothing goes out overnight - a Monday night game graded at 1am ET waits for the morning
export const FIRST_POST_HOUR_ET = 8;

// week W's standings wait for its Tuesday (day 6, the last day of the NFL week) and stop being worth
// posting once the next week's Friday comes around (day 9) and its fade post is due
const WEEK_OVER_DAY = 6;
const STANDINGS_STALE_DAY = 9;

export const MAX_POST_LENGTH = 280;

const MINUTE_MS = 60 * 1000;

const toTime = (date: Date | string | null) => (date === null ? 0 : new Date(date).getTime());

// whether a BotPost row (if there is one) leaves room for another try
export function canAttempt(
	row: BotPostRecord | undefined
): { ok: true } | { ok: false; reason: string } {
	if (!row) return { ok: true };
	if (row.status === 'posted') return { ok: false, reason: 'already posted' };
	if (row.status === 'posting') {
		return {
			ok: false,
			reason: 'a post is in flight, or a run stopped mid-post - check X before clearing the row'
		};
	}
	if (row.attempts >= MAX_ATTEMPTS) {
		return { ok: false, reason: `gave up after ${row.attempts} failed attempts` };
	}
	return { ok: true };
}

const findRow = (existing: BotPostRecord[], type: BotPostType, year: number, week: number) =>
	existing.find((row) => row.type === type && row.year === year && row.week === week);

const isQuietHours = (now: Date) => easternHour(now) < FIRST_POST_HOUR_ET;

const QUIET_HOURS_REASON = `no posts before ${FIRST_POST_HOUR_ET}am ET`;

// "who to fade": once this week's picks are in and settled, and before every picked game has started
export function decideFadePost({
	year,
	now,
	picks,
	existing
}: {
	year: number;
	now: Date;
	// the season's host picks
	picks: Pick<StatsPick, 'week' | 'createdAt' | 'gameDate'>[];
	existing: BotPostRecord[];
}): BotDecision {
	const week = getCurrentWeek(year, now);
	const skip = (reason: string): BotDecision => ({ post: false, type: 'fade', year, week, reason });

	const weekPicks = picks.filter((pick) => pick.week === week);
	if (weekPicks.length === 0) return skip(`no picks for week ${week} yet`);

	const attempt = canAttempt(findRow(existing, 'fade', year, week));
	if (!attempt.ok) return skip(attempt.reason);

	const lastEntered = Math.max(...weekPicks.map((pick) => toTime(pick.createdAt)));
	const minutesSince = Math.floor((now.getTime() - lastEntered) / MINUTE_MS);
	if (minutesSince < PICKS_QUIET_MINUTES) {
		return skip(`picks still coming in - the last one was entered ${minutesSince} min ago`);
	}

	const anyStillToPlay = weekPicks.some(
		(pick) => pick.gameDate !== null && toTime(pick.gameDate) > now.getTime()
	);
	if (!anyStillToPlay) return skip(`every week ${week} pick has already kicked off`);

	if (isQuietHours(now)) return skip(QUIET_HOURS_REASON);

	return { post: true, type: 'fade', year, week };
}

// "standings": once the latest week is fully graded and over, while it's still news
export function decideStandingsPost({
	year,
	now,
	stats,
	existing
}: {
	year: number;
	now: Date;
	stats: Pick<SeasonStats<StatsPick>, 'latestCompletedWeek'>;
	existing: BotPostRecord[];
}): BotDecision {
	const week = stats.latestCompletedWeek;
	if (week === null) {
		return { post: false, type: 'standings', year, week, reason: 'no week is fully graded yet' };
	}
	const skip = (reason: string): BotDecision => ({
		post: false,
		type: 'standings',
		year,
		week,
		reason
	});

	const attempt = canAttempt(findRow(existing, 'standings', year, week));
	if (!attempt.ok) return skip(attempt.reason);

	// a week whose picks are all graded before Tuesday may only have part of its picks entered yet
	const day = daysSinceWeekStart(year, week, now);
	if (day < WEEK_OVER_DAY) return skip(`week ${week} isn't over until Tuesday`);
	if (day >= STANDINGS_STALE_DAY) return skip(`week ${week} standings are too old to post`);

	if (isQuietHours(now)) return skip(QUIET_HOURS_REASON);

	return { post: true, type: 'standings', year, week };
}

// how X counts a post's length: most Latin text (and the – and · used here) is 1, everything else
// - emoji, CJK - is 2. Follows twitter-text's v3 weights; URLs (always 23) aren't handled since the
// bot never puts a link in its text
const SINGLE_WEIGHT_RANGES: [number, number][] = [
	[0x0000, 0x10ff],
	[0x2000, 0x200d],
	[0x2010, 0x201f],
	[0x2032, 0x2037]
];

export function postLength(text: string): number {
	let length = 0;
	for (const char of text.normalize('NFC')) {
		const code = char.codePointAt(0) ?? 0;
		const single = SINGLE_WEIGHT_RANGES.some(([start, end]) => code >= start && code <= end);
		length += single ? 1 : 2;
	}
	return length;
}

type NameOf = (person: string) => string;

// "Week 9 picks are in. The fade: Hank, 12–20 on the season. Hank's picks: Jets +3 · ..."
// Names the same host the Friday card marks as the fade
export function fadePostText({
	week,
	stats,
	weekPicks,
	nameOf
}: {
	week: number;
	stats: SeasonStats<StatsPick>;
	weekPicks: StatsPick[];
	nameOf: NameOf;
}): string {
	const { fade } = weekFade(stats, weekPicks);
	if (!fade) return `Week ${week} picks are in. Every host's picks are on the card.`;

	const name = nameOf(fade.person);
	const intro = `Week ${week} picks are in.\n\nThe fade: ${name}, ${formatRecord(fade.record)} on the season.`;
	const labels = chronological(weekPicks.filter((pick) => pick.person === fade.person))
		.map(shortPickLabel)
		.filter((label) => label !== '');

	const full = `${intro}\n${name}'s picks: ${labels.join(' · ')}`;
	// the picks are on the card too, so they're the first thing to go if a post ever runs long
	return postLength(full) <= MAX_POST_LENGTH ? full : intro;
}

const joinNames = (names: string[]) =>
	names.length <= 1
		? names.join('')
		: `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

// "Week 9 is graded. Worst week: PFT went 0–2. Last place. 3 games behind Hank. Leading the show: ..."
// Calls out the same host the standings card does
export function standingsPostText({
	week,
	stats,
	nameOf
}: {
	week: number;
	stats: SeasonStats<StatsPick>;
	nameOf: NameOf;
}): string {
	const lines = [`Week ${week} is graded.`];
	const worst = stats.worstWeek;
	const worstHost = stats.standings.find((host) => host.person === worst?.person);

	if (worst && worstHost) {
		const lastRank = stats.standings[stats.standings.length - 1]?.rank ?? 1;
		const standing = standingLine(worstHost, lastRank, nameOf);
		lines.push(
			'',
			`Worst week: ${nameOf(worst.person)} went ${formatRecord(worst.record)}.${standing ? ` ${standing}.` : ''}`
		);
	}

	// skipped when the worst week came from a leader - their standing line already says where 1st is
	const leaders = stats.standings.filter((host) => host.rank === 1);
	const worstIsLeader = leaders.some((host) => host.person === worst?.person);
	if (!worstIsLeader && leaders.length === 1) {
		lines.push(
			`Leading the show: ${nameOf(leaders[0].person)} at ${formatRecord(leaders[0].record)}.`
		);
	}
	if (!worstIsLeader && leaders.length > 1) {
		const names = leaders.map((host) => `${nameOf(host.person)} (${formatRecord(host.record)})`);
		lines.push(`Tied at the top: ${joinNames(names)}.`);
	}

	return lines.join('\n');
}
