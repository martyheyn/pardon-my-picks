import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { sluglToPersona } from '../../../utils/matching-format';

export const load: PageServerLoad = async ({ params }) => {
	return {
		person: await prisma.pick.groupBy({
			by: ['person'],
			_sum: {
				winner: true,
				fade: true,
				tail: true
			},
			_count: {
				winner: true
			},
			where: {
				person: sluglToPersona(params.person)
			}
		}),
		spreads: await prisma.pick.groupBy({
			by: ['type'],
			_sum: {
				winner: true
			},
			_count: {
				winner: true
			},
			where: {
				person: sluglToPersona(params.person)
			}
		})
	};
};
