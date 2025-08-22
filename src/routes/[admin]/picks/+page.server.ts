import type { Actions, PageServerLoad } from '../../archive/$types';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { generateSecureRandomString } from '$lib/utils/helpers';
import { type $Enums } from '@prisma/client';
import type { Odds } from '$lib/utils/types';

import { fullNameToMascot, mascotToFullName } from '$lib/utils/matching-format';

import { ODDS_API_KEY } from '$env/static/private';
import { CURRENT_WEEK } from '$env/static/private';

const PickDataObjectSchema = z.object({
	person: z.string(),
	type: z.enum(['spread', 'totals']),
	pickTeam: z.custom<$Enums.NFLTeam>().optional(),
	pickScore: z.number().optional(),
	pickTotalType: z.enum(['over', 'under']).optional()
});

// // Define the schema for an array of PickData objects
const PickDataSchema = z.array(PickDataObjectSchema);

export const load: PageServerLoad = async ({ locals }: { locals: App.Locals }) => {
	const { user } = locals;

	if (!user) {
		throw redirect(303, '/');
	}

	if (user.role !== 'admin') {
		return fail(400, { message: 'Forbidden', success: false });
	}

	return {
		user: user ? true : false
	};
};

export const actions: Actions = {
	addPicks: async (event: any) => {
		// throw error if user is not logged in
		const { user } = event.locals;
		if (!user) {
			return fail(401, {
				message: 'Unauthorized brah!!',
				success: false
			});
		}

		// get all the user input, or only one input at a time?
		const formData = await event.request.formData();

		const commenceTimeFrom = `${formData.getAll('commenceTimeFrom')}T00:00:00Z`;
		const commenceTimeTo = `${formData.getAll('commenceTimeTo')}T00:00:00Z`;

		const person = formData.getAll('person');
		const type = formData.getAll('betType');
		const teamNames = formData.getAll('teamName');
		const overUnders = formData.getAll('overUnder');
		const points = formData.getAll('points');

		// Build array of objects
		const picks = teamNames.map((team: string, i: number) => ({
			person: person[i] as string,
			type: type[i] as string,
			pickTeam: fullNameToMascot[team] as $Enums.NFLTeam,
			pickTotalType: Array.isArray(overUnders)
				? overUnders[i] !== ''
					? (overUnders[i] as string)
					: undefined
				: (formData.get('overUnder') as string) || undefined,
			pickScore: parseFloat(points[i])
		}));

		// Now you’ve got clean JSON
		const picksJson = JSON.stringify(picks);

		if (typeof picksJson !== 'string') {
			return fail(400, {
				message: 'Invalid data format',
				success: false
			});
		}

		const parsedPicks = JSON.parse(picksJson);
		console.log('parsedPicks', parsedPicks);

		// Validate the data using Zod
		try {
			const result = PickDataSchema.safeParse(parsedPicks);
			if (!result.success) {
				return fail(400, {
					message: result.error.toString(),
					success: false
				});
			}

			// add in data from odds api
			const weeklyGameOddsRes = await fetch(
				`https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=spreads,totals&oddsFormat=american&bookmakers=draftkings&commenceTimeFrom=${commenceTimeFrom}&commenceTimeTo=${commenceTimeTo}`
			);
			const weeklyOddsGames: Odds[] = await weeklyGameOddsRes.json();
			console.log('weeklyOddsGames', weeklyOddsGames);

			try {
				for (let i = 0; i < picks.length; i++) {
					console.log('picks[i].pickTeam', picks[i].pickTeam);
					let gameOdds = weeklyOddsGames.filter(
						(game) =>
							fullNameToMascot[game.home_team] === picks[i].pickTeam ||
							fullNameToMascot[game.away_team] === picks[i].pickTeam
					)[0];
					console.log('gameOdds', gameOdds);

					if (!gameOdds) {
						return fail(400, { message: 'ODDS API NOT WORKING', success: false });
					}

					let description;
					if (picks[i].type === 'spread') {
						description = `${mascotToFullName[picks[i].pickTeam]} ${
							picks[i].pickScore > 0 ? `+${picks[i].pickScore}` : picks[i].pickScore
						}`;
					} else {
						description = `${gameOdds.home_team} vs ${gameOdds.away_team} ${picks[i].pickTotalType
							.charAt(0)
							.toUpperCase()}${picks[i].pickTotalType.slice(1)} ${picks[i].pickScore}`;
					}

					const tzoffset = new Date().getTimezoneOffset() * 60000;
					const dt = new Date(gameOdds.commence_time);
					let estGameDate = new Date(dt.getTime() - tzoffset).toISOString().split('.')[0] + 'Z';

					if (new Date(estGameDate) < new Date()) {
						return fail(400, { message: 'Game has already started', success: false });
					}

					await prisma.pick.create({
						data: {
							id: generateSecureRandomString(18),
							gameId: gameOdds.id,
							year: new Date().getFullYear(),
							show: 'PMT',
							week: parseInt(CURRENT_WEEK),
							person: picks[i].person,
							type: picks[i].type,
							description: description,
							league: 'NFL',
							homeTeam: fullNameToMascot[gameOdds.home_team] as $Enums.NFLTeam,
							awayTeam: fullNameToMascot[gameOdds.away_team] as $Enums.NFLTeam,
							isLive: false,
							completed: false,
							marked: false,
							pickTeam: picks[i].pickTotalType ? null : picks[i]?.pickTeam,
							pickTotalType: picks[i].pickTotalType ? picks[i]?.pickTotalType : null,
							pickScore: picks[i].pickScore,
							gameDate: estGameDate,
							private: false,
							userId: null,
							barstoolEmployee: true,
							pmtPersona: true
						}
					});
				}

				return {
					message: 'You have made this weeks picks! Good luck and godspeed',
					success: true
				};
			} catch (error) {
				console.error('error', error);
				return fail(500, { message: 'Error making picks', success: false });
			}
		} catch (error) {
			console.error('error', error);

			if (error instanceof z.ZodError) {
				return fail(400, {
					message: error.errors.toString(),
					success: false
				});
			}
			return fail(500, {
				message: 'Sorry, there was an error making your picks',
				success: false
			});
		}
	}
};
