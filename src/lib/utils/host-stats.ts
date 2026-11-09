import type { $Enums } from '@prisma/client';
import { normalizePickType } from './helpers';

// every number about the hosts' picks - host pages, share cards and the X bot - is worked out here,
// so they can't drift apart. Nothing in this file touches the db; src/lib/server/host-stats.ts
// loads the picks and hands them in

// the Pick fields the stats read. Full prisma rows fit this, so findMany results can be passed
// straight in and come back out on worstPick with all their fields
export type StatsPick = {
	id: string;
	person: string;
	week: number | null;
	type: string;
	homeTeam: $Enums.NFLTeam;
	awayTeam: $Enums.NFLTeam;
	homeTeamScore: number | null;
	awayTeamScore: number | null;
	pickTeam: $Enums.NFLTeam | null;
	pickTotalType: $Enums.TotalType | null;
	pickScore: number | null;
	winner: number | null;
	push: number | null;
	gameDate: Date | string | null;
	createdAt: Date | string | null;
};

export type Outcome = 'W' | 'L' | 'P';

export type WinLossPush = {
	wins: number;
	losses: number;
	pushes: number;
};

export type Streak = {
	outcome: 'W' | 'L';
	count: number;
};

export type WorstPick<P extends StatsPick> = {
	pick: P;
	// whatever WORST_PICK_SCORE returned for it - by default, how many points it missed the line by
	missedBy: number;
};

export type PersonAhead = {
	// 'behind': this host trails `person` by `gap`
	// 'chased-by': this host is in 1st and `person` is `gap` back
	// 'tied': this host shares 1st with `person`
	relation: 'behind' | 'chased-by' | 'tied';
	person: string;
	gap: number;
};

export type HostStats<P extends StatsPick> = {
	person: string;
	record: WinLossPush;
	winPct: number | null;
	points: number;
	rank: number;
	personAhead: PersonAhead | null;
	worstPick: WorstPick<P> | null;
	// the record you'd have taking the other side of every pick
	fadeRecord: WinLossPush;
	// fade wins minus fade losses
	fadeNet: number;
	lastWeek: { week: number; record: WinLossPush } | null;
	streak: Streak | null;
};

export type WeekResult = {
	person: string;
	week: number;
	record: WinLossPush;
	// total points the host's losses that week missed their lines by
	lossMargin: number;
};

export type SeasonStats<P extends StatsPick> = {
	// every host, best first
	standings: HostStats<P>[];
	latestCompletedWeek: number | null;
	worstWeek: WeekResult | null;
};

// same rules as the stats page: a pick counts once it has a winner, and a loss is any graded pick
// that isn't a win or a push
export function pickOutcome(pick: Pick<StatsPick, 'winner' | 'push'>): Outcome | null {
	if (pick.winner === null) return null;
	if (pick.winner === 1) return 'W';
	if (pick.push === 1) return 'P';
	return 'L';
}

export function tallyRecord(picks: Pick<StatsPick, 'winner' | 'push'>[]): WinLossPush {
	const record = { wins: 0, losses: 0, pushes: 0 };
	for (const pick of picks) {
		const outcome = pickOutcome(pick);
		if (outcome === 'W') record.wins++;
		if (outcome === 'L') record.losses++;
		if (outcome === 'P') record.pushes++;
	}
	return record;
}

// pushes left out, same as the stats page. null until there's a win or a loss to divide by
export function winPct(record: WinLossPush): number | null {
	const decisions = record.wins + record.losses;
	return decisions === 0 ? null : record.wins / decisions;
}

// the homepage race (api/race-results) ranks hosts by wins plus half a point per push - standings
// use the same scoring so a host's rank here matches where they sit in the race
export function standingsPoints(record: WinLossPush): number {
	return record.wins + record.pushes * 0.5;
}

// 23–31, or 23–31–2 once there's a push
export function formatRecord(record: WinLossPush): string {
	const base = `${record.wins}–${record.losses}`;
	return record.pushes > 0 ? `${base}–${record.pushes}` : base;
}

export function fadeOf(record: WinLossPush): WinLossPush {
	return { wins: record.losses, losses: record.wins, pushes: record.pushes };
}

