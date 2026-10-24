import type { Actions, PageServerLoad } from './$types';
import {
	generateSecureRandomString,
	getDayOfWeek,
	hasGameStarted,
	isBettingOpen
} from '$lib/utils/helpers';
import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import type { PicksWithTailsAndFades } from '$lib/utils/types';
import { getLiveGames } from '$lib/utils/live-scores';
import { CURRENT_WEEK, CURRENT_YEAR } from '$env/static/private';

export const load: PageServerLoad = async ({ params, locals }) => {
	const dayOfWeek = getDayOfWeek();
	const bettingOpen = isBettingOpen(dayOfWeek);

	// only get live scores on Sunday
	// runs before the picks query below so this page load shows the scores it just saved
	if (dayOfWeek === 0) {
		try {
			const gameScores = await getLiveGames();

			await Promise.all(
				gameScores.map((game) =>
					prisma.pick.updateMany({
						// matched on teams + week instead of gameId - picks entered through the admin ESPN
						// fallback store ESPN's event id, everything else stores the-odds-api's id, and a
						// matchup only happens once a week. Graded picks are left to mark-games.js
						where: {
							homeTeam: game.homeTeam,
							awayTeam: game.awayTeam,
							year: parseInt(CURRENT_YEAR),
							week: parseInt(CURRENT_WEEK),
							marked: false
						},
						data: {
							homeTeamScore: game.homeTeamScore,
							awayTeamScore: game.awayTeamScore
						}
					})
				)
			);
		} catch (error) {
			console.error('Error updating live scores:', error);
		}
	}

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

		const pickId: string = id;
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

		if (!isBettingOpen(getDayOfWeek())) {
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

		// used to block fades after kickoff, and to fill in the fade's winner if the pick is already graded
		const pick = await prisma.pick.findUnique({
			where: {
				id: pickId
			}
		});

		if (!pick) {
			return fail(404, { message: 'Pick not found', success: false, pickId });
		}

		// checked before the unfade branch too, so a fade can't be pulled once the game is underway
		if (pick.gameDate && hasGameStarted(pick.gameDate)) {
			return fail(401, {
				message: 'This game already kicked off, too late to fade it',
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

			await prisma.fade.create({
				data: {
					id: generateSecureRandomString(18),
					userId: locals.user.id,
					pickId: pickId,
					winner: pick?.winner != null ? (pick.winner === 1 ? 0 : 1) : null,
					push: pick?.push != null ? pick.push : null
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

		const pickId: string = id;
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

		if (!isBettingOpen(getDayOfWeek())) {
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

		// used to block tails after kickoff, and to fill in the tail's winner if the pick is already graded
		const pick = await prisma.pick.findUnique({
			where: {
				id: pickId
			}
		});

		if (!pick) {
			return fail(404, { message: 'Pick not found', success: false, pickId });
		}

		// checked before the untail branch too, so a tail can't be pulled once the game is underway
		if (pick.gameDate && hasGameStarted(pick.gameDate)) {
			return fail(401, {
				message: 'This game already kicked off, too late to tail it',
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

			// TODO:: make a function to go back and update the tail winner if the pick wins
			await prisma.tail.create({
				data: {
					id: generateSecureRandomString(18),
					userId: locals.user.id,
					pickId: pickId,
					winner: pick?.winner != null ? pick.winner : null,
					push: pick?.push != null ? pick.push : null
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
