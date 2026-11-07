import { describe, it, expect } from 'vitest';
import {
	boxScoreUrl,
	findHighlight,
	gameLabel,
	groupGames,
	highlightUrl,
	parseUploads
} from './game-links.js';

const video = (title, publishedAt, videoId = 'abc123') => ({
	videoId,
	title,
	publishedAt: new Date(publishedAt)
});

describe('findHighlight', () => {
	// 2026 week 9 Thursday night, and the title the NFL channel gave its highlights
	const game = {
		homeTeam: 'ravens',
		awayTeam: 'jaguars',
		kickoff: new Date('2026-11-05T20:15:00-05:00')
	};
	const title = 'Jacksonville Jaguars vs Baltimore Ravens Game Highlights | 2026 NFL Season Week 9';

	it('finds the game highlights video', () => {
		const highlights = video(title, '2026-11-05T23:58:00-05:00', 'jaxbal');
		expect(findHighlight(game, [highlights])).toBe(highlights);
	});

	it('matches the teams whichever way round the title has them', () => {
		const swapped = { ...game, homeTeam: 'jaguars', awayTeam: 'ravens' };
		expect(findHighlight(swapped, [video(title, '2026-11-05T23:58:00-05:00')])).not.toBeNull();
	});

	it('skips previews, player clips and other games', () => {
		const videos = [
			video('Jacksonville Jaguars vs Baltimore Ravens Game Preview | NFL Pro Show', '2026-11-06'),
			video("Trevor Lawrence's best throws from 242-yard game vs. Ravens | Week 8", '2026-11-06'),
			video(
				'Buffalo Bills vs Minnesota Vikings Game Highlights | 2026 NFL Season Week 9',
				'2026-11-06'
			)
		];
		expect(findHighlight(game, videos)).toBeNull();
	});

	it('skips videos from before kickoff, like the last time the teams met', () => {
		expect(findHighlight(game, [video(title, '2026-11-05T19:00:00-05:00')])).toBeNull();
	});

	it('skips videos posted more than 3 days after kickoff', () => {
		expect(findHighlight(game, [video(title, '2026-11-09T21:00:00-05:00')])).toBeNull();
	});

	it('takes the original over a later re-upload', () => {
		const original = video(title, '2026-11-05T23:58:00-05:00', 'original');
		const reupload = video(title, '2026-11-06T09:00:00-05:00', 'reupload');
		// uploads come newest first
		expect(findHighlight(game, [reupload, original])).toBe(original);
	});

	it('matches whole team names only', () => {
		const ramsChiefs = {
			homeTeam: 'rams',
			awayTeam: 'chiefs',
			kickoff: new Date('2026-11-08T16:25:00-05:00')
		};
		const ramsey = video(
			'Jalen Ramsey vs Kansas City Chiefs Game Highlights',
			'2026-11-08T20:00:00-05:00'
		);
		expect(findHighlight(ramsChiefs, [ramsey])).toBeNull();

		const ninersRaiders = {
			homeTeam: 'raiders',
			awayTeam: 'fortyNiners',
			kickoff: new Date('2026-11-08T16:05:00-05:00')
		};
		const highlights = video(
			'San Francisco 49ers vs Las Vegas Raiders Game Highlights | 2026 NFL Season Week 9',
			'2026-11-08T20:00:00-05:00'
		);
		expect(findHighlight(ninersRaiders, [highlights])).toBe(highlights);
	});
});

describe('parseUploads', () => {
	it('pulls out the video id, title and publish time, dropping items with no video', () => {
		const json = {
			items: [
				{
					snippet: {
						title: 'Jacksonville Jaguars vs Baltimore Ravens Game Highlights',
						publishedAt: '2026-11-06T04:58:00Z',
						resourceId: { kind: 'youtube#video', videoId: 'jaxbal' }
					}
				},
				{ snippet: { title: 'Deleted video', publishedAt: '2026-11-06T04:00:00Z' } }
			]
		};
		expect(parseUploads(json)).toEqual([
			{
				videoId: 'jaxbal',
				title: 'Jacksonville Jaguars vs Baltimore Ravens Game Highlights',
				publishedAt: new Date('2026-11-06T04:58:00Z')
			}
		]);
	});

	it('handles a response with no items', () => {
		expect(parseUploads({})).toEqual([]);
	});
});

describe('groupGames', () => {
	const events = [
		{
			id: '401',
			kickoff: new Date('2026-11-08T18:00:00Z'),
			completed: true,
			scores: { lions: 27, dolphins: 20 }
		},
		{
			id: '402',
			kickoff: new Date('2026-11-08T21:05:00Z'),
			completed: false,
			scores: { texans: 3, chargers: 7 }
		}
	];
	const pick = (id, fields = {}) => ({
		id,
		home_team: 'lions',
		away_team: 'dolphins',
		game_date: '2026-11-08T18:00:00.000Z',
		espn_link: null,
		highlight_link: null,
		...fields
	});

	it('makes one game out of every pick on it', () => {
		expect(groupGames([pick('a'), pick('b')], events)).toEqual([
			{
				espnEventId: '401',
				kickoff: new Date('2026-11-08T18:00:00Z'),
				homeTeam: 'lions',
				awayTeam: 'dolphins',
				needBoxScore: ['a', 'b'],
				needHighlights: ['a', 'b']
			}
		]);
	});

	it('only asks for the links each pick is missing, counting a blank one as missing', () => {
		const picks = [
			pick('a', {
				espn_link: 'https://www.espn.com/nfl/boxscore/_/gameId/401',
				highlight_link: ''
			}),
			pick('b', { highlight_link: 'https://www.youtube.com/watch?v=abc123' })
		];
		const [game] = groupGames(picks, events);
		expect(game.needBoxScore).toEqual(['b']);
		expect(game.needHighlights).toEqual(['a']);
	});

	it('leaves out games still being played', () => {
		const live = pick('a', {
			home_team: 'texans',
			away_team: 'chargers',
			game_date: '2026-11-08T21:05:00.000Z'
		});
		expect(groupGames([live], events)).toEqual([]);
	});
});

describe('link formats', () => {
	it('builds the same links that used to be typed in by hand', () => {
		expect(boxScoreUrl('401772717')).toBe('https://www.espn.com/nfl/boxscore/_/gameId/401772717');
		expect(highlightUrl('IzjvQG8HtWc')).toBe('https://www.youtube.com/watch?v=IzjvQG8HtWc');
	});

	it('labels a game away team first', () => {
		expect(gameLabel({ homeTeam: 'ravens', awayTeam: 'jaguars' })).toBe('Jaguars vs Ravens');
	});
});
