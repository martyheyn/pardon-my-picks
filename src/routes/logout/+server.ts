import { invalidateSession } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	const session = locals.session;
	if (!session) {
		redirect(302, '/');
	}
	await invalidateSession(session.id);
	locals.session = null;

	throw redirect(302, '/');
};
