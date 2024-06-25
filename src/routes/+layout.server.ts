import type { LayoutServerLoad } from './$types';
import { MAINTENANCE_MODE } from '$env/static/private';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ url }) => {
	const targetPath = '/maintenance';
	if (MAINTENANCE_MODE && url.pathname !== targetPath) {
		throw redirect(302, targetPath);
	}
	// return {
	// 	user: event.locals.user
	// };
};
