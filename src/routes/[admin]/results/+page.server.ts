import { prisma } from '$lib/server/prisma';
import type { Actions, PageServerLoad } from '../../archive/$types';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';

import { CURRENT_WEEK } from '$env/static/private';

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
		return fail(400, { message: 'Forbidden', success: false });
	}

	const pmtWeeklyPicks = await prisma.pick.findMany({
		where: {
			year: new Date().getFullYear(),
			week: parseInt(CURRENT_WEEK),
			pmtPersona: true,
			barstoolEmployee: true,
			private: false,
			espnLink: null,
			highlighLink: null
		},
		select: {
			gameId: true,
			homeTeam: true,
			awayTeam: true
		}
	});

	const uniqueGames = [...new Map(pmtWeeklyPicks.map((item) => [item.gameId, item])).values()];

	return {
		pmtWeeklyPicks: uniqueGames
	};
};

export const actions: Actions = {
	addLinks: async (event: any) => {
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

		const gameIds = formData.getAll('gameId');
		const espnLinks = formData.getAll('espnLink');
		const youtubeLinks = formData.getAll('youtubeLink');

		// Build array of objects
		const resultLinks = gameIds.map((gameId: string, i: number) => ({
			gameId: gameId,
			espnLink: espnLinks[i] as string,
			youtubeLink: youtubeLinks[i] as string
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
