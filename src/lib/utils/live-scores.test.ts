import { describe, it, expect } from 'vitest';
import { getStartedGameScores, type EspnScoreEvent } from './live-scores';

const espnEvent = (
	state: 'pre' | 'in' | 'post',
	home: { name: string; score?: number },
	away: { name: string; score?: number }
): EspnScoreEvent => ({
	competitions: [
		{
			status: { type: { state } },
			competitors: [
				{
					homeAway: 'home',
					team: { displayName: home.name },
					score: home.score === undefined ? undefined : { value: home.score }
				},
				{
					homeAway: 'away',
					team: { displayName: away.name },
					score: away.score === undefined ? undefined : { value: away.score }
				}
			]
		}
	]
});

describe('getStartedGameScores', () => {
	it('returns the score of a game in progress, mapped to team enums', () => {
		const scores = getStartedGameScores([
			espnEvent(
				'in',
				{ name: 'Seattle Seahawks', score: 14 },
				{ name: 'Kansas City Chiefs', score: 10 }
			)
		]);

		expect(scores).toEqual([
			{ homeTeam: 'seahawks', awayTeam: 'chiefs', homeTeamScore: 14, awayTeamScore: 10 }
		]);
	});

	it('skips games that have not started, even though ESPN sends them as 0-0', () => {
		const scores = getStartedGameScores([
			espnEvent(
				'pre',
				{ name: 'Seattle Seahawks', score: 0 },
				{ name: 'Kansas City Chiefs', score: 0 }
			)
		]);

		expect(scores).toEqual([]);
	});

	it('keeps finished games so the final score lands before grading', () => {
		const scores = getStartedGameScores([
			espnEvent(
				'post',
				{ name: 'Las Vegas Raiders', score: 20 },
				{ name: 'Los Angeles Rams', score: 27 }
			)
		]);

		expect(scores).toEqual([
			{ homeTeam: 'raiders', awayTeam: 'rams', homeTeamScore: 20, awayTeamScore: 27 }
		]);
	});

	it('skips teams that are not in the NFL team list', () => {
		const scores = getStartedGameScores([
			espnEvent('in', { name: 'AFC', score: 7 }, { name: 'NFC', score: 3 })
		]);

		expect(scores).toEqual([]);
	});

	it('skips a game missing a score', () => {
		const scores = getStartedGameScores([
			espnEvent('in', { name: 'Seattle Seahawks' }, { name: 'Kansas City Chiefs', score: 10 })
		]);

		expect(scores).toEqual([]);
	});
});
