import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';

import { ODDS_API_KEY } from '$env/static/private';
import type { Odds } from '$lib/utils/types';
import { prisma } from '$lib/server/prisma';
import { type $Enums, type Prisma } from '@prisma/client';
import { type PickData } from '$lib/utils/types';

import { fullNameToMascot } from '$lib/utils/matching-format';
import {
	getDayOfWeek,
	hasGameStarted,
	isBettingOpen,
	normalizePickType,
	planPickSave
} from '$lib/utils/helpers';

import { CURRENT_WEEK, CURRENT_YEAR } from '$env/static/private';

// TODO: make the teams emuns and the type 'spread' or 'total'
// Define the schema for the PickData object
const PickDataObjectSchema = z.object({
	id: z.string(),
	gameId: z.string().optional(),
	show: z.string(),
	// 'spreads' is how a saved spread pick comes back from the db when it's resubmitted alongside a new pick
	type: z.enum(['spread', 'spreads', 'totals']),
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

		if (!isBettingOpen(getDayOfWeek())) {
			return fail(400, {
				message: 'Betting is open Tuesday - Saturday',
				success: false
			});
		}

		// get all the user input, or only one input at a time?
		const formData = await event.request.formData();
		const picksJson = formData.get('userPicks');

		// these use fail() so the page's alert actually shows the message - a plain { status, body }
		// return is treated as a successful action with no message
		if (typeof picksJson !== 'string') {
			return fail(400, { message: 'Invalid data format', success: false });
		}

		const parsedPicks = JSON.parse(picksJson);

		// Validate the data using Zod
		const result = PickDataSchema.safeParse(parsedPicks);
		if (!result.success) {
			return fail(400, {
				message: 'Something is off with those picks, refresh the page and try again',
				success: false
			});
		}

		const picks: PickData[] = result.data;

		try {
			// check if user has already made either pick
			const userDbPicks = await prisma.user.findUnique({
				where: {
					id: user.id
				},
				include: {
					picks: {
						where: {
							week: parseInt(CURRENT_WEEK),
							year: parseInt(CURRENT_YEAR)
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

			const plan = planPickSave(userDbPicks.picks, picks);
			if (!plan.ok) {
				return fail(400, { message: plan.message, success: false });
			}

			// look up and check every new pick before writing anything, so a bad second pick fails the
			// whole save instead of leaving the user with their old picks deleted and only one new one
			const picksToCreate: Prisma.PickUncheckedCreateInput[] = [];
			for (const pick of plan.newPicks) {
				// add in data from odds api
				const gameOddsRes = await fetch(
					`https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=spreads,totals&oddsFormat=american&bookmakers=draftkings&eventIds=${pick.gameId}`
				);
				const gameOddsJson: Odds[] = await gameOddsRes.json();
				const gameOdds = gameOddsJson[0];

				if (!gameOdds) {
					return fail(400, { message: 'Odds not available for this game', success: false });
				}

				// commence_time is already UTC and game_date is timestamptz, so store it as-is
				const gameDate = new Date(gameOdds.commence_time);

				if (hasGameStarted(gameDate)) {
					return fail(400, { message: 'Game has already started', success: false });
				}

				const pickType = normalizePickType(pick.type);
				const betTypeData = gameOdds.bookmakers[0].markets.find(
					(market) => market.key === pickType
				);
				if (!pickType || !betTypeData) {
					return fail(400, { message: 'Invalid pick', success: false });
				}

				const betData = betTypeData.outcomes.find((outcome) => {
					return betTypeData.key === 'spreads'
						? fullNameToMascot[outcome.name] === pick.pickTeam
						: outcome.name.toLocaleLowerCase() === pick.pickTotalType?.toLocaleLowerCase();
				});
				if (!betData) {
					return fail(400, { message: 'Invalid pick', success: false });
				}

				picksToCreate.push({
					id: pick.id,
					gameId: gameOdds.id,
					year: parseInt(CURRENT_YEAR),
					show: 'PMT',
					week: parseInt(CURRENT_WEEK),
					person: user.username,
					type: pickType,
					description: pick.description,
					league: 'NFL',
					homeTeam: fullNameToMascot[gameOdds.home_team] as $Enums.NFLTeam,
					awayTeam: fullNameToMascot[gameOdds.away_team] as $Enums.NFLTeam,
					isLive: false,
					completed: false,
					marked: false,
					pickTeam: pick.pickTeam,
					pickTotalType: pick.pickTotalType,
					pickScore: betData.point,
					gameDate: gameDate,
					private: false,
					userId: user.id,
					barstoolEmployee: false,
					pmtPersona: false
				});
			}

			// one transaction, so the delete and the creates either all land or none do
			await prisma.$transaction([
				prisma.pick.deleteMany({
					where: {
						id: { in: plan.deleteIds },
						userId: user.id
					}
				}),
				...picksToCreate.map((data) => prisma.pick.create({ data }))
			]);

			return {
				message: 'You have made this weeks picks! Good luck and godspeed',
				picks,
				success: true
			};
		} catch (error) {
			console.error('error', error);
			return fail(500, { message: 'Error making picks', success: false });
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

		// the Remove button hides after kickoff, but the action has to enforce it too
		if (pick.gameDate && hasGameStarted(pick.gameDate)) {
			return fail(400, {
				message: 'This game already kicked off, you are locked in',
				success: false
			});
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
					year: parseInt(CURRENT_YEAR),
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
