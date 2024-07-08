import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { generateId } from 'lucia';
import { z } from 'zod';
// import { setError, superValidate } from 'sveltekit-superforms';
// import { zod } from 'sveltekit-superforms/adapters';

import { ODDS_API_KEY } from '$env/static/private';
import type { Odds } from '$lib/utils/types';
import { type $Enums } from '@prisma/client';
import { type PickForm } from '$lib/utils/types';

import { fullNameToMascot } from '$lib/utils/matching-format';

import { CURRENT_WEEK } from '$env/static/private';

// TODO: make the teams emuns and the type 'spread' or 'total'
// Define the schema for the PickForm object
const PickFormObjectSchema = z.object({
	id: z.string(),
	gameId: z.string().optional(),
	show: z.string(),
	type: z.enum(['spread', 'totals']),
	description: z.string(),
	homeTeam: z.custom<$Enums.NFLTeam>(),
	awayTeam: z.custom<$Enums.NFLTeam>()
});

// // Define the schema for an array of PickForm objects
const PickFormSchema = z.array(PickFormObjectSchema);

// const DeletePickSchema = z.object({
// 	pickId: z.string(),
// 	usersPicks: z.array(PickFormObjectSchema)
// });

let uiUserPicks: PickForm[] = [];

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;
	if (!user) {
		redirect(303, '/');
	}

	const dbUserPicks: PickForm[] = await prisma.pick.findMany({
		where: {
			userId: user.id,
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
			awayTeam: true
		}
	});
	console.log('dbUserPicks', dbUserPicks);
	console.log('uiUserPicks', uiUserPicks);

	const userPicks = dbUserPicks.length > 0 ? dbUserPicks : uiUserPicks;

	// initialize forms
	// const form = await superValidate(zod(PickFormSchema));
	let oddsDataClean: Odds[] = [];

	// this will be the end of Friday or early Sunday
	// should it be hardcoded, it is not used anywhere else
	// use 6 hours ahead to account for GMT time
	const betStart = new Date('2024-07-01T12:00:00Z');
	const betEnd = new Date('2024-07-30T22:00:00Z');

	// can only bet games for the next 2 days
	const date = new Date();
	const commenceTimeTo =
		new Date(date.setDate(date.getDate() + 1)).toISOString().split('.')[0] + 'Z';

	if (date > betStart && date < betEnd) {
		console.log('betting is open');

		try {
			const odds = await fetch(
				`https://api.the-odds-api.com/v4/sports/baseball_mlb/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=spreads,totals&oddsFormat=american&bookmakers=draftkings&commenceTimeTo=${commenceTimeTo}`
			);
			const oddsData: Odds[] = await odds.json();
			// console.log('oddsData', JSON.stringify(oddsData, null, 2));

			const oddsDataFiltered = oddsData.filter(
				(game) => game.bookmakers.length > 0 && game.bookmakers[0].markets.length > 1
			);

			// console.log('oddsDataFiltered', JSON.stringify(oddsDataFiltered, null, 2));
			oddsDataClean = oddsDataFiltered.map((game) => {
				game.bookmakers[0].markets.forEach((market) => {
					market.outcomes = market.outcomes
						.map((outcome) => {
							let id = generateId(15);
							// if this odd is already picked by the user, give it the same id
							userPicks.map((up) => {
								if (
									// fullNameToMascot[game.away_team] === up.awayTeam &&
									(up.gameId === game.id ||
										(fullNameToMascot[game.away_team] === up.awayTeam &&
											fullNameToMascot[game.home_team] === up.homeTeam)) &&
									(market.key === 'spreads' ? market.key.slice(0, -1) : market.key) === up.type &&
									// TODO: need to change this so it is not dependent on the exact number as that might change
									(market.key === 'totals'
										? outcome.name === (up.description.indexOf('Over') > -1 ? 'Over' : 'Under')
										: outcome.point ===
										  parseFloat(up.description.split(' ')[up.description.split(' ').length - 1]))
								) {
									id = up.id;
								}
							});

							return {
								...outcome,
								id,
								sorted: game.away_team === outcome.name ? 1 : 2
							};
						})
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

	const savedPicks = dbUserPicks.length > 0 ? true : false;

	return { user: locals.user, odds: oddsDataClean, picks: userPicks, savedPicks };
};

export const actions: Actions = {
	addPicks: async (event) => {
		// throw error if user is not logged in
		const { user } = event.locals;
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

			// check if user has already made either pick
			let userDbPicks = await prisma.user.findUnique({
				where: {
					id: user.id
				},
				include: {
					picks: {
						where: {
							week: parseInt(CURRENT_WEEK),
							year: new Date().getFullYear()
						}
					}
				}
			});

			if (!userDbPicks) {
				return fail(400, {
					message: 'User not found',
					success: false
				});
			}

			// if user has already made picks, clear em out
			if (userDbPicks.picks.length > 0) {
				await prisma.pick.deleteMany({
					where: {
						userId: user.id,
						year: new Date().getFullYear(),
						week: parseInt(CURRENT_WEEK)
					}
				});
			}

			if (picks.length !== 2) {
				return fail(400, {
					message: 'You must make 2 picks per week',
					success: false
				});
			}

			// let newPicks: PickForm[] = [];
			try {
				picks.forEach(async (pick) => {
					let gameId = '';
					const dbGameIds = await prisma.pick.findMany({
						select: {
							gameId: true
						},
						where: {
							week: parseInt(CURRENT_WEEK),
							year: new Date().getFullYear(),
							homeTeam: pick.homeTeam,
							awayTeam: pick.awayTeam
						}
					});
					gameId = dbGameIds[0]?.gameId;

					// can only bet games for the next 4 days
					const date = new Date();
					const commenceTimeTo =
						new Date(date.setDate(date.getDate() + 1)).toISOString().split('.')[0] + 'Z';

					// if the game was not picked by the fellas then search the odds api for it
					// only do this if the game is not already in the db so I'm not making too many calls to the api
					if (dbGameIds.length === 0) {
						const oddsGameIds = await fetch(
							`https://api.the-odds-api.com/v4/sports/baseball_mlb/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=spreads,totals&oddsFormat=american&bookmakers=draftkings&commenceTimeTo=${commenceTimeTo}`
						);
						const oddsGameIdsData: Odds[] = await oddsGameIds.json();
						const oddsGameId = oddsGameIdsData.find(
							(game) =>
								fullNameToMascot[game.away_team] === pick.awayTeam &&
								fullNameToMascot[game.home_team] === pick.homeTeam
						);
						gameId = oddsGameId?.id || '';
					}

					const pickId = generateId(15);

					uiUserPicks.push({
						id: pickId,
						gameId: gameId,
						show: 'PMT',
						type: pick.type,
						description: pick.description,
						homeTeam: pick.homeTeam,
						awayTeam: pick.awayTeam
					});

					await prisma.pick.create({
						data: {
							id: pickId,
							gameId: gameId || '',
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

				return {
					message: 'You have made this weeks picks! Good luck and godspeed',
					picks,
					success: true
				};
			} catch (error) {
				console.error('error', error);
				uiUserPicks = [];
				return fail(500, { message: 'Error making picks', success: false });
			}
		} catch (error) {
			console.error('error', error);

			if (error instanceof z.ZodError) {
				return {
					status: 400,
					body: { success: false, error: error.errors }
				};
			}
			return {
				status: 500,
				body: { success: false, error: 'Sorry, there was an error making your picks' }
			};
		}
	},

	deletePick: async (event) => {
		// throw error if user is not logged in
		const { user } = event.locals;
		if (!user) {
			return fail(401, {
				message: 'Unauthorized!! Gotta create an account to make a pick buddy',
				success: false
			});
		}

		const formData = await event.request.formData();
		const pickId = formData.get('pickId') as string;
		const usersPicksRaw = formData.get('usersPicks');

		if (typeof usersPicksRaw !== 'string') {
			return fail(400, { message: 'Invalid request', success: false });
		}
		const usersPicks: PickForm[] = JSON.parse(usersPicksRaw);

		if (!pickId) {
			return fail(400, { message: 'Invalid request', success: false });
		}

		if (!usersPicks) {
			return fail(500, { message: 'Invalid request', success: false });
		}

		// see if the pick exists
		const pick = await prisma.pick.findUnique({
			where: {
				id: pickId
			}
		});

		// if the pick does not exist, remove on the client side
		if (!pick) {
			const newPicks = usersPicks.filter((p: PickForm) => p.id !== pickId);
			uiUserPicks = newPicks;

			return {
				picks: newPicks
			};
		}

		let picks: PickForm[] = [];

		try {
			console.log('deletingggg pick from db');
			await prisma.pick.delete({
				where: {
					id: pickId
				}
			});

			// get picks for return
			picks = await prisma.pick.findMany({
				where: {
					userId: user.id,
					year: new Date().getFullYear(),
					week: parseInt(CURRENT_WEEK)
				}
			});

			return {
				message: 'Pick deleted',
				picks,
				success: true
			};
		} catch (error) {
			console.error('error', error);
			return fail(500, { message: 'Error deleting pick', success: false });
		}
	}
};
