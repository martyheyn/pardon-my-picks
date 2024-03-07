import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async () => {
	return {
		personas: await prisma.pick.groupBy({
			by: ['person'],
			_sum: {
				winner: true,
				push: true
			},
			_count: {
				winner: true
			}
		}),

		spreads: await prisma.pick.groupBy({
			by: ['person', 'type'],
			_sum: {
				winner: true,
				push: true
			},
			_count: {
				winner: true
			}
		}),

		specialBets: await prisma.pick.groupBy({
			by: ['person', 'specialBet'],
			_sum: {
				winner: true,
				push: true
			},
			_count: {
				winner: true
			},
			where: {
				specialBet: {
					not: undefined || ''
				}
			}
		})
	};
};
