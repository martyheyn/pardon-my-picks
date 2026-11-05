import type { RequestHandler } from './$types';
import { getHostSeason } from '$lib/server/host-stats';
import { hostCardData, hostCardFields, hostCardVersion } from '$lib/server/cards/data';
import { renderCard } from '$lib/server/cards/render';
import { hostCard } from '$lib/server/cards/templates/host-card';

// the host's share card - the og:image for /[host], for the season in ?year= (the current one when
// it's missing)
export const GET: RequestHandler = async ({ params, url }) => {
	const { host, hostStats, stats, hosts, season } = await getHostSeason(
		params.host,
		url.searchParams.get('year'),
		(slug) => `/${slug}/card.png${url.search}`
	);

	const fields = hostCardFields(hostStats, stats, hosts, season);
	const png = await renderCard(hostCard, await hostCardData(fields, host.person));

	// the host page links here with ?v=<hash of what's on the card>. When that matches, this exact
	// image can be cached for good - new numbers mean a new hash and a new url. Anything else (no v,
	// or an old one) gets a short cache so it picks up the latest numbers
	const isCurrent = url.searchParams.get('v') === hostCardVersion(fields);

	return new Response(Buffer.from(png), {
		headers: {
			'content-type': 'image/png',
			'cache-control': isCurrent
				? 'public, max-age=300, s-maxage=31536000, immutable'
				: 'public, max-age=0, s-maxage=300'
		}
	});
};
