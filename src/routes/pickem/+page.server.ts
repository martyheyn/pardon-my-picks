import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { fail } from '@sveltejs/kit';
import { generateId } from 'lucia';
import { z } from 'zod';
import { zod } from 'sveltekit-superforms/adapters';

import { ODDS_API_KEY } from '$env/static/private';
import type { Odds } from '$lib/utils/types';
import { type $Enums } from '@prisma/client';

import { CURRENT_WEEK } from '$env/static/private';

// import

// TODO: make the teams emuns and the type 'spread' or 'total'
// Define the schema for the PickForm object
const PickFormObjectSchema = z.object({
	show: z.string(),
	type: z.enum(['spread', 'totals']),
	description: z.string(),
	homeTeam: z.custom<$Enums.NFLTeam>(),
	awayTeam: z.custom<$Enums.NFLTeam>()
});

// // Define the schema for an array of PickForm objects
const PickFormSchema = z.array(PickFormObjectSchema);

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/');
	}

	// initialize forms
	// const form = await superValidate(zod(PickFormSchema));
	let oddsDataClean: Odds[] = [];

	// can only bet games for the next 4 days
	const date = new Date();

	// this will be the end of Friday or early Sunday
	// should it be hardcoded, it is not used anywhere else
	// use 6 hours ahead to account for GMT time
	const betStart = new Date('2024-06-10T12:00:00Z');
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
			oddsDataClean = oddsDataFiltered.map((game) => {
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
		} catch (error) {
			console.log('error', error);
			return {
				error: error
			};
		}
	}

	return { user: locals.user, odds: oddsDataClean };
};

export const actions: Actions = {
	default: async (event) => {
		// throw error if user is not logged in
		const { user, session } = event.locals;
		if (!user) {
			return fail(401, {
				message: 'Unauthorized!! Gotta create an account to make a pick buddy',
				success: false
			});
		}

		// get all the user input, or only one input at a time?
		const formData = await event.request.formData();
		const picksJson = formData.get('userPicks');

		if (typeof picksJson !== 'string') {
			return {
				status: 400,
				body: { success: false, error: 'Invalid data format' }
			};
		}

		const parsedPicks = JSON.parse(picksJson);
		// Validate the data using Zod
		try {
			const result = PickFormSchema.safeParse(parsedPicks);
			if (!result.success) {
				return {
					status: 400,
					body: { success: false, error: result.error }
				};
			}

			const picks = result.data;
			console.log('picks', picks);

			// check if user has already made either
			const pickUser = await prisma.user.findMany({
				where: {
					id: user.id
				}
			});

			console.log('pickUser', pickUser);

			// TODO: update pick funcctionality, whole new UI and server action
			try {
				picks.forEach(async (pick) => {
					console.log('pick in loop', pick);
					await prisma.pick.create({
						data: {
							id: generateId(15),
							year: new Date().getFullYear(),
							show: 'PMT',
							week: parseInt(CURRENT_WEEK),
							person: user.username,
							type: pick.type,
							description: pick.description,
							league: 'NFL',
							homeTeam: pick.homeTeam,
							awayTeam: pick.awayTeam,
							isLive: false,
							private: false,
							userId: user.id,
							barstoolEmployee: false,
							pmtPersona: false
						}
					});
				});
			} catch (error) {
				console.error('error', error);
				return fail(500, { message: 'Error making picks', success: false });
			}
		} catch (error) {
			if (error instanceof z.ZodError) {
				return {
					status: 400,
					body: { success: false, error: error.errors }
				};
			}
			console.error('error', error);
		}

		return {
			message: 'You have made this weeks picks! Good luck and godspeed',
			success: true
		};
	}
};
