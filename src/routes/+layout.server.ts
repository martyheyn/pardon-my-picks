import type { LayoutServerLoad } from './$types';
import { MAINTENANCE_MODE } from '$env/static/private';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ url, locals }) => {
	const targetPath = '/maintenance';
	if (MAINTENANCE_MODE === 'true' && url.pathname !== targetPath) {
		console.log('REDIRECTING TO MAINTENANCE PAGE');
		throw redirect(302, targetPath);
	}

	if (!url.pathname.includes('user') && url.pathname.split('/').length > 2) {
		let year = url.pathname.split('/')[1];
		let week = url.pathname.split('/')[2];

		if (isNaN(parseInt(year)) || isNaN(parseInt(week))) {
			console.log('REDIRECTING TO 404');
			throw redirect(302, '/404');
		}

		if (parseInt(week) < 1 || parseInt(week) > 18) {
			console.log('REDIRECTING TO 404');
			throw redirect(302, '/404');
		}

		if (parseInt(year) < 2023 || parseInt(year) > 2025) {
			console.log('REDIRECTING TO 404');
			throw redirect(302, '/404');
		}
	}

	return {
		user: locals.user
	};
};
