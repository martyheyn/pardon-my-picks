import type { PageServerLoad } from './$types';
import { hostPath } from '$lib/config/hosts';
import { getHostSeason, getHostSeasons } from '$lib/server/host-stats';
import { hostCardFields, hostCardVersion } from '$lib/server/cards/data';
import { hostCard } from '$lib/server/cards/templates/host-card';
import { chronological, coverMargin, formatRecord, pickOutcome } from '$lib/utils/host-stats';
import {
	ogDescription,
	ogTitle,
	ordinal,
	standingLine,
	streakLabel,
	worstPickLine
} from '$lib/utils/host-copy';

export const load: PageServerLoad = async ({ params, url }) => {
	const { picks, stats, hosts, season, host, hostStats } = await getHostSeason(
		params.host,
		url.searchParams.get('year'),
		// keeps ?year=, so an alias for an old season lands on that season
		(slug) => `/${slug}${url.search}`
	);
	const hostSeasons = await getHostSeasons(host.person);

	const nameOf = (person: string) =>
		hosts.find((other) => other.person === person)?.displayName ?? person;

	const fields = hostCardFields(hostStats, stats, hosts, season);
	const cardYear = season.isCurrent ? '' : `year=${season.year}&`;
	const cardUrl = `/${host.slug}/card.png?${cardYear}v=${hostCardVersion(fields)}`;

	// newest first, for the pick history
	const history = chronological(picks.filter((pick) => pick.person === host.person))
		.reverse()
		.map((pick) => ({
			id: pick.id,
			week: pick.week,
			description: pick.description,
			outcome: pickOutcome(pick),
			margin: coverMargin(pick),
			homeTeam: pick.homeTeam,
			awayTeam: pick.awayTeam,
			homeTeamScore: pick.homeTeamScore,
			awayTeamScore: pick.awayTeamScore,
			specialBet: pick.specialBet
		}));

	return {
		season,
		host: { slug: host.slug, displayName: host.displayName },
		// every season this host has a page for, for the switcher
		seasons: hostSeasons.map((other) => ({
			year: other.year,
			href: hostPath(host.slug, other)
		})),
		cardUrl,
		summary: {
			record: formatRecord(hostStats.record),
			winPct: hostStats.winPct,
			rank: ordinal(hostStats.rank),
			hostCount: stats.standings.length,
			fadeRecord: formatRecord(hostStats.fadeRecord),
			fadeNet: hostStats.fadeNet,
			lastWeek: hostStats.lastWeek && {
				week: hostStats.lastWeek.week,
				record: formatRecord(hostStats.lastWeek.record)
			},
			// a finished season has no streak going
			streak: season.isCurrent ? streakLabel(hostStats.streak) : null,
			standingLine: standingLine(
				hostStats,
				stats.standings[stats.standings.length - 1]?.rank ?? 1,
				nameOf
			),
			worstPickLine: worstPickLine(hostStats.worstPick)
		},
		history,
		// everyone else that season, in standings order
		otherHosts: stats.standings
			.filter((other) => other.person !== host.person)
			.map((other) => {
				const slug = hosts.find((config) => config.person === other.person)?.slug ?? '';
				return {
					slug,
					href: hostPath(slug, season),
					displayName: nameOf(other.person),
					record: formatRecord(other.record)
				};
			}),
		meta: {
			title: ogTitle(hostStats, host.displayName, season),
			description: ogDescription(hostStats, host.displayName, season),
			url: `${url.origin}${hostPath(host.slug, season)}`,
			image: {
				url: `${url.origin}${cardUrl}`,
				width: hostCard.width,
				height: hostCard.height,
				alt: `${host.displayName}'s ${season.year} picks: ${formatRecord(hostStats.record)}`
			}
		}
	};
};
