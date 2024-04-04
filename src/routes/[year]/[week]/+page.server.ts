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
	console.log('locals', locals);
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

	return {
		picks,
		user: locals.user
	};
};

export const actions: Actions = {
	fadePick: async ({ url, locals }) => {
		// throw error if user is not logged in
		if (!locals.user) {
			return fail(401, {
				message: 'Unauthorized!! Gotta create an account to fade a pick buddy',
				success: false
			});
		}

		const id = url.searchParams.get('id');
		if (!id) {
			return fail(400, { message: 'Invalid request', success: false });
		}

		let pickId;
		// santize id
		try {
			pickId = id;
		} catch (error) {
			return fail(400, { message: 'Invalid request', success: false });
		}

		// check if user has already tailed this pick
		const fade = await prisma.pick.findUnique({
			where: {
				id: pickId,
				fade: {
					some: {
						userId: locals.user.id
					}
				}
			}
		});

		if (fade) {
			return fail(400, { message: 'You have already faded this pick bruv', success: false });
		}

		try {
			// check if the user has already tailed this pick
			const tail = await prisma.pick.findUnique({
				where: {
					id: pickId,
					tail: {
						some: {
							userId: locals.user.id
						}
					}
				}
			});
			if (tail) {
				await prisma.tail.delete({
					where: {
						userId: locals.user.id,
						pickId: pickId
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
			return fail(500, { message: 'Error fading pick', success: false });
		}

		return {
			message: 'Faded! You faded this pick',
			success: true
		};
	},

	tailPick: async ({ url, locals }) => {
		// throw error if user is not logged in
		if (!locals.user) {
			return fail(401, {
				message: 'Unauthorized!! Gotta create an account to tail a pick big dawg',
				success: false
			});
		}

		const id = url.searchParams.get('id');
		if (!id) {
			return fail(400, { message: 'Invalid request', success: false });
		}

		let pickId;
		// santize id
		try {
			pickId = id;
		} catch (error) {
			return fail(400, { message: 'Invalid request', success: false });
		}

		// check if user has already tailed this pick
		const tail = await prisma.pick.findFirst({
			where: {
				id: pickId,
				tail: {
					some: {
						userId: locals.user.id
					}
				}
			}
		});

		if (tail) {
			return fail(400, { message: 'You have already tailed this pick brohiem', success: false });
		}

		try {
			// check if the user has already tailed this pick
			const fade = await prisma.pick.findUnique({
				where: {
					id: pickId,
					fade: {
						some: {
							userId: locals.user.id
						}
					}
				}
			});
			if (fade) {
				await prisma.fade.delete({
					where: {
						userId: locals.user.id,
						pickId: pickId
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
			return fail(500, { message: 'Error tailing pick', success: false });
		}

		return {
			message: 'Tailed pick',
			success: true
		};
	}
};
