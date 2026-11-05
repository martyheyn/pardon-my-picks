import { describe, it, expect, vi } from 'vitest';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveHosts } from '$lib/config/hosts';
import { computeSeasonStats, type StatsPick } from '$lib/utils/host-stats';
import { renderCard, type CardTemplate } from './render';
import { fridayFadeData, hostCardData, hostCardFields, weeklyStandingsData } from './data';
import { hostCard } from './templates/host-card';
import { fridayFade } from './templates/friday-fade';
import { weeklyStandings } from './templates/weekly-standings';

// read() only exists inside a running sveltekit server - under vitest, imported assets come back as
// paths from the project root, so read them straight off disk
vi.mock('$app/server', () => ({
	read: (asset: string) => new Response(readFileSync(join(process.cwd(), asset)))
}));

// set CARD_PREVIEW_DIR to a folder to also save each card there and eyeball it:
// CARD_PREVIEW_DIR=/tmp/cards npx vitest run src/lib/server/cards
const previewDir = process.env.CARD_PREVIEW_DIR;

const YEAR = 2026;
const CURRENT = { year: YEAR, isCurrent: true };
let pickCount = 0;

const makePick = (person: string, week: number, overrides: Partial<StatsPick> = {}): StatsPick => {
	pickCount++;
	const kickoff = new Date(Date.UTC(YEAR, 8, week * 7 + (pickCount % 3)));
	return {
		id: `pick-${pickCount}`,
		person,
		week,
		type: 'spreads',
		homeTeam: 'chiefs',
		awayTeam: 'bills',
		homeTeamScore: 24,
		awayTeamScore: 17,
		pickTeam: 'chiefs',
		pickTotalType: null,
		pickScore: -3.5,
		winner: 1,
		push: 0,
		gameDate: kickoff,
		createdAt: kickoff,
		...overrides
	};
};

const total = (person: string, week: number, overrides: Partial<StatsPick> = {}) =>
	makePick(person, week, {
		type: 'totals',
		homeTeam: 'jets',
		awayTeam: 'fortyNiners',
		pickTeam: null,
		pickTotalType: 'over',
		pickScore: 44.5,
		homeTeamScore: 10,
		awayTeamScore: 13,
		winner: 0,
		...overrides
	});

// two graded weeks plus an ungraded week 3, for six hosts
const picks: StatsPick[] = [
	...['Big Cat', 'PFT', 'Memes', 'Hank', 'Max', 'Zach'].flatMap((person, i) => [
		makePick(person, 1, { winner: i < 4 ? 1 : 0 }),
		total(person, 1, { winner: i % 2 }),
		makePick(person, 2, { pickTeam: 'bills', pickScore: 3.5, winner: i < 2 ? 1 : 0 }),
		total(person, 2, { pickTotalType: 'under', winner: i === 3 ? 0 : 1 }),
		makePick(person, 3, { winner: null, push: null, homeTeamScore: null, awayTeamScore: null }),
		total(person, 3, { winner: null, push: null, homeTeamScore: null, awayTeamScore: null })
	])
];

const stats = computeSeasonStats(picks);
const hosts = resolveHosts(stats.standings.map((host) => host.person));

// PNG width and height live at fixed spots in the IHDR chunk
const pngSize = (png: Uint8Array) => {
	const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
	return { width: view.getUint32(16), height: view.getUint32(20) };
};

async function renderAndCheck<Data>(name: string, template: CardTemplate<Data>, data: Data) {
	const png = await renderCard(template, data);

	expect(Array.from(png.slice(1, 4), (byte) => String.fromCharCode(byte)).join('')).toBe('PNG');
	expect(pngSize(png)).toEqual({ width: template.width, height: template.height });

	if (previewDir) {
		mkdirSync(previewDir, { recursive: true });
		writeFileSync(join(previewDir, `${name}.png`), png);
	}
}

describe('card templates', () => {
	it('renders a host card for every host', async () => {
		for (const host of stats.standings) {
			const fields = hostCardFields(host, stats, hosts, CURRENT);
			await renderAndCheck(
				`host-card-${host.person}`,
				hostCard,
				await hostCardData(fields, host.person)
			);
		}
	});

	it('renders a host card with nothing graded yet', async () => {
		const empty = computeSeasonStats([
			makePick('Hank', 1, { winner: null, push: null, homeTeamScore: null, awayTeamScore: null })
		]);
		const fields = hostCardFields(empty.standings[0], empty, hosts, CURRENT);
		await renderAndCheck('host-card-empty', hostCard, await hostCardData(fields, 'Hank'));
	});

	it('renders the friday fade card', async () => {
		const weekPicks = picks.filter((pick) => pick.week === 3);
		const data = await fridayFadeData(3, weekPicks, stats, hosts);
		expect(data.rows.filter((row) => row.isFade)).toHaveLength(1);
		await renderAndCheck('friday-fade', fridayFade, data);
	});

	it('renders the weekly standings card', async () => {
		const data = await weeklyStandingsData(YEAR, stats, hosts);
		expect(data).not.toBeNull();
		if (data) await renderAndCheck('weekly-standings', weeklyStandings, data);
	});
});

describe('hostCardFields', () => {
	it('marks a tied rank', () => {
		const tied = computeSeasonStats([makePick('Hank', 1), makePick('PFT', 1)]);
		expect(hostCardFields(tied.standings[0], tied, hosts, CURRENT).eyebrow).toBe(
			'2026 season · T-1st of 2'
		);
	});

	it('shows how a past season finished, without a streak', () => {
		const hot = computeSeasonStats([makePick('Hank', 1), makePick('Hank', 2), makePick('PFT', 1)]);
		const hank = hot.standings[0];

		expect(hostCardFields(hank, hot, hosts, CURRENT)).toMatchObject({
			eyebrow: '2026 season · 1st of 2',
			streak: 'W2'
		});
		expect(hostCardFields(hank, hot, hosts, { year: 2025, isCurrent: false })).toMatchObject({
			eyebrow: '2025 season · Finished 1st of 2',
			streak: null
		});
	});

	it('renders a past season card', async () => {
		const host = stats.standings[stats.standings.length - 1];
		const fields = hostCardFields(host, stats, hosts, { year: 2025, isCurrent: false });
		await renderAndCheck(
			'host-card-past-season',
			hostCard,
			await hostCardData(fields, host.person)
		);
	});
});