// how far the pick cleared (positive) or missed (negative) its line, from the picker's side.
// null when the game has no final score yet or the pick doesn't line up with the game's teams
export function coverMargin(pick: StatsPick): number | null {
	if (pick.homeTeamScore === null || pick.awayTeamScore === null || pick.pickScore === null) {
		return null;
	}

	const type = normalizePickType(pick.type);
	if (type === 'spreads') {
		// pickScore is the line for the picked team, e.g. -3.5 when laying 3.5
		if (pick.pickTeam === pick.homeTeam) {
			return pick.homeTeamScore - pick.awayTeamScore + pick.pickScore;
		}
		if (pick.pickTeam === pick.awayTeam) {
			return pick.awayTeamScore - pick.homeTeamScore + pick.pickScore;
		}
		return null;
	}

	if (type === 'totals') {
		const total = pick.homeTeamScore + pick.awayTeamScore;
		if (pick.pickTotalType === 'over') return total - pick.pickScore;
		if (pick.pickTotalType === 'under') return pick.pickScore - total;
	}

	return null;
}

// decides which loss is a host's "worst pick" - bigger is worse. Swap this out to change the
// definition everywhere. Defaults to how many points the pick missed its line by
export const WORST_PICK_SCORE = (pick: StatsPick): number | null => {
	const margin = coverMargin(pick);
	return margin === null ? null : -margin;
};

const toTime = (date: Date | string | null) => (date === null ? 0 : new Date(date).getTime());

// oldest first, by kickoff, then by when the pick was entered
export function chronological<P extends StatsPick>(picks: P[]): P[] {
	return [...picks].sort(
		(a, b) =>
			toTime(a.gameDate ?? a.createdAt) - toTime(b.gameDate ?? b.createdAt) ||
			toTime(a.createdAt) - toTime(b.createdAt)
	);
}

// losses only. When two misses score the same, the more recent one wins
export function findWorstPick<P extends StatsPick>(
	picks: P[],
	score: (pick: StatsPick) => number | null = WORST_PICK_SCORE
): WorstPick<P> | null {
	let worst: WorstPick<P> | null = null;
	for (const pick of chronological(picks)) {
		if (pickOutcome(pick) !== 'L') continue;
		const missedBy = score(pick);
		if (missedBy === null) continue;
		if (worst === null || missedBy >= worst.missedBy) {
			worst = { pick, missedBy };
		}
	}
	return worst;
}

// pushes are skipped over, so they neither extend nor break a streak
export function currentStreak(picks: StatsPick[]): Streak | null {
	const decided = chronological(picks)
		.map(pickOutcome)
		.filter((outcome): outcome is 'W' | 'L' => outcome === 'W' || outcome === 'L');
	if (decided.length === 0) return null;

	const outcome = decided[decided.length - 1];
	let count = 0;
	for (let i = decided.length - 1; i >= 0 && decided[i] === outcome; i--) {
		count++;
	}
	return { outcome, count };
}

// a week is done once it has picks and every one of them is graded. Grading is run by hand, so
// this is how the stats tell a finished week from one still waiting on results
export function completedWeeks(picks: StatsPick[]): number[] {
	const gradedByWeek = new Map<number, boolean>();
	for (const pick of picks) {
		if (pick.week === null) continue;
		const graded = pickOutcome(pick) !== null;
		gradedByWeek.set(pick.week, (gradedByWeek.get(pick.week) ?? true) && graded);
	}

	return [...gradedByWeek.entries()]
		.filter(([, allGraded]) => allGraded)
		.map(([week]) => week)
		.sort((a, b) => a - b);
}

export function latestCompletedWeek(picks: StatsPick[]): number | null {
	const weeks = completedWeeks(picks);
	return weeks.length > 0 ? weeks[weeks.length - 1] : null;
}

// total points a set of losses missed their lines by
function totalLossMargin(picks: StatsPick[]): number {
	let total = 0;
	for (const pick of picks) {
		if (pickOutcome(pick) !== 'L') continue;
		const margin = coverMargin(pick);
		if (margin !== null) total += -margin;
	}
	return total;
}

const distinctPersons = (picks: StatsPick[]) => [...new Set(picks.map((pick) => pick.person))];

