import type { Odds } from '$lib/utils/types';
import { fullNameToMascot } from '$lib/utils/matching-format';

// the same feed scripts/mark-games.js grades from and live-scores.ts reads scores from.
// enable=odds adds the sportsbook line to each game
const ESPN_EVENTS_URL = 'https://partners.api.espn.com/v2/sports/football/nfl/events';

// the parts of ESPN's events response the odds and pick-entry flows read
export type EspnEvent = {
	id: string;
	date: string;
	competitions: Array<{
		status?: { type?: { state?: 'pre' | 'in' | 'post'; completed?: boolean } };
		competitors: Array<{
			homeAway: 'home' | 'away';
			team: { displayName: string };
		}>;
		odds?: Array<{
			provider?: { name?: string };
			// the line in sportsbook form, e.g. "NYG -1.5"
			details?: string;
			overUnder?: number;
			// always the home team's line: -1.5 when the home team is favored by 1.5
			spread?: number;
		}>;
	}>;
};

const DAY_MS = 24 * 60 * 60 * 1000;

// a UTC midnight -> ESPN's 'YYYYMMDD'
const toEspnDate = (date: Date) => date.toISOString().slice(0, 10).replaceAll('-', '');

// getWeekDates gives a week as its Wednesday and the next Wednesday. ESPN's dates param is an
// inclusive range of Eastern calendar days, so asking for Wednesday through Wednesday would pull in
// the next week's Wednesday game too (Christmas lands on one some years) - stop at the Tuesday
export function espnWeekDateRange(weekDates: { start: string; end: string }): string {
	const start = new Date(`${weekDates.start}T00:00:00Z`);
	const lastDay = new Date(new Date(`${weekDates.end}T00:00:00Z`).getTime() - DAY_MS);

	return `${toEspnDate(start)}-${toEspnDate(lastDay)}`;
}

// throws on a bad response - the callers each have their own way of telling the user it failed
export async function fetchEspnEvents(dateRange: string): Promise<EspnEvent[]> {
	const res = await fetch(`${ESPN_EVENTS_URL}?dates=${dateRange}&limit=1000&enable=odds`);
	if (!res.ok) throw new Error(`ESPN events request failed: ${res.status}`);

	const json = await res.json();
	if (!Array.isArray(json?.events)) throw new Error('ESPN events response had no events list');

	return json.events;
}

// one game by its ESPN event id, or null if ESPN doesn't know it. ESPN answers 404 for an unknown
// id and 400 for one that isn't an ESPN id at all, like the-odds-api's ids on picks saved before
// the switch or a pickem tab left open across it
export async function fetchEspnEvent(eventId: string): Promise<EspnEvent | null> {
	const res = await fetch(`${ESPN_EVENTS_URL}/${encodeURIComponent(eventId)}?enable=odds`);
	if (res.status === 404 || res.status === 400) return null;
	if (!res.ok) throw new Error(`ESPN event request failed: ${res.status}`);

	const json = await res.json();
	return json?.event ?? null;
}

// a game's spread and total in the shape the pickem board reads. null when there's no usable line
// yet, or when it isn't a regular NFL matchup (the Pro Bowl's AFC/NFC aren't in fullNameToMascot)
export function espnEventToOdds(event: EspnEvent): Odds | null {
	const competition = event.competitions[0];
	if (!competition) return null;

	const home = competition.competitors.find((c) => c.homeAway === 'home');
	const away = competition.competitors.find((c) => c.homeAway === 'away');
	if (!home || !away) return null;
	if (!fullNameToMascot[home.team.displayName] || !fullNameToMascot[away.team.displayName]) {
		return null;
	}

	// DraftKings is what the show's lines have always come from, and ESPN lists it first anyway
	const odds =
		competition.odds?.find((o) => o.provider?.name === 'DraftKings') ?? competition.odds?.[0];
	if (!odds || typeof odds.spread !== 'number' || typeof odds.overUnder !== 'number') return null;

	const homeSpread = odds.spread;
	// a pick'em line is 0, and -0 would print as "-0" on the board
	const awaySpread = homeSpread === 0 ? 0 : -homeSpread;

	return {
		id: event.id,
		gameId: event.id,
		home_team: home.team.displayName,
		away_team: away.team.displayName,
		// ESPN sends "2026-11-13T01:15Z" with no seconds - same instant, in the format gameDate uses
		commence_time: new Date(event.date).toISOString(),
		markets: [
			{
				key: 'spreads',
				// away first, the order the board lists teams in
				outcomes: [
					{ id: '', name: away.team.displayName, point: awaySpread },
					{ id: '', name: home.team.displayName, point: homeSpread }
				]
			},
			{
				key: 'totals',
				outcomes: [
					{ id: '', name: 'Over', point: odds.overUnder },
					{ id: '', name: 'Under', point: odds.overUnder }
				]
			}
		]
	};
}
