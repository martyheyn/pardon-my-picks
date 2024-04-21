import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(303, '/');
	}

	// can only bet games for the next 4 days
	const date = new Date();

	// this will be the end of Friday or early Sunday
	// should it be hardcoded, it is not used anywhere else
	// use 6 hours ahead to account for GMT time
	const betStart = new Date('2024-04-17T22:00:00Z');
	const betEnd = new Date('2024-04-21T22:00:00Z');

	let oddsData;
	if (date > betStart && date < betEnd) {
		console.log('betting is open');

		const commenceTimeTo =
			new Date(date.setDate(date.getDate() + 3)).toISOString().split('.')[0] + 'Z';
		console.log(commenceTimeTo);
		const odds = await fetch(
			`https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=fafd95c74a4b8c7284ecd93cb09ef8a3&regions=us&markets=spreads,totals&oddsFormat=american&bookmakers=draftkings&commenceTimeTo=${commenceTimeTo}`
		);
		oddsData = await odds.json();
	}

	return {
		odds: oddsData
	};
};
