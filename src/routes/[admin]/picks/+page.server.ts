import { prisma } from '$lib/server/prisma';
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { generateSecureRandomString } from '$lib/utils/helpers';
import { type $Enums } from '@prisma/client';
import type { Odds } from '$lib/utils/types';

import { fullNameToMascot, mascotToFullName } from '$lib/utils/matching-format';

import { ODDS_API_KEY } from '$env/static/private';
import { CURRENT_WEEK } from '$env/static/private';
import { CURRENT_YEAR } from '$env/static/private';

type EspnEvent = {
	id: string;
	date: string;
	status?: { type?: { completed?: boolean } };
	competitions: Array<{
		competitors: Array<{
			homeAway: 'home' | 'away';
			team: { displayName: string };
		}>;
	}>;
};

// the fields the pick-creation flow needs, whether they came from the-odds-api or ESPN
type GameInfo = {
	id: string;
	home_team: string;
	away_team: string;
	commence_time: string;
	completed?: boolean;
};

const PickDataObjectSchema = z.object({
	person: z.string(),
	type: z.enum(['spreads', 'totals']),
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
		throw redirect(303, '/');
	}

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
				message: 'Unauthorized brah!!',
				success: false
			});
		}

		if (user.role !== 'admin') {
			return fail(403, {
				message: 'Forbidden',
				success: false
			});
		}

		// get all the user input, or only one input at a time?
		const formData = await event.request.formData();

		const commenceTimeFromRaw = formData.getAll('commenceTimeFrom').toString();
		const commenceTimeToRaw = formData.getAll('commenceTimeTo').toString();
		const commenceTimeFrom = `${commenceTimeFromRaw}T00:00:00Z`;
		const commenceTimeTo = `${commenceTimeToRaw}T00:00:00Z`;

		const person = formData.getAll('person') as string[];
		const type = formData.getAll('betType') as string[];
		const teamNames = formData.getAll('teamName') as string[];
		const overUnders = formData.getAll('overUnder') as string[];
		const points = formData.getAll('points') as string[];

		// Build array of objects
		const picks = teamNames.map((team, i) => ({
			person: person[i],
			type: type[i],
			pickTeam: fullNameToMascot[team] as $Enums.NFLTeam,
			pickTotalType: overUnders[i] !== '' ? overUnders[i] : undefined,
			pickScore: parseFloat(points[i])
		}));

		// rows where no team was chosen are personas sitting out that bet this week
		const filledPicks = picks.filter((pick) => pick.pickTeam);
		console.log('filledPicks', filledPicks);

		// Validate the data using Zod
		try {
			const result = PickDataSchema.safeParse(filledPicks);
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

			// the-odds-api only lists games that haven't kicked off yet, so once a game
			// starts it disappears from that feed - fall back to ESPN's schedule (same
			// source scripts/mark-games.js already uses to grade results) so picks can
			// still be entered for games already in progress
			let espnEvents: EspnEvent[] | null = null;
			const getEspnEvents = async (): Promise<EspnEvent[]> => {
				if (espnEvents) return espnEvents;
				const espnDatesFrom = commenceTimeFromRaw.replaceAll('-', '');
				const espnDatesTo = commenceTimeToRaw.replaceAll('-', '');
				const espnRes = await fetch(
					`https://partners.api.espn.com/v2/sports/football/nfl/events?dates=${espnDatesFrom}-${espnDatesTo}&limit=1000`
				);
				const espnJson = await espnRes.json();
				const events: EspnEvent[] = espnJson.events ?? [];
				espnEvents = events;
				return events;
			};

			const findEspnGameForTeam = (events: EspnEvent[], team: string): GameInfo | null => {
				const event = events.find((e) =>
					e.competitions[0]?.competitors.some((c) => fullNameToMascot[c.team.displayName] === team)
				);
				if (!event) return null;

				const home = event.competitions[0].competitors.find((c) => c.homeAway === 'home');
				const away = event.competitions[0].competitors.find((c) => c.homeAway === 'away');
				if (!home || !away) return null;

				return {
					id: event.id,
					home_team: home.team.displayName,
					away_team: away.team.displayName,
					commence_time: event.date,
					completed: event.status?.type?.completed ?? false
				};
			};

			try {
				for (let i = 0; i < filledPicks.length; i++) {
					const pick = filledPicks[i];
					console.log('pick.pickTeam', pick.pickTeam);
					let gameOdds: GameInfo | undefined = weeklyOddsGames.filter(
						(game) =>
							fullNameToMascot[game.home_team] === pick.pickTeam ||
							fullNameToMascot[game.away_team] === pick.pickTeam
					)[0];
					console.log('gameOdds', gameOdds);

					if (!gameOdds) {
						const events = await getEspnEvents();
						const espnMatch = findEspnGameForTeam(events, pick.pickTeam as string);

						if (!espnMatch) {
							return fail(400, {
								message: 'Could not find this game in the odds API or the ESPN schedule',
								success: false
							});
						}

						if (espnMatch.completed) {
							return fail(400, { message: 'Game has already finished', success: false });
						}

						gameOdds = espnMatch;
					}

					let description;
					if (pick.type === 'spreads') {
						description = `${mascotToFullName[pick.pickTeam]} ${
							pick.pickScore > 0 ? `+${pick.pickScore}` : pick.pickScore
						}`;
					} else {
						// pickTotalType is always set for totals bets - the form requires choosing over/under
						const totalType = pick.pickTotalType as string;
						description = `${gameOdds.home_team} vs ${gameOdds.away_team} ${totalType
							.charAt(0)
							.toUpperCase()}${totalType.slice(1)} ${pick.pickScore}`;
					}

					// commence_time is already UTC (both the-odds-api and ESPN send a trailing Z) and
					// game_date is timestamptz, so store it as-is - shifting by the server's timezone
					// offset makes the saved kickoff depend on which machine runs this action
					const gameDate = new Date(gameOdds.commence_time);

					await prisma.pick.create({
						data: {
							id: generateSecureRandomString(18),
							gameId: gameOdds.id,
							year: parseInt(CURRENT_YEAR),
							show: 'PMT',
							week: parseInt(CURRENT_WEEK),
							person: pick.person,
							type: pick.type,
							description: description,
							league: 'NFL',
							homeTeam: fullNameToMascot[gameOdds.home_team] as $Enums.NFLTeam,
							awayTeam: fullNameToMascot[gameOdds.away_team] as $Enums.NFLTeam,
							isLive: false,
							completed: false,
							marked: false,
							pickTeam: pick.pickTotalType ? null : pick?.pickTeam,
							pickTotalType: pick.pickTotalType ? (pick?.pickTotalType as $Enums.TotalType) : null,
							pickScore: pick.pickScore,
							gameDate: gameDate,
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
