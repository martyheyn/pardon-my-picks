import type { Actions, PageServerLoad } from './$types';
import { generateId } from 'lucia';
import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import type { PicksWithTailsAndFades, Scores } from '$lib/utils/types';
import { getLiveGames, getTeamScores } from '$lib/utils/live-scores';
import { CURRENT_WEEK, CURRENT_YEAR } from '$env/static/private';

const dayOfWeek = new Date().getDay();
const bettingOpen = dayOfWeek === 5 || dayOfWeek === 6;

export const load: PageServerLoad = async ({ params, locals }) => {
	const picks: PicksWithTailsAndFades[] = await prisma.pick.findMany({
		where: {
			week: parseInt(params.week),
			year: parseInt(params.year),
			pmtPersona: true,
			barstoolEmployee: true
		},
		include: {
			tail: true,
			fade: true
		}
	});

	// only get live scores on Sunday
	if (dayOfWeek === 0) {
		console.log('getting live scores');
		const scoresLive = await getLiveGames({ year: params.year });
		console.log('scoresLive', scoresLive);

		scoresLive.map(async (game: Scores) => {
			await prisma.pick.updateMany({
				where: {
					gameId: game.id
				},
				data: {
					isLive: false,
					homeTeamScore: await getTeamScores(game, game.home_team),
					awayTeamScore: await getTeamScores(game, game.away_team)
				}
			});
		});
	}

	return {
		picks,
		user: locals.user,
		bettingOpen
	};
};

export const actions: Actions = {
	fadePick: async ({ url, locals }) => {
		const id = url.searchParams.get('id');
		const week = url.searchParams.get('week');
		const year = url.searchParams.get('year');

		if (!id) {
			return fail(400, { message: 'Invalid request', success: false });
		}

		let pickId: string = id;
		if (!pickId) {
			return fail(400, { message: 'Invalid request', success: false });
		}

		// throw error if user is not logged in
		if (!locals.user) {
			return fail(401, {
				message: 'Unauthorized!! Gotta create an account to fade a pick buddy',
				success: false,
				pickId
			});
		}

		if (!bettingOpen) {
			return fail(401, {
				message: 'Can only fade picks Friday and Saturday',
				success: false,
				pickId
			});
		}

		if (week !== CURRENT_WEEK || year !== CURRENT_YEAR) {
			return fail(401, {
				message: 'Please only fade picks from this current week pal',
				success: false,
				pickId
			});
		}

		// check if user has already faded this pick
		const fade = await prisma.fade.findMany({
			where: {
				pickId: pickId,
				userId: locals.user.id
			}
		});

		// unfade the pick if the user has already faded it
		if (fade.length > 0) {
			if (locals.user.id !== fade[0].userId) {
				return fail(401, {
					message: 'Unauthorized!!',
					success: false,
					pickId
				});
			}

			await prisma.fade.delete({
				where: {
					id: fade[0].id
				}
			});
			return { pickId };
		}

		try {
			// check if the user has already tailed this pick
			// find the tailId using the pickId and userId
			const tail = await prisma.tail.findMany({
				where: {
					pickId: pickId,
					userId: locals.user.id
				}
			});
			if (tail.length > 0) {
				await prisma.tail.delete({
					where: {
						id: tail[0].id
					}
				});
			}

			// just for now, get the pick to fill in if its a winner or not
			const pick = await prisma.pick.findUnique({
				where: {
					id: pickId
				}
			});

			await prisma.fade.create({
				data: {
					id: generateId(36),
					userId: locals.user.id,
					pickId: pickId,
					winner: pick?.winner ? (pick?.winner ? 0 : 1) : null,
					push: pick?.push ? (pick?.push === 1 ? 1 : 0) : null
				}
			});
		} catch (error) {
			console.error('error', error);
			return fail(500, { message: 'Error fading pick', success: false, pickId });
		}

		return {
			message: 'Faded! You faded this pick',
			success: true,
			pickId
		};
	},

	tailPick: async ({ url, locals }) => {
		const id = url.searchParams.get('id');
		const week = url.searchParams.get('week');
		const year = url.searchParams.get('year');
		if (!id) {
			return fail(400, { message: 'Invalid request', success: false });
		}

		let pickId: string = id;
		if (!pickId) {
			return fail(400, { message: 'Invalid request', success: false });
		}

		// throw error if user is not logged in
		if (!locals.user) {
			return fail(401, {
				message: 'Unauthorized!! Gotta create an account to tail a pick big dawg',
				success: false,
				pickId
			});
		}

		if (!bettingOpen) {
			return fail(401, {
				message: 'Can only tail picks Friday and Saturday',
				success: false,
				pickId
			});
		}

		if (week !== CURRENT_WEEK || year !== CURRENT_YEAR) {
			return fail(401, {
				message: 'Please only tail picks from this current week guy',
				success: false,
				pickId
			});
		}

		// check if user has already tailed this pick
		const tail = await prisma.tail.findMany({
			where: {
				pickId: pickId,
				userId: locals.user.id
			}
		});

		// untail the pick if the user has already tailed it
		if (tail.length > 0) {
			if (locals.user.id !== tail[0].userId) {
				return fail(401, {
					message: 'Unauthorized!!',
					success: false,
					pickId
				});
			}

			await prisma.tail.delete({
				where: {
					id: tail[0].id
				}
			});
			return { pickId };
		}

		try {
			// check if the user has already fadeed this pick
			// find the fadeId using the pickId and userId
			const fade = await prisma.fade.findMany({
				where: {
					pickId: pickId,
					userId: locals.user.id
				}
			});
			if (fade.length > 0) {
				await prisma.fade.delete({
					where: {
						id: fade[0].id
					}
				});
			}

			// just for now, get the pick to fill in if its a winner or not
			const pick = await prisma.pick.findUnique({
				where: {
					id: pickId
				}
			});

			// TODO:: make a function to go back and update the tail winner if the pick wins
			await prisma.tail.create({
				data: {
					id: generateId(36),
					userId: locals.user.id,
					pickId: pickId,
					winner: pick?.winner ? (pick?.winner === 1 ? 1 : 0) : null,
					push: pick?.push ? (pick?.push === 1 ? 1 : 0) : null
				}
			});
		} catch (error) {
			console.error('error', error);
			return fail(500, { message: 'Error tailing pick', success: false, pickId });
		}

		return {
			message: 'Tailed pick',
			success: true,
			pickId
		};
	}
};
