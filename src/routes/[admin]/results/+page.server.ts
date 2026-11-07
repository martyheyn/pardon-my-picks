import { prisma } from '$lib/server/prisma';
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';

// scripts/mark-games.js fills in links for games from the last 14 days, so this page lists what
// it couldn't over the same window
const LOOKBACK_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

const resultLinksSchema = z.object({
	gameId: z.string(),
	espnLink: z.string(),
	youtubeLink: z.string()
});

// // Define the schema for an array of PickData objects
const ResultLinksSchema = z.array(resultLinksSchema);

export const load: PageServerLoad = async ({ locals }: { locals: App.Locals }) => {
	const { user } = locals;

	if (!user) {
		throw redirect(303, '/');
	}

	if (user.role !== 'admin') {
		throw redirect(303, '/');
	}

	// the manual fallback for games the grading run couldn't link - usually a box score that's in
	// and highlights it never matched, so a game missing either link is listed, with what it has
	// already filled in. Only games that have kicked off: there's nothing to link before that
	const now = new Date();
	const pmtWeeklyPicks = await prisma.pick.findMany({
		where: {
			pmtPersona: true,
			barstoolEmployee: true,
			private: false,
			gameDate: { lte: now, gt: new Date(now.getTime() - LOOKBACK_DAYS * DAY_MS) },
			OR: [{ espnLink: null }, { espnLink: '' }, { highlighLink: null }, { highlighLink: '' }]
		},
		select: {
			gameId: true,
			homeTeam: true,
			awayTeam: true,
			espnLink: true,
			highlighLink: true
		},
		orderBy: { gameDate: 'asc' }
	});

	const uniqueGames = [...new Map(pmtWeeklyPicks.map((item) => [item.gameId, item])).values()];

	return {
		pmtWeeklyPicks: uniqueGames
	};
};

export const actions: Actions = {
	addLinks: async (event) => {
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

		const gameIds = formData.getAll('gameId') as string[];
		const espnLinks = formData.getAll('espnLink') as string[];
		const youtubeLinks = formData.getAll('youtubeLink') as string[];

		// Build array of objects
		const resultLinks = gameIds.map((gameId, i) => ({
			gameId,
			espnLink: espnLinks[i],
			youtubeLink: youtubeLinks[i]
		}));

		// Now you’ve got clean JSON
		const resultLinksJson = JSON.stringify(resultLinks);

		if (typeof resultLinksJson !== 'string') {
			return fail(400, {
				message: 'Invalid data format',
				success: false
			});
		}

		const parsedResultLinksJson = JSON.parse(resultLinksJson);
		console.log('parsedResultLinksJson', parsedResultLinksJson);

		// Validate the data using Zod
		try {
			const result = ResultLinksSchema.safeParse(parsedResultLinksJson);
			if (!result.success) {
				return fail(400, {
					message: result.error.toString(),
					success: false
				});
			}

			const rL = result.data;

			try {
				for (let i = 0; i < rL.length; i++) {
					console.log('rL[i]', rL[i]);

					await prisma.pick.updateMany({
						where: {
							gameId: rL[i].gameId,
							barstoolEmployee: true,
							pmtPersona: true
						},
						data: {
							espnLink: rL[i].espnLink,
							highlighLink: rL[i].youtubeLink
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
