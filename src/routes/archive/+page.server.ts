import type { Actions, PageServerLoad } from './$types';
import { generateId } from 'lucia';
import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';

type YearMaxWeekType = {
	year: number;
	_max: {
		week: number;
	};
};

export const load: PageServerLoad = async ({ params, locals }) => {
	const yearsWeeks: YearMaxWeekType[] = await prisma.pick.groupBy({
		by: ['year'],
		_max: {
			week: true
		}
	});

	return {
		yearsMaxWeek: yearsWeeks
	};
};
