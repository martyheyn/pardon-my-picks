import type { Odds, PickForm } from '$lib/utils/types';
import { ODDS_API_KEY } from '$env/static/private';
import { generateId } from 'lucia';
import { CURRENT_WEEK } from '$env/static/private';
import { fullNameToMascot } from '$lib/utils/matching-format';

const getDbUserPicks = async (userId: string) => {
	const dbUserPicks: PickForm[] = await prisma.pick.findMany({
		where: {
			userId: userId,
			year: new Date().getFullYear(),
			week: parseInt(CURRENT_WEEK)
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
	let dbUserPicks: PickForm[] = [];
	if (user) {
		dbUserPicks = await getDbUserPicks(user.id);
	}

	// this will be the end of Friday or early Sunday
	const betStart = new Date('2024-07-31T12:00:00Z');
	const betEnd = new Date('2024-08-15T22:00:00Z');

	// can only bet games for the next 2 days
	// time offset to Eastern Standard Time
	const date = new Date();
	const tzoffset = new Date().getTimezoneOffset() * 60000;
	const commenceTimeFrom = new Date(date.getTime() - tzoffset).toISOString().split('.')[0] + 'Z';
	const commenceTimeTo =
		new Date(
			new Date(date.getTime() - tzoffset).setDate(new Date(date.getTime() - tzoffset).getDate() + 1)
		)
			.toISOString()
			.split('.')[0] + 'Z';

	let oddsDataClean: Odds[] = [];

	// I only want to do this on initial load if there is no odds data,
	// do not need reloading every action, that is what is messing with id's
	// how can I check if there is odds data already?
	if (date > betStart && date < betEnd) {
		try {
			const odds = await fetch(
				`https://api.the-odds-api.com/v4/sports/baseball_mlb/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=spreads,totals&oddsFormat=american&bookmakers=draftkings&commenceTimeFrom=${commenceTimeFrom}&commenceTimeTo=${commenceTimeTo}`
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
							// console.log('dbUserPicks', dbUserPicks);
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
											(pick.type === 'spread' &&
												outcome.point ===
													parseFloat(
														pick.description.split(' ')[pick.description.split(' ').length - 1]
													)))
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
					id: generateId(15),
					gameId: game.id,
					commence_time: new Date(game.commence_time).toLocaleString('en-US', {
						timeZone: 'America/New_York'
					})
				};
			});
		} catch (error) {
			console.log('error', error);
			return new Response(JSON.stringify({ success: false, message: 'Error fetching odds data' }));
		}
	}

	const res = { odds: oddsDataClean };
	return new Response(JSON.stringify(res));
}
