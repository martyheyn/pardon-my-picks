// the Box Score and Highlights links mark-games.js puts on finished games - no db or network in
// here, so the matching can be unit tested
import { findEvent, fullNameToMascot } from './grading.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// the NFL usually posts a game's highlights within a few hours of the final whistle. The limit
// keeps a rematch later in the season from being taken for an earlier game's video
const MAX_HIGHLIGHT_DELAY_MS = 3 * DAY_MS;

// the word video titles use for each team: the last word of its full name ("Chiefs", "49ers")
const nicknames = Object.fromEntries(
	Object.entries(fullNameToMascot).map(([fullName, team]) => [team, fullName.split(' ').at(-1)])
);

export const boxScoreUrl = (espnEventId) =>
	`https://www.espn.com/nfl/boxscore/_/gameId/${espnEventId}`;

export const highlightUrl = (videoId) => `https://www.youtube.com/watch?v=${videoId}`;

// "Jaguars vs Ravens", away team first like the result column
export const gameLabel = (game) => `${nicknames[game.awayTeam]} vs ${nicknames[game.homeTeam]}`;

// the finished games behind picks that are missing a link, one entry per game however many picks
// are on it. An empty string counts as missing - that's what a blank admin form used to save
export function groupGames(picks, events) {
	const games = new Map();

	for (const pick of picks) {
		const event = findEvent(pick, events);
		// a game still being played has no final box score or highlights yet
		if (!event?.completed) continue;

		const game = games.get(event.id) ?? {
			espnEventId: event.id,
			kickoff: event.kickoff,
			homeTeam: pick.home_team,
			awayTeam: pick.away_team,
			needBoxScore: [],
			needHighlights: []
		};
		if (!pick.espn_link) game.needBoxScore.push(pick.id);
		if (!pick.highlight_link) game.needHighlights.push(pick.id);
		games.set(event.id, game);
	}

	return [...games.values()];
}

// what matching needs from the YouTube Data API's playlistItems response
export function parseUploads(json) {
	return (json.items ?? [])
		.map((item) => ({
			videoId: item.snippet?.resourceId?.videoId,
			title: item.snippet?.title ?? '',
			publishedAt: new Date(item.snippet?.publishedAt)
		}))
		.filter((video) => video.videoId);
}

const mentions = (title, team) => new RegExp(`\\b${nicknames[team]}\\b`, 'i').test(title);

// the NFL channel's video for a game, titled like "Jacksonville Jaguars vs Baltimore Ravens Game
// Highlights | 2026 NFL Season Week 9". Strict on purpose - "Game Highlights" plus both teams,
// posted after kickoff - since a missing link is better than one to the wrong game. Previews,
// player clips and single-team videos all miss. A re-upload loses to the original
export function findHighlight(game, videos) {
	const kickoff = game.kickoff.getTime();
	let earliest = null;

	for (const video of videos) {
		if (!/game highlights/i.test(video.title)) continue;
		if (!mentions(video.title, game.homeTeam) || !mentions(video.title, game.awayTeam)) continue;

		const sinceKickoff = video.publishedAt.getTime() - kickoff;
		if (sinceKickoff <= 0 || sinceKickoff > MAX_HIGHLIGHT_DELAY_MS) continue;
		if (!earliest || video.publishedAt < earliest.publishedAt) earliest = video;
	}

	return earliest;
}