// worst wins-minus-losses that week. Ties go to whoever's losses missed by more, then by name so
// the answer never depends on row order
export function worstWeek(picks: StatsPick[], week: number): WeekResult | null {
	const weekPicks = picks.filter((pick) => pick.week === week);
	const results: WeekResult[] = distinctPersons(weekPicks).map((person) => {
		const personPicks = weekPicks.filter((pick) => pick.person === person);
		return {
			person,
			week,
			record: tallyRecord(personPicks),
			lossMargin: totalLossMargin(personPicks)
		};
	});

	results.sort(
		(a, b) =>
			a.record.wins - a.record.losses - (b.record.wins - b.record.losses) ||
			b.lossMargin - a.lossMargin ||
			a.person.localeCompare(b.person)
	);
	return results[0] ?? null;
}

type StandingsRow = {
	person: string;
	record: WinLossPush;
	points: number;
	rank: number;
};

// most points first, then fewest losses, then by name. Hosts with the same points share a rank
export function buildStandings(picks: StatsPick[]): StandingsRow[] {
	const rows = distinctPersons(picks).map((person) => {
		const record = tallyRecord(picks.filter((pick) => pick.person === person));
		return { person, record, points: standingsPoints(record), rank: 0 };
	});

	rows.sort(
		(a, b) =>
			b.points - a.points || a.record.losses - b.record.losses || a.person.localeCompare(b.person)
	);

	rows.forEach((row, i) => {
		row.rank = i > 0 && rows[i - 1].points === row.points ? rows[i - 1].rank : i + 1;
	});
	return rows;
}

export function personAhead(
	standings: Pick<StandingsRow, 'person' | 'points' | 'rank'>[],
	person: string
): PersonAhead | null {
	const index = standings.findIndex((row) => row.person === person);
	if (index === -1 || standings.length < 2) return null;
	const row = standings[index];

	if (row.rank === 1) {
		const tiedWith = standings.find((other) => other.person !== person && other.rank === 1);
		if (tiedWith) return { relation: 'tied', person: tiedWith.person, gap: 0 };

		// alone in 1st means this host is standings[0], so the chaser is right behind
		const chaser = standings[1];
		return { relation: 'chased-by', person: chaser.person, gap: row.points - chaser.points };
	}

	// the closest host with a better rank - skips anyone tied with this host
	const ahead = standings
		.slice(0, index)
		.reverse()
		.find((other) => other.rank < row.rank);
	if (!ahead) return null;
	return { relation: 'behind', person: ahead.person, gap: ahead.points - row.points };
}

export type WeekFade<P extends StatsPick> = {
	// the hosts with a pick this week, best first. Hosts sitting the week out are left off
	playing: HostStats<P>[];
	// whoever's last on the season among them - null until they have a win or a loss to fade, and in
	// a week the admin set to no fade
	fade: HostStats<P> | null;
};

// who to fade this week - the Friday card and the bot's post both ask here so they name the same host.
// callFade is the admin's choice for the week on /admin/x-post: false means nobody is marked
export function weekFade<P extends StatsPick>(
	stats: SeasonStats<P>,
	weekPicks: Pick<StatsPick, 'person'>[],
	{ callFade = true }: { callFade?: boolean } = {}
): WeekFade<P> {
	const playing = stats.standings.filter((host) =>
		weekPicks.some((pick) => pick.person === host.person)
	);
	if (!callFade) return { playing, fade: null };

	const lastPlace = playing[playing.length - 1];
	const hasDecisions = lastPlace && lastPlace.record.wins + lastPlace.record.losses > 0;
	return { playing, fade: hasDecisions ? lastPlace : null };
}

export function computeSeasonStats<P extends StatsPick>(picks: P[]): SeasonStats<P> {
	const standings = buildStandings(picks);
	const lastCompleted = latestCompletedWeek(picks);

	return {
		standings: standings.map((row) => {
			const personPicks = picks.filter((pick) => pick.person === row.person);
			const fadeRecord = fadeOf(row.record);

			return {
				person: row.person,
				record: row.record,
				winPct: winPct(row.record),
				points: row.points,
				rank: row.rank,
				personAhead: personAhead(standings, row.person),
				worstPick: findWorstPick(personPicks),
				fadeRecord,
				fadeNet: fadeRecord.wins - fadeRecord.losses,
				lastWeek:
					lastCompleted === null
						? null
						: {
								week: lastCompleted,
								record: tallyRecord(personPicks.filter((pick) => pick.week === lastCompleted))
							},
				streak: currentStreak(personPicks)
			};
		}),
		latestCompletedWeek: lastCompleted,
		worstWeek: lastCompleted === null ? null : worstWeek(picks, lastCompleted)
	};
}
