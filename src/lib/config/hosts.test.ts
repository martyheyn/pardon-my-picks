import { describe, it, expect } from 'vitest';
import { hostHref } from './hosts';

describe('hostHref', () => {
	it('links to the season being looked at when the host made picks in it', () => {
		expect(
			hostHref({ person: 'Hank', years: [2026, 2025], currentYear: 2026, preferredYear: 2025 })
		).toBe('/hank?year=2025');
	});

	it('uses the bare url for the current season', () => {
		expect(
			hostHref({ person: 'Big Cat', years: [2026, 2025], currentYear: 2026, preferredYear: 2026 })
		).toBe('/bigcat');
	});

	it('falls back to the latest season for all-time stats', () => {
		expect(
			hostHref({ person: 'PFT', years: [2024, 2026, 2025], currentYear: 2026, preferredYear: null })
		).toBe('/pft');
	});

	it('falls back to the latest season a host who has left made picks in', () => {
		expect(
			hostHref({ person: 'Jake', years: [2023, 2024], currentYear: 2026, preferredYear: 2026 })
		).toBe('/jake?year=2024');
	});

	it('has nowhere to link someone with no seasons', () => {
		expect(hostHref({ person: 'Jake', years: [], currentYear: 2026, preferredYear: null })).toBe(
			null
		);
	});
});
