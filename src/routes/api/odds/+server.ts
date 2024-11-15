import type { Odds, PickData } from '$lib/utils/types';
import { ODDS_API_KEY } from '$env/static/private';
import { generateId } from 'lucia';
import { CURRENT_WEEK } from '$env/static/private';
import { fullNameToMascot } from '$lib/utils/matching-format';
import { prisma } from '$lib/server/prisma';

const currentWeek = Number(CURRENT_WEEK);

const getDbUserPicks = async (userId: string) => {
	const dbUserPicks: PickData[] = await prisma.pick.findMany({
		where: {
			userId: userId,
			year: new Date().getFullYear(),
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
			gameDate: true,
			marked: true
		}
	});

	return dbUserPicks;
};

export async function GET({ locals }) {
	const { user } = locals;
	let dbUserPicks: PickData[] = [];
	if (user) {
		dbUserPicks = await getDbUserPicks(user.id);
	}

	// this will be the end of Friday or early Sunday
	const date = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
	const dayOfWeek = new Date(date).getDay();
	const bettingOpen = dayOfWeek === 5 || dayOfWeek === 6;
	const showOdds = dayOfWeek !== 0 && dayOfWeek !== 1 && dayOfWeek !== 2;

	// times for testing
	// create 2 javascript dates for 9-8-2024 and 9-9-2024 in the format of 2024-09-08T00:00:00Z
	const commenceTimeFrom = '2024-11-17T00:00:00Z';
	const commenceTimeTo = '2024-11-20T00:00:00Z';

	let oddsDataClean: Odds[] = [];

	// I only want to do this on initial load if there is no odds data,
	// do not need reloading every action, that is what is messing with id's
	// how can I check if there is odds data already?
	if (showOdds) {
		try {
			const odds = await fetch(
				`https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=spreads,totals&oddsFormat=american&bookmakers=draftkings&commenceTimeFrom=${commenceTimeFrom}&commenceTimeTo=${commenceTimeTo}` // &commenceTimeFrom=${commenceTimeFrom}&commenceTimeTo=${commenceTimeTo}
			);
			const oddsData: Odds[] = await odds.json();

			const oddsDataFiltered = oddsData.filter(
				(game) => game.bookmakers.length > 0 && game.bookmakers[0].markets.length > 1
			);

			oddsDataClean = oddsDataFiltered.map((game) => {
				// only this weeks games
				game.bookmakers[0].markets.forEach((market) => {
					market.outcomes = market.outcomes
						.map((outcome) => {
							let id = '';
							if (dbUserPicks.length > 0) {
								dbUserPicks.map((pick) => {
									if (
										pick.homeTeam === fullNameToMascot[game.home_team] &&
										pick.awayTeam === fullNameToMascot[game.away_team] &&
										pick.gameId === game.id &&
										// TODO: need to change this so it is not dependent on the exact number as that might change
										((pick.type === 'totals' &&
											outcome.name ===
												(pick.description.indexOf('Over') > -1 ? 'Over' : 'Under')) ||
											pick.type === 'spread' ||
											(pick.type == 'spreads' && pick.description.indexOf(outcome.name) > -1))
									) {
										id = pick.id;
									}
								});
							}

							return {
								...outcome,
								id,
								sorted: game.away_team === outcome.name ? 1 : 2
							};
						})
						.sort((a, b) => a.sorted - b.sorted);
				});

				return {
					...game,
					id: generateId(36),
					gameId: game.id,
					commence_time: new Date(game.commence_time).toLocaleString('en-US', {
						timeZone: 'America/New_York'
					})
				};
			});
		} catch (error) {
			console.error('error', error);
			return new Response(JSON.stringify({ success: false, message: 'Error fetching odds data' }));
		}
	}

	const res = { odds: oddsDataClean, bettingOpen, showOdds };
	return new Response(JSON.stringify(res));
}
