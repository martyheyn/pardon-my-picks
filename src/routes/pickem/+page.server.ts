import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { ODDS_API_KEY } from '$env/static/private';
import type { Odds } from '$lib/utils/types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/');
	}

	// can only bet games for the next 4 days
	const date = new Date();

	// this will be the end of Friday or early Sunday
	// should it be hardcoded, it is not used anywhere else
	// use 6 hours ahead to account for GMT time
	const betStart = new Date('2024-04-22T22:00:00Z');
	const betEnd = new Date('2024-04-24T22:00:00Z');

	if (date > betStart && date < betEnd) {
		console.log('betting is open');

		const commenceTimeTo =
			new Date(date.setDate(date.getDate() + 3)).toISOString().split('.')[0] + 'Z';
		console.log(commenceTimeTo);

		try {
			const odds = await fetch(
				`https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=spreads,totals&oddsFormat=american&bookmakers=draftkings&commenceTimeTo=${commenceTimeTo}`
			);
			const oddsData: Odds[] = await odds.json();
			const oddsDataClean = oddsData.map((game) => {
				game.bookmakers[0].markets.forEach((market) => {
					market.outcomes = market.outcomes
						.map((outcome) => ({
							...outcome,
							sorted: game.away_team === outcome.name ? 1 : 2
						}))
						.sort((a, b) => a.sorted - b.sorted);
				});
				return game;
			});

			return {
				user: locals.user,
				odds: oddsDataClean
			};
		} catch (error) {
			console.log('error', error);
			return {
				error: error
			};
		}
	}
};