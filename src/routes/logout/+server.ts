import { lucia } from '$lib/server/lucia';
import { fail, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	const session = locals.session;
	if (!session) {
		throw redirect(302, '/');
	}
	await lucia.invalidateSession(session.id);
	locals.session = null;

	throw redirect(302, '/');
};
