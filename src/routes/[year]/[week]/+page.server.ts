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

	console.log('locals', locals);

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

		let pickId: string;
		// santize id
		try {
			pickId = id;
		} catch (error) {
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

			await prisma.fade.create({
				data: {
					id: generateId(15),
					userId: locals.user.id,
					pickId: pickId
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

		let pickId: string;
		// santize id
		try {
			pickId = id;
		} catch (error) {
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

			await prisma.tail.create({
				data: {
					id: generateId(15),
					userId: locals.user.id,
					pickId: pickId
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
