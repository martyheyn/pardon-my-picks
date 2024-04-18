import type { Actions, PageServerLoad } from './$types';
import { generateId } from 'lucia';
import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import { Prisma } from '@prisma/client';

const picksWithTaisAndFades = Prisma.validator<Prisma.PickArgs>()({
	include: {
		tail: true,
		fade: true
	}
});
export type PicksWithTailsAndFades = Prisma.PickGetPayload<typeof picksWithTaisAndFades>;

export const load: PageServerLoad = async ({ params, locals }) => {
	const picks: PicksWithTailsAndFades[] = await prisma.pick.findMany({
		where: {
			week: parseInt(params.week),
			year: parseInt(params.year)
		},
		include: {
			tail: true,
			fade: true
		}
	});

	// can only bet games for the next 4 days

	// if the games have not started yet, get the odds
	const date = new Date();

	// this will be the end of Friday or early Sunday
	// should it be hardcoded, it is not used anywhere else
	// use 6 hours ahead to account for GMT time
	const gamesStart = new Date('2024-04-20T06:00:00Z');

	if (date < gamesStart) {
		const commenceTimeTo =
			new Date(date.setDate(date.getDate() + 3)).toISOString().split('.')[0] + 'Z';

		// DO I want only draft kings? To start yes
		// const odds = await fetch(
		// 	`https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=fafd95c74a4b8c7284ecd93cb09ef8a3&regions=us&markets=spreads,totals&oddsFormat=american&commenceTimeTo=${commenceTimeTo}`
		// );
		// const oddsData = await odds.json();
		// console.log(oddsData);
	} else {
		// get live scores if the games have already started (americanfootball_nfl)
		// const scores = await fetch(
		// 	'https://api.the-odds-api.com/v4/sports/basketball_nba/scores/?daysFrom=1&apiKey=fafd95c74a4b8c7284ecd93cb09ef8a3'
		// );
		// const scoresData = await scores.json();
		// console.log(scoresData);
	}

	return {
		picks,
		user: locals.user
	};
};

export const actions: Actions = {
	fadePick: async ({ url, locals }) => {
		const id = url.searchParams.get('id');
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

		// check if user has already faded this pick
		const fade = await prisma.fade.findMany({
			where: {
				pickId: pickId,
				userId: locals.user.id
			}
		});

		// unfade the pick if the user has already faded it
		if (fade.length > 0) {
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
					id: generateId(15),
					userId: locals.user.id,
					pickId: pickId,
					winner: pick?.winner ? false : true,
					push: pick?.push && pick?.push === 1 ? true : false
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

		// check if user has already tailed this pick
		const tail = await prisma.tail.findMany({
			where: {
				pickId: pickId,
				userId: locals.user.id
			}
		});

		// untail the pick if the user has already tailed it
		if (tail.length > 0) {
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
					id: generateId(15),
					userId: locals.user.id,
					pickId: pickId,
					winner: pick?.winner && pick?.winner === 1 ? true : false,
					push: pick?.push && pick?.push === 1 ? true : false
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
