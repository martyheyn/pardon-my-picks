// The NFL week the site is on, worked out from the date. This used to be the CURRENT_WEEK,
// PUBLIC_CURRENT_WEEK, GAMES_START_DATE and GAMES_END_DATE env vars, bumped by hand and redeployed
// every week.
//
// The season opens on the Thursday after Labor Day, so week 1 starts the Wednesday before that
// game. Every week after runs Wednesday through Tuesday, which keeps a week's Thursday, Saturday,
// Sunday and Monday games together (Wednesday Christmas games too), and rolls the site over at
// midnight ET Tuesday night - after even a late Monday night doubleheader has finished and been
// graded.
//
// Pure and env-free so the browser, the server and scripts/seed-test-data.js all agree. Call it
// per request rather than once at module load: a server instance lives across many requests,
// so a value saved at load would still say last week after the rollover.

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

// conference championship weekend - the site doesn't take Super Bowl picks (the root layout
// 404s anything past week 21), so the offseason stays on this week until CURRENT_YEAR changes
const LAST_WEEK = 21;

// calendar dates are handled as midnight UTC, so adding days never runs into a DST change
const toDateString = (date: Date) => date.toISOString().slice(0, 10);

function weekOneStart(season: number): Date {
	// Labor Day is the first Monday in September; week 1 starts two days later
	const septemberFirst = new Date(Date.UTC(season, 8, 1));
	const daysUntilMonday = (1 - septemberFirst.getUTCDay() + 7) % 7;
	return new Date(Date.UTC(season, 8, 1 + daysUntilMonday + 2));
}

// today's date in New York - the week rolls over at midnight ET whatever timezone the server or
// browser is in
function easternDate(now: Date): Date {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: 'America/New_York',
		year: 'numeric',
		month: 'numeric',
		day: 'numeric'
	}).formatToParts(now);
	const part = (type: Intl.DateTimeFormatPartTypes) =>
		Number(parts.find((p) => p.type === type)?.value);

	return new Date(Date.UTC(part('year'), part('month') - 1, part('day')));
}

export function getCurrentWeek(season: number, now: Date = new Date()): number {
	const sinceWeekOne = easternDate(now).getTime() - weekOneStart(season).getTime();
	const week = Math.floor(sinceWeekOne / WEEK_MS) + 1;

	// before the opener the site sits on week 1, so pickem can already show its odds
	return Math.min(Math.max(week, 1), LAST_WEEK);
}

// a week's Wednesday and the next one, as 'YYYY-MM-DD' - the range the-odds-api is asked for games in
export function getWeekDates(season: number, week: number): { start: string; end: string } {
	const start = new Date(weekOneStart(season).getTime() + (week - 1) * WEEK_MS);
	const end = new Date(start.getTime() + WEEK_MS);

	return { start: toDateString(start), end: toDateString(end) };
}
