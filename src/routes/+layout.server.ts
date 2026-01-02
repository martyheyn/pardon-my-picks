import type { LayoutServerLoad } from './$types';
import { MAINTENANCE_MODE } from '$env/static/private';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ url, locals }) => {
	const targetPath = '/maintenance';
	if (MAINTENANCE_MODE === 'true' && url.pathname !== targetPath) {
		console.log('REDIRECTING TO MAINTENANCE PAGE');
		throw redirect(302, targetPath);
	}

	if (
		locals.user?.role !== 'admin' &&
		!url.pathname.includes('user') &&
		url.pathname.split('/').length > 2
	) {
		const year = url.pathname.split('/')[1];
		const week = url.pathname.split('/')[2];

		if (isNaN(parseInt(year)) || isNaN(parseInt(week))) {
			console.error('REDIRECTING TO 404');
			throw redirect(302, '/404');
		}

		if (parseInt(week) < 1 || parseInt(week) > 18) {
			console.error('REDIRECTING TO 404');
			throw redirect(302, '/404');
		}

		if (parseInt(year) < 2023 || parseInt(year) > 2025) {
			console.error('REDIRECTING TO 404');
			throw redirect(302, '/404');
		}
	}

	return {
		user: locals.user
	};
};
