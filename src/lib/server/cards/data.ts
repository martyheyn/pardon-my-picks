import { createHash } from 'node:crypto';
import type { HostConfig, Season } from '$lib/config/hosts';
import {
	chronological,
	formatRecord,
	type HostStats,
	type SeasonStats,
	type StatsPick,
	weekFade
} from '$lib/utils/host-stats';
import {
	hostHeadline,
	ordinal,
	shortPickLabel,
	standingLine,
	streakLabel,
	worstPickLine
} from '$lib/utils/host-copy';
import { logo, personaAvatarPath, personaImgPath } from '$lib/utils/matching-format';
import { loadPngImage, loadStaticImage } from './assets';
import type { HostCardData } from './templates/host-card';
import type { FridayFadeData, FridayFadePick } from './templates/friday-fade';
import type { WeeklyStandingsData } from './templates/weekly-standings';

// turns season stats into what each card template draws

// bump when a card's design changes, so share urls change and scrapers pick up the new look
export const CARD_VERSION = 2;

// everything on the host card except the persona art - cheap to build, so the host page can hash
// it for the card url without loading any images
export type HostCardFields = Omit<HostCardData, 'persona'>;

export const nameLookup = (hosts: HostConfig[]) => (person: string) =>
	hosts.find((host) => host.person === person)?.displayName ?? person;

const lastRank = (stats: SeasonStats<StatsPick>) =>
	stats.standings[stats.standings.length - 1]?.rank ?? 1;

const isTied = (host: HostStats<StatsPick>, stats: SeasonStats<StatsPick>) =>
	stats.standings.some((other) => other.person !== host.person && other.rank === host.rank);

export function hostCardFields(
	host: HostStats<StatsPick>,
	stats: SeasonStats<StatsPick>,
	hosts: HostConfig[],
	season: Season
): HostCardFields {
	const nameOf = nameLookup(hosts);
	const displayName = nameOf(host.person);
	const place = `${isTied(host, stats) ? 'T-' : ''}${ordinal(host.rank)}`;
	const finish = `${place} of ${stats.standings.length}`;

	return {
		displayName,
		eyebrow: season.isCurrent
			? `${season.year} season · ${finish}`
			: `${season.year} season · Finished ${finish}`,
		record: formatRecord(host.record),
		winPct: host.winPct === null ? null : `${Math.round(host.winPct * 100)}%`,
		// a one-pick streak isn't much of a streak, and a finished season has no streak going
		streak:
			season.isCurrent && host.streak && host.streak.count >= 2 ? streakLabel(host.streak) : null,
		headline: hostHeadline(host, displayName),
		standingLine: standingLine(host, lastRank(stats), nameOf),
		worstPickLine: worstPickLine(host.worstPick)
	};
}

// changes whenever anything drawn on the card changes - goes on the card url as ?v= so a new
// record means a new url, and the CDN and link previews can't hang on to a stale image
export function hostCardVersion(fields: HostCardFields): string {
	return createHash('sha1')
		.update(JSON.stringify({ CARD_VERSION, fields }))
		.digest('hex')
		.slice(0, 10);
}

export async function hostCardData(fields: HostCardFields, person: string): Promise<HostCardData> {
	return { ...fields, persona: await loadPngImage(personaImgPath(person)) };
}

async function fridayPick(pick: StatsPick): Promise<FridayFadePick> {
	const teams = pick.pickTotalType ? [pick.awayTeam, pick.homeTeam] : [pick.pickTeam];
	const logos = await Promise.all(teams.map((team) => (team ? loadStaticImage(logo[team]) : null)));
	return {
		label: shortPickLabel(pick),
		logos: logos.filter((src): src is string => src !== null)
	};
}

// every host's picks for the week, with whoever's in last place on the season marked as the fade -
// unless the admin set the week to no fade (callFade false), when nobody is marked. Hosts sitting
// the week out are left off
export async function fridayFadeData(
	week: number,
	weekPicks: StatsPick[],
	stats: SeasonStats<StatsPick>,
	hosts: HostConfig[],
	callFade: boolean
): Promise<FridayFadeData> {
	const nameOf = nameLookup(hosts);
	const { playing, fade } = weekFade(stats, weekPicks, { callFade });

	const rows = await Promise.all(
		playing.map(async (host) => ({
			displayName: nameOf(host.person),
			record: formatRecord(host.record),
			avatar: await loadStaticImage(personaAvatarPath(host.person)),
			picks: await Promise.all(
				chronological(weekPicks.filter((pick) => pick.person === host.person)).map(fridayPick)
			),
			isFade: host === fade
		}))
	);

	return {
		eyebrow: `Week ${week} · ${callFade ? 'Who to fade' : 'The picks'}`,
		headline: fade
			? `FADE ${nameOf(fade.person).toUpperCase()}: ${formatRecord(fade.record)} THIS SEASON`
			: `WEEK ${week} PICKS ARE IN`,
		rows
	};
}

// season standings after the latest fully graded week, with that week's worst host called out.
// null until a week has been fully graded
export async function weeklyStandingsData(
	year: number,
	stats: SeasonStats<StatsPick>,
	hosts: HostConfig[]
): Promise<WeeklyStandingsData | null> {
	const week = stats.latestCompletedWeek;
	if (week === null) return null;

	const nameOf = nameLookup(hosts);
	const leaderPoints = stats.standings[0]?.points ?? 0;
	const worst = stats.worstWeek;
	const worstHost = stats.standings.find((host) => host.person === worst?.person);

	const rows = await Promise.all(
		stats.standings.map(async (host) => {
			const weekRecord = host.lastWeek?.record ?? { wins: 0, losses: 0, pushes: 0 };
			const played = weekRecord.wins + weekRecord.losses + weekRecord.pushes > 0;
			const weekNet = weekRecord.wins - weekRecord.losses;

			return {
				rank: `${isTied(host, stats) ? 'T' : ''}${host.rank}`,
				displayName: nameOf(host.person),
				avatar: await loadStaticImage(personaAvatarPath(host.person)),
				seasonRecord: formatRecord(host.record),
				weekRecord: played ? formatRecord(weekRecord) : '—',
				weekTone: weekNet > 0 ? 'good' : weekNet < 0 ? 'bad' : 'even',
				gap: host.rank === 1 ? '—' : `${leaderPoints - host.points}`,
				isWorstWeek: host.person === worst?.person
			} as const;
		})
	);

	return {
		eyebrow: `Week ${week} is graded · ${year} standings`,
		headline:
			worst && worstHost
				? `${nameOf(worst.person).toUpperCase()} WENT ${formatRecord(worst.record)} IN WEEK ${week}`
				: `WEEK ${week} STANDINGS`,
		subline: worstHost ? standingLine(worstHost, lastRank(stats), nameOf) : null,
		weekLabel: `Week ${week}`,
		rows
	};
}
