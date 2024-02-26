import { lucia } from '$lib/server/lucia';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	console.log('event', event);
	const sessionId = event.cookies.get(lucia.sessionCookieName);
	console.log('sessionId', sessionId);
	if (!sessionId) {
		// event.locals.
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	// get session from user
	const { session, user } = await lucia.validateSession(sessionId);
	console.log('session', session);
	console.log('user', user);
	if (session && session.fresh) {
		const sessionCookie = lucia.createSessionCookie(session.id);
		// sveltekit types deviates from the de-facto standard
		// you can use 'as any' too
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}
	// if there is no session, create a blank session
	if (!session) {
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}
	event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};
