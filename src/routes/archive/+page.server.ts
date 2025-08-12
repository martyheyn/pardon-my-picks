import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async () => {
	const yearsWeeks = await prisma.pick.groupBy({
		by: ['year'],
		_max: {
			week: true
		}
	});

	return {
		yearsMaxWeek: yearsWeeks
	};
};
