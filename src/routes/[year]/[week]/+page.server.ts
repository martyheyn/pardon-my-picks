import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	return {
		picks: await prisma.pick.findMany({
			where: {
				week: parseInt(params.week),
				year: parseInt(params.year)
			}
		})
	};
};

export const actions: Actions = {
	fadePick: async ({ url }) => {
		const id = url.searchParams.get('id');
		if (!id) {
			return fail(400, { message: 'Invalid request' });
		}

		await prisma.pick.update({
			where: { id: parseInt(id) },
			data: {
				fade: {
					increment: 1
				}
			}
		});
	},

	tailPick: async ({ url }) => {
		const id = url.searchParams.get('id');
		if (!id) {
			return fail(400, { message: 'Invalid request' });
		}

		await prisma.pick.update({
			where: { id: parseInt(id) },
			data: {
				tail: {
					increment: 1
				}
			}
		});
	}
};
