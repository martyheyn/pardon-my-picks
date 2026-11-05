import { error, redirect } from '@sveltejs/kit';
import { CURRENT_YEAR } from '$env/static/private';
import { prisma } from '$lib/server/prisma';
import { matchHostSlug, parseSeason, resolveHosts, type Season } from '$lib/config/hosts';
import { computeSeasonStats } from '$lib/utils/host-stats';

// one query for the whole season - host pages, cards and the bot all start here so their numbers match.
// Same filters as the stats page, so records line up with it
export async function getSeasonStats(year: number) {
	const picks = await prisma.pick.findMany({
		where: {
			year,
			pmtPersona: true,
			barstoolEmployee: true
		}
	});

	const stats = computeSeasonStats(picks);
	const hosts = resolveHosts(stats.standings.map((host) => host.person));

	return { picks, stats, hosts };
}

// every season a host made picks in, newest first - the season switcher on their page
export async function getHostSeasons(person: string): Promise<Season[]> {
	const currentYear = Number(CURRENT_YEAR);
	const years = await prisma.pick.groupBy({
		by: ['year'],
		where: {
			person,
			year: { lte: currentYear },
			pmtPersona: true,
			barstoolEmployee: true
		},
		orderBy: { year: 'desc' }
	});

	return years.map(({ year }) => ({ year, isCurrent: year === currentYear }));
}

// anything that couldn't be a host slug (wp-login.php and friends) 404s without a db query
const SLUG_PATTERN = /^[a-z0-9-]+$/i;

// the host a url slug points at, in the season from the ?year= param (the current one when it's
// missing). An unknown slug, or a host with no picks that season, throws a 404 listing the season's
// hosts. An alias or odd casing redirects to `pathFor(canonicalSlug)`
export async function getHostSeason(
	slug: string,
	yearParam: string | null,
	pathFor: (slug: string) => string
) {
	if (!SLUG_PATTERN.test(slug)) error(404, { message: 'Not found' });

	const season = parseSeason(yearParam, Number(CURRENT_YEAR));
	if (!season) error(404, { message: 'Not found' });

	const seasonStats = await getSeasonStats(season.year);
	const match = matchHostSlug(slug, seasonStats.hosts);

	if (!match) {
		error(404, {
			message: 'Not found',
			hosts: seasonStats.hosts.map((host) => ({ slug: host.slug, displayName: host.displayName }))
		});
	}

	if (!match.canonical) redirect(301, pathFor(match.host.slug));

	// hosts are built from the standings, so every matched host has a row
	const hostStats = seasonStats.stats.standings.find((host) => host.person === match.host.person);
	if (!hostStats) error(404, { message: 'Not found' });

	return { ...seasonStats, season, host: match.host, hostStats };
}
