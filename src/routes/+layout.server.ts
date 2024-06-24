import type { LayoutServerLoad } from './$types';
import { MAINTANANCE_MODE } from '$env/static/private';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async (event) => {
	if (MAINTANANCE_MODE) {
		redirect(302, '/maintenance');
	}
	return {
		user: event.locals.user
	};
};
