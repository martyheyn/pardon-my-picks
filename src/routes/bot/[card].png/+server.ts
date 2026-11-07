import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CURRENT_YEAR } from '$env/static/private';
import { getSeasonStats } from '$lib/server/host-stats';
import { buildPost, isBotRequest } from '$lib/server/x-bot/run';
import { getCurrentWeek } from '$lib/utils/nfl-week';

// a look at the card the X bot would post, without posting: /bot/fade.png (?week=9, the current
// week when it's missing) or /bot/standings.png (the latest graded week). Same secret as /bot/run
export const GET: RequestHandler = async ({ request, params, url }) => {
	if (!isBotRequest(request)) error(401, 'Unauthorized');

	const type = params.card;
	if (type !== 'fade' && type !== 'standings') error(404, 'Not found');

	const year = Number(CURRENT_YEAR);
	const season = await getSeasonStats(year);

	const weekParam = url.searchParams.get('week');
	if (weekParam !== null && !/^\d{1,2}$/.test(weekParam)) error(400, 'week must be a number');

	const week =
		type === 'standings'
			? season.stats.latestCompletedWeek
			: weekParam !== null
				? Number(weekParam)
				: getCurrentWeek(year);
	if (week === null) error(404, 'No week is fully graded yet');

	const post = await buildPost(type, year, week, season);
	if (!post) error(404, `Nothing to draw for week ${week}`);

	return new Response(Buffer.from(post.png), {
		headers: { 'content-type': 'image/png', 'cache-control': 'no-store' }
	});
};
