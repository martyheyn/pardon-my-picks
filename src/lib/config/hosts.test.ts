import { describe, it, expect } from 'vitest';
import { hostPath, matchHostSlug, parseSeason, resolveHosts, slugify } from './hosts';

describe('slugify', () => {
	it('lowercases and drops everything but letters and numbers', () => {
		expect(slugify('Big Cat')).toBe('bigcat');
		expect(slugify('PFT')).toBe('pft');
	});
});

describe('resolveHosts', () => {
	it('uses the config entry for a known host', () => {
		expect(resolveHosts(['Big Cat'])[0]).toMatchObject({
			slug: 'bigcat',
			xHandle: '@BarstoolBigCat',
			aliases: ['big-cat']
		});
	});

	it('builds a page for someone missing from the config', () => {
		expect(resolveHosts(['Mr Cat'])[0]).toEqual({
			person: 'Mr Cat',
			slug: 'mrcat',
			displayName: 'Mr Cat',
			xHandle: null,
			aliases: ['mr-cat']
		});
	});

	it('keeps the order it was given', () => {
		expect(resolveHosts(['PFT', 'Hank']).map((host) => host.slug)).toEqual(['pft', 'hank']);
	});
});

describe('matchHostSlug', () => {
	const hosts = resolveHosts(['Big Cat', 'Hank']);

	it('matches the canonical slug', () => {
		expect(matchHostSlug('bigcat', hosts)).toMatchObject({
			host: { person: 'Big Cat' },
			canonical: true
		});
	});

	it('matches an alias and marks it for a redirect', () => {
		expect(matchHostSlug('big-cat', hosts)).toMatchObject({
			host: { slug: 'bigcat' },
			canonical: false
		});
		expect(matchHostSlug('handsome-hank', hosts)).toMatchObject({
			host: { slug: 'hank' },
			canonical: false
		});
	});

	it('matches other casing and marks it for a redirect', () => {
		expect(matchHostSlug('Hank', hosts)).toMatchObject({
			host: { slug: 'hank' },
			canonical: false
		});
	});

	it('only matches hosts in the list it was given', () => {
		expect(matchHostSlug('pft', hosts)).toBeNull();
		expect(matchHostSlug('stats', hosts)).toBeNull();
	});
});

describe('parseSeason', () => {
	it('defaults to the current season', () => {
		expect(parseSeason(null, 2026)).toEqual({ year: 2026, isCurrent: true });
	});

	it('reads a past season', () => {
		expect(parseSeason('2024', 2026)).toEqual({ year: 2024, isCurrent: false });
	});

	it('treats the current year spelled out as the current season', () => {
		expect(parseSeason('2026', 2026)).toEqual({ year: 2026, isCurrent: true });
	});

	it('rejects future years and anything that is not a year', () => {
		expect(parseSeason('2027', 2026)).toBeNull();
		expect(parseSeason('', 2026)).toBeNull();
		expect(parseSeason('24', 2026)).toBeNull();
		expect(parseSeason('2024abc', 2026)).toBeNull();
	});
});

describe('hostPath', () => {
	it('keeps the bare slug for the current season', () => {
		expect(hostPath('hank', { year: 2026, isCurrent: true })).toBe('/hank');
	});

	it('adds the year for a past season', () => {
		expect(hostPath('hank', { year: 2024, isCurrent: false })).toBe('/hank?year=2024');
	});
});
