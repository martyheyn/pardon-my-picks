import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

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
	const betStart = new Date('2024-06-09T12:00:00Z');
	const betEnd = new Date('2024-06-12T22:00:00Z');

	if (date > betStart && date < betEnd) {
		console.log('betting is open');

		const commenceTimeTo =
			new Date(date.setDate(date.getDate() + 3)).toISOString().split('.')[0] + 'Z';
		console.log(commenceTimeTo);

		try {
			const odds = await fetch(
				`https://api.the-odds-api.com/v4/sports/baseball_mlb/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=spreads,totals&oddsFormat=american&bookmakers=draftkings&commenceTimeTo=${commenceTimeTo}`
			);
			const oddsData: Odds[] = await odds.json();
			const oddsDataFiltered = oddsData.filter(
				(game) => game.bookmakers.length > 0 && game.bookmakers[0].markets.length > 1
			);
			const oddsDataClean = oddsDataFiltered.map((game) => {
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

export const actions: Actions = {
	addPick: async ({ url, locals }) => {
		// throw error if user is not logged in
		if (!locals.user) {
			return fail(401, {
				message: 'Unauthorized!! Gotta create an account to make a pick buddy',
				success: false
			});
		}

		// check if user has already made picks
		const user = await prisma.user.findMany({
			where: {
				id: locals.user.id
			}
		});

		// TODO: update pick funcctionality, whole new UI and server action
		try {
			// await prisma.pick.create({
			// data: {
			// userId: locals.user.id,
			// pickId: pickId,
			// winner: pick?.winner ? false : true,
			// push: pick?.push && pick?.push === 1 ? true : false
			// }
			// });
		} catch (error) {
			console.error('error', error);
			return fail(500, { message: 'Error making picks', success: false });
		}

		return {
			message: 'You have made this weeks picks! Good luck and godspeed',
			success: true
		};
	}
};
