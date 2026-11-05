import { describe, it, expect } from 'vitest';
import {
	formatGap,
	hostHeadline,
	ogDescription,
	ogTitle,
	ordinal,
	shortPickLabel,
	standingLine,
	streakLabel,
	worstPickLine
} from './host-copy';
import type { StatsPick } from './host-stats';

const nameOf = (person: string) => person;
const record = (wins: number, losses: number, pushes = 0) => ({ wins, losses, pushes });

describe('ordinal', () => {
	it('handles the teens and the usual endings', () => {
		expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101].map(ordinal)).toEqual([
			'1st',
			'2nd',
			'3rd',
			'4th',
			'11th',
			'12th',
			'13th',
			'21st',
			'22nd',
			'23rd',
			'101st'
		]);
	});
});

describe('formatGap', () => {
	it('reads naturally for half games and singles', () => {
		expect(formatGap(0.5)).toBe('half a game');
		expect(formatGap(1)).toBe('1 game');
		expect(formatGap(2.5)).toBe('2.5 games');
	});
});

describe('standingLine', () => {
	it('calls out last place', () => {
		const host = { rank: 6, personAhead: { relation: 'behind', person: 'Memes', gap: 2 } } as const;
		expect(standingLine(host, 6, nameOf)).toBe('Last place. 2 games behind Memes');
	});

	it('names the host ahead when not last', () => {
		const host = {
			rank: 3,
			personAhead: { relation: 'behind', person: 'Big Cat', gap: 1 }
		} as const;
		expect(standingLine(host, 6, nameOf)).toBe('1 game behind Big Cat');
	});

	it('names the chaser for 1st place', () => {
		const host = {
			rank: 1,
			personAhead: { relation: 'chased-by', person: 'PFT', gap: 0.5 }
		} as const;
		expect(standingLine(host, 6, nameOf)).toBe('1st place. PFT is half a game back');
	});

	it('calls out a tie for 1st', () => {
		const host = { rank: 1, personAhead: { relation: 'tied', person: 'PFT', gap: 0 } } as const;
		expect(standingLine(host, 6, nameOf)).toBe('Tied for 1st with PFT');
	});

	it('uses the display name', () => {
		const host = {
			rank: 2,
			personAhead: { relation: 'behind', person: 'Big Cat', gap: 1 }
		} as const;
		expect(standingLine(host, 6, () => 'Dan')).toBe('1 game behind Dan');
	});

	it('is null with nobody to compare against', () => {
		expect(standingLine({ rank: 1, personAhead: null }, 1, nameOf)).toBeNull();
	});
});

describe('hostHeadline', () => {
	it('sells the fade when the host is losing', () => {
		expect(hostHeadline({ record: record(10, 14), fadeNet: 4 }, 'Hank')).toBe('FADING HANK: +4');
	});

	it('sells the tail when the host is winning', () => {
		expect(hostHeadline({ record: record(14, 10), fadeNet: -4 }, 'Big Cat')).toBe(
			'TAILING BIG CAT: +4'
		);
	});

	it('handles a .500 host', () => {
		expect(hostHeadline({ record: record(5, 5), fadeNet: 0 }, 'PFT')).toBe('PFT IS DEAD EVEN');
	});

	it('handles a host with nothing graded', () => {
		expect(hostHeadline({ record: record(0, 0, 1), fadeNet: 0 }, 'Max')).toBe(
			'MAX: NO RECEIPTS YET'
		);
	});
});

const spread = {
	type: 'spreads',
	homeTeam: 'chiefs',
	awayTeam: 'bills',
	pickTeam: 'chiefs',
	pickTotalType: null,
	pickScore: -3.5
} as const;

describe('shortPickLabel', () => {
	it('uses the mascot and a signed line for spreads', () => {
		expect(shortPickLabel(spread)).toBe('Chiefs -3.5');
		expect(shortPickLabel({ ...spread, pickTeam: 'bills', pickScore: 3.5 })).toBe('Bills +3.5');
		expect(shortPickLabel({ ...spread, pickScore: 0 })).toBe('Chiefs PK');
	});

	it('uses both abbreviations for totals', () => {
		expect(
			shortPickLabel({
				...spread,
				type: 'totals',
				pickTeam: null,
				pickTotalType: 'under',
				pickScore: 44.5
			})
		).toBe('BUF @ KC Under 44.5');
	});

	it('handles the 49ers enum name', () => {
		expect(shortPickLabel({ ...spread, pickTeam: 'fortyNiners', homeTeam: 'fortyNiners' })).toBe(
			'49ers -3.5'
		);
	});
});

describe('worstPickLine', () => {
	it('names the pick and how far it missed', () => {
		const pick = { ...spread, pickTeam: 'jets', homeTeam: 'jets', pickScore: 3 } as StatsPick;
		expect(worstPickLine({ pick, missedBy: 24 })).toBe('Worst miss: Jets +3, missed by 24');
	});

	it('is null without a worst pick', () => {
		expect(worstPickLine(null)).toBeNull();
	});
});

describe('streakLabel', () => {
	it('abbreviates the streak', () => {
		expect(streakLabel({ outcome: 'L', count: 3 })).toBe('L3');
		expect(streakLabel(null)).toBeNull();
	});
});

describe('og copy', () => {
	const current = { year: 2026, isCurrent: true };
	const past = { year: 2025, isCurrent: false };

	it('puts the record in the title', () => {
		expect(ogTitle({ record: record(23, 31) }, 'Hank', current)).toBe('Hank is 23–31 this season');
		expect(ogTitle({ record: record(0, 0) }, 'Hank', current)).toBe("Hank's 2026 picks");
	});

	it('puts a past season in the past tense', () => {
		expect(ogTitle({ record: record(23, 31) }, 'Hank', past)).toBe('Hank went 23–31 in 2025');
		expect(ogDescription({ record: record(23, 31), fadeNet: 8 }, 'Hank', past)).toBe(
			'Fading Hank in 2025 would have had you up 8 games. Full receipts inside.'
		);
		expect(ogDescription({ record: record(5, 5), fadeNet: 0 }, 'Hank', past)).toBe(
			'Fading Hank in 2025 got you nowhere. Neither did tailing. Full receipts inside.'
		);
	});

	it('pitches the fade or the tail in the description', () => {
		expect(ogDescription({ record: record(23, 31), fadeNet: 8 }, 'Hank', current)).toBe(
			'Fading Hank would have you up 8 games. Full receipts inside.'
		);
		expect(ogDescription({ record: record(10, 9), fadeNet: -1 }, 'PFT', current)).toBe(
			'Tailing PFT would have you up 1 game. Full receipts inside.'
		);
	});
});
