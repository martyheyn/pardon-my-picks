// per-host details the pick data doesn't carry. The host list itself comes from whoever has picks in
// the season (see resolveHosts) - this only adds the url slug, X handle and old slugs to redirect
export type HostConfig = {
	// the Pick.person value
	person: string;
	slug: string;
	displayName: string;
	xHandle: string | null;
	// other slugs that should redirect to this host's page
	aliases: string[];
};

const HOSTS: HostConfig[] = [
	{
		person: 'Big Cat',
		slug: 'bigcat',
		displayName: 'Big Cat',
		xHandle: '@BarstoolBigCat',
		aliases: ['big-cat']
	},
	{
		person: 'PFT',
		slug: 'pft',
		displayName: 'PFT',
		xHandle: '@PFTCommenter',
		aliases: ['pft-commenter']
	},
	{
		person: 'Hank',
		slug: 'hank',
		displayName: 'Hank',
		xHandle: '@hen_ease',
		aliases: ['handsome-hank']
	},
	{
		person: 'Memes',
		slug: 'memes',
		displayName: 'Memes',
		xHandle: '@PardonMyMeme',
		aliases: []
	},
	{
		person: 'Max',
		slug: 'max',
		displayName: 'Max',
		xHandle: '@Philly_Mays',
		aliases: ['bat-girl']
	},
	{
		person: 'Zach',
		slug: 'zach',
		displayName: 'Zach',
		xHandle: '@Zaccornelius_',
		aliases: []
	},
	{
		person: 'Jake',
		slug: 'jake',
		displayName: 'Jake',
		xHandle: null,
		aliases: ['cake-marsh']
	}
];

// 'Big Cat' -> 'bigcat'
export const slugify = (person: string) => person.toLowerCase().replace(/[^a-z0-9]/g, '');

// 'Big Cat' -> 'big-cat', the spelling people are most likely to guess
const hyphenate = (person: string) =>
	person
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

// one entry per person in the data, in the order given. Someone with picks but no config entry
// still gets a page, under a slug built from their name
export function resolveHosts(persons: string[]): HostConfig[] {
	return persons.map((person) => {
		const configured = HOSTS.find((host) => host.person === person);
		if (configured) return configured;

		const slug = slugify(person);
		const hyphenated = hyphenate(person);
		return {
			person,
			slug,
			displayName: person,
			xHandle: null,
			aliases: hyphenated !== slug ? [hyphenated] : []
		};
	});
}

// the slug a person's host page lives at - also the anchor for their picks on the week page
export const hostSlug = (person: string) => resolveHosts([person])[0].slug;

export type HostMatch = {
	host: HostConfig;
	// false when the url used an alias or different casing and should redirect to host.slug
	canonical: boolean;
};

export function matchHostSlug(slug: string, hosts: HostConfig[]): HostMatch | null {
	const normalized = slug.toLowerCase();
	const host = hosts.find((h) => h.slug === normalized || h.aliases.includes(normalized));
	if (!host) return null;

	return { host, canonical: slug === host.slug };
}

// the season a host page shows - the current one at /hank, an old one at /hank?year=2025
export type Season = {
	year: number;
	isCurrent: boolean;
};

// reads the ?year= param, where missing means the current season. Null for junk or a future year,
// which the page turns into a 404
export function parseSeason(yearParam: string | null, currentYear: number): Season | null {
	if (yearParam === null) return { year: currentYear, isCurrent: true };
	if (!/^\d{4}$/.test(yearParam)) return null;

	const year = Number(yearParam);
	if (year > currentYear) return null;
	return { year, isCurrent: year === currentYear };
}

// the current season keeps the bare /hank url, so links shared before old seasons existed still
// point at the same page
export function hostPath(slug: string, season: Season): string {
	return season.isCurrent ? `/${slug}` : `/${slug}?year=${season.year}`;
}
