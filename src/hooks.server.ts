// src/hooks.server.ts
import { validateSessionToken } from '$lib/server/auth';

export const handle = async ({ event, resolve }) => {
	const sessionCookie = event.cookies.get('session');

	const { user, session } = await validateSessionToken(sessionCookie);
	event.locals.user = user;
	event.locals.session = session;

	// Not found: /.well-known/appspecific/com.chrome.devtools.json warning
	if (event.url.pathname.startsWith('/.well-known/appspecific/com.chrome.devtools.json')) {
		// return empty JSON so Chrome stops complaining
		return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
	}
	return resolve(event);
};
