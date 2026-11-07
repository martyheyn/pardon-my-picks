import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkConnection, isBotRequest } from '$lib/server/x-bot/run';

// checks the X keys without posting - whose account they post as, and that a card uploads. Run it
// from the Actions tab: "X bot" → Run workflow → check. A 500 (and a red run) means it didn't pass
export const POST: RequestHandler = async ({ request }) => {
	if (!isBotRequest(request)) error(401, 'Unauthorized');

	const check = await checkConnection();
	return json(check, { status: check.ok ? 200 : 500 });
};
