import type { Odds, PickData } from '$lib/utils/types';
import {
	generateSecureRandomString,
	getDayOfWeek,
	hasGameStarted,
	isBettingOpen
} from '$lib/utils/helpers';
import { CURRENT_YEAR } from '$env/static/private';
import { fullNameToMascot } from '$lib/utils/matching-format';
import { getCurrentWeek, getWeekDates } from '$lib/utils/nfl-week';
import { espnEventToOdds, espnWeekDateRange, fetchEspnEvents } from '$lib/utils/espn';
import { prisma } from '$lib/server/prisma';

const getDbUserPicks = async (userId: string, currentWeek: number) => {
	const dbUserPicks: PickData[] = await prisma.pick.findMany({
		where: {
			userId: userId,
			year: parseInt(CURRENT_YEAR),
			week: currentWeek
		},
		select: {
			id: true,
			gameId: true,
			show: true,
			type: true,
			description: true,
			homeTeam: true,
			awayTeam: true,
			pickTeam: true,
			gameDate: true,
			marked: true
		}
	});

	return dbUserPicks;
};

export async function GET({ locals }) {
	const { user } = locals;
	const currentWeek = getCurrentWeek(Number(CURRENT_YEAR));
	let dbUserPicks: PickData[] = [];
	if (user) {
		dbUserPicks = await getDbUserPicks(user.id, currentWeek);
	}

	// this will be the end of Friday or early Sunday
	const bettingOpen = isBettingOpen(getDayOfWeek());
	// const showOdds = dayOfWeek !== 0 && dayOfWeek !== 1 && dayOfWeek !== 2;

	const weekDates = getWeekDates(Number(CURRENT_YEAR), currentWeek);

	let oddsDataClean: Odds[] = [];

	try {
		const events = await fetchEspnEvents(espnWeekDateRange(weekDates));

		// games without a line yet come back null and are left off the board, same as kicked-off ones
		const upcomingGames = events
			.map(espnEventToOdds)
			.filter((game): game is Odds => game !== null && !hasGameStarted(game.commence_time));

		oddsDataClean = upcomingGames.map((game) => {
			game.markets.forEach((market) => {
				market.outcomes = market.outcomes.map((outcome) => {
					// matched on teams rather than gameId - a matchup only happens once a week, and picks
					// saved before the switch to ESPN carry the-odds-api's game id
					const savedPick = dbUserPicks.find(
						(pick) =>
							pick.homeTeam === fullNameToMascot[game.home_team] &&
							pick.awayTeam === fullNameToMascot[game.away_team] &&
							((pick.type === 'totals' &&
								outcome.name === (pick.description.indexOf('Over') > -1 ? 'Over' : 'Under')) ||
								(pick.type === 'spreads' && pick.pickTeam === fullNameToMascot[outcome.name]))
					);

					return { ...outcome, id: savedPick ? savedPick.id : '' };
				});
			});

			// commence_time stays a UTC ISO string - a locale string like "10/25/2026, 8:20:00 PM" drops
			// the timezone, so the browser would read it as its own local time
			return { ...game, id: generateSecureRandomString(18) };
		});
	} catch (error) {
		console.error('error', error);
		return new Response(JSON.stringify({ success: false, message: 'Error fetching odds data' }));
	}

	const res = { odds: oddsDataClean, bettingOpen };
	return new Response(JSON.stringify(res));
}
