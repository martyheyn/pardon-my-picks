import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isBotRequest, runBot } from '$lib/server/x-bot/run';

// the X bot's run, called by .github/workflows/x-bot.yml with `authorization: Bearer <BOT_SECRET>`.
// Posts whatever is ready (only when every switch in run.ts is on) and answers with what it did.
// ?dryRun=1 decides and draws without posting. Locally: curl -X POST localhost:5173/bot/run
export const POST: RequestHandler = async ({ request, url }) => {
	if (!isBotRequest(request)) error(401, 'Unauthorized');

	const summary = await runBot({ dryRun: url.searchParams.has('dryRun') });

	// a 500 turns the Action red, so a post that failed or needs checking by hand gets noticed
	const needsAttention = summary.items.some(
		(item) => item.action === 'failed' || item.action === 'stuck'
	);
	return json(summary, { status: needsAttention ? 500 : 200 });
};
