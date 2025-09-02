import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';

import { ODDS_API_KEY } from '$env/static/private';
import type { Odds } from '$lib/utils/types';
import { prisma } from '$lib/server/prisma';
import { type $Enums } from '@prisma/client';
import { type PickData } from '$lib/utils/types';

import { fullNameToMascot } from '$lib/utils/matching-format';

import { CURRENT_WEEK } from '$env/static/private';

// TODO: make the teams emuns and the type 'spread' or 'total'
// Define the schema for the PickData object
const PickDataObjectSchema = z.object({
	id: z.string(),
	gameId: z.string().optional(),
	show: z.string(),
	type: z.enum(['spread', 'totals']),
	description: z.string(),
	homeTeam: z.custom<$Enums.NFLTeam>(),
	awayTeam: z.custom<$Enums.NFLTeam>(),
	marked: z.boolean(),
	pickTeam: z.custom<$Enums.NFLTeam>() || null,
	pickScore: z.number().optional(),
	pickTotalType: z.enum(['over', 'under']).optional(),
	gameDate: z.string().optional()
});

// // Define the schema for an array of PickData objects
const PickDataSchema = z.array(PickDataObjectSchema);

// const DeletePickSchema = z.object({
// 	pickId: z.string(),
// 	usersPicks: z.array(PickDataObjectSchema)
// });

const date = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
const dayOfWeek = new Date(date).getDay();
const bettingOpen = dayOfWeek !== 0 && dayOfWeek !== 1;

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;

	return {
		user: user ? true : false
	};
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

		if (!bettingOpen) {
			return fail(400, {
				message: 'Betting is open Tuesday - Saturday',
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
			const result = PickDataSchema.safeParse(parsedPicks);
			if (!result.success) {
				return {
					status: 400,
					body: { success: false, error: result.error }
				};
			}

			const picks: PickData[] = result.data;

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

			try {
				for (let i = 0; i < picks.length; i++) {
					// add in data from odds api
					const gameOddsRes = await fetch(
						`https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=spreads,totals&oddsFormat=american&bookmakers=draftkings&eventIds=${picks[i].gameId}`
					);
					const gameOddsJson: Odds[] = await gameOddsRes.json();
					const gameOdds = gameOddsJson[0];

					const tzoffset = new Date().getTimezoneOffset() * 60000;
					const dt = new Date(gameOdds.commence_time);
					let estGameDate = new Date(dt.getTime() - tzoffset).toISOString().split('.')[0] + 'Z';

					if (new Date(estGameDate) < new Date()) {
						return fail(400, { message: 'Game has already started', success: false });
					}

					const pickType = picks[i].type === 'spread' ? 'spreads' : 'totals';
					const betTypeData = gameOdds.bookmakers[0].markets.find(
						(market) => market.key === pickType
					);
					if (!betTypeData) {
						return fail(400, { message: 'Invalid pick', success: false });
					}

					const betData = betTypeData?.outcomes.find((outcome) => {
						return betTypeData.key === 'spreads'
							? fullNameToMascot[outcome.name] === picks[i].pickTeam
							: outcome.name.toLocaleLowerCase() === picks[i].pickTotalType?.toLocaleLowerCase();
					});
					if (!betData) {
						return fail(400, { message: 'Invalid pick', success: false });
					}

					await prisma.pick.create({
						data: {
							id: picks[i].id,
							gameId: gameOdds.id,
							year: new Date().getFullYear(),
							show: 'PMT',
							week: parseInt(CURRENT_WEEK),
							person: user.username,
							type: pickType,
							description: picks[i].description,
							league: 'NFL',
							homeTeam: fullNameToMascot[gameOdds.home_team] as $Enums.NFLTeam,
							awayTeam: fullNameToMascot[gameOdds.away_team] as $Enums.NFLTeam,
							isLive: false,
							completed: false,
							marked: false,
							pickTeam: picks[i]?.pickTeam,
							pickTotalType: picks[i]?.pickTotalType,
							pickScore: betData?.point,
							gameDate: estGameDate,
							private: false,
							userId: user.id,
							barstoolEmployee: false,
							pmtPersona: false
						}
					});
				}

				return {
					message: 'You have made this weeks picks! Good luck and godspeed',
					picks,
					success: true
				};
			} catch (error) {
				console.error('error', error);
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
				message: 'Unauthorized!! Go on and create an account',
				success: false
			});
		}

		const formData = await event.request.formData();
		const pickId = formData.get('pickId') as string;
		const usersPicksRaw = formData.get('usersPicks');

		if (typeof usersPicksRaw !== 'string') {
			return fail(400, { message: 'Invalid request', success: false });
		}
		const usersPicks: PickData[] = JSON.parse(usersPicksRaw);

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

		// if the pick does not exist fail
		if (!pick) {
			return fail(500, { message: 'Pick not found', success: false });
		}

		// if the user is not the owner of the pick fail
		if (pick.userId !== user.id) {
			return fail(401, { message: 'Unauthorized', success: false });
		}

		let picks: PickData[] = [];

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
					marked: true
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
