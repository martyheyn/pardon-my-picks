import type { Actions, PageServerLoad } from './$types';
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

	return {
		picks,
		user: locals.user
	};
};

export const actions: Actions = {
	fadePick: async ({ url, locals }) => {
		// throw error if user is not logged in
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized', success: false });
		}

		const id = url.searchParams.get('id');
		if (!id) {
			return fail(400, { message: 'Invalid request', success: false });
		}

		// check if user has already tailed this pick
		const fade = await prisma.pick.findFirst({
			where: {
				id: parseInt(id),
				fade: {
					some: {
						userId: locals.user.id
					}
				}
			}
		});

		if (fade) {
			return fail(400, { message: 'Already faded', success: false });
		}

		try {
			// check if the user has already tailed this pick
			const tail = await prisma.pick.findUnique({
				where: {
					id: parseInt(id),
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
						pickId: parseInt(id)
					}
				});
			}

			await prisma.fade.create({
				data: {
					userId: locals.user.id,
					pickId: parseInt(id)
				}
			});
		} catch (error) {
			console.log('error', error);
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
			return fail(401, { message: 'Unauthorized', success: false });
		}

		const id = url.searchParams.get('id');
		if (!id) {
			return fail(400, { message: 'Invalid request', success: false });
		}

		// check if user has already tailed this pick
		const tail = await prisma.pick.findFirst({
			where: {
				id: parseInt(id),
				tail: {
					some: {
						userId: locals.user.id
					}
				}
			}
		});

		if (tail) {
			return fail(400, { message: 'Already tailed', success: false });
		}

		try {
			// check if the user has already tailed this pick
			const fade = await prisma.pick.findUnique({
				where: {
					id: parseInt(id),
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
						pickId: parseInt(id)
					}
				});
			}

			await prisma.tail.create({
				data: {
					userId: locals.user.id,
					pickId: parseInt(id)
				}
			});
		} catch (error) {
			console.log('error', error);
			return fail(500, { message: 'Error tailing pick', success: false });
		}

		return {
			message: 'Tailed pick',
			success: true
		};
	}
};
