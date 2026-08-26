import { describe, it, expect } from 'vitest';
import { sortPicksByPerson } from './matching-format';

describe('sortPicksByPerson', () => {
	it('returns an empty array for empty input', () => {
		expect(sortPicksByPerson({})).toEqual([]);
	});

	it('wraps a single person into a single-key entry', () => {
		const result = sortPicksByPerson({ 'Big Cat': ['pick1', 'pick2'] });
		expect(result).toEqual([{ 'Big Cat': ['pick1', 'pick2'] }]);
	});

	it('sorts entries by sortOrder regardless of input order', () => {
		const result = sortPicksByPerson({
			Max: ['maxPick'],
			'Big Cat': ['bigCatPick'],
			Hank: ['hankPick'],
			PFT: ['pftPick']
		});

		expect(result.map((entry) => Object.keys(entry)[0])).toEqual(['Big Cat', 'PFT', 'Hank', 'Max']);
	});
});
