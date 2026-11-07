import pg from 'pg';
import { espnDateRange, findEvent, gradePick, parseEvents, resultLabel } from './grading.js';
import {
	boxScoreUrl,
	findHighlight,
	gameLabel,
	groupGames,
	highlightUrl,
	parseUploads
} from './game-links.js';

// grades every finished game that has ungraded picks on it, settles the tails and fades on those
// picks, then puts Box Score and Highlights links on finished games. Runs on a schedule from
// .github/workflows/mark-games.yml. Nothing in here changes week to week - what needs grading
// comes from the picks themselves.
//
//   node --env-file=.env scripts/mark-games.js            grade for real
//   node --env-file=.env scripts/mark-games.js --dry-run  print what it would grade and link, write nothing
//
// Highlights need YOUTUBE_API_KEY (a YouTube Data API v3 key). Without it, box scores are still added.

const DRY_RUN = process.argv.includes('--dry-run');

// ungraded picks that kicked off longer ago than this are left for a human, so one stuck pick
// can't stretch every run's ESPN request back to the start of the season. Links stop being looked
// for after the same window, which the admin results page mirrors
const LOOKBACK_DAYS = 14;

// the NFL channel's uploads - a channel's uploads playlist is its id (UCDVYQ4Zhbm3S2dlz7P1GBDg)
// with UC swapped for UU
const NFL_UPLOADS_PLAYLIST = 'UUDVYQ4Zhbm3S2dlz7P1GBDg';

// a stop for the paging in fetchUploads - 40 pages is 2,000 videos, and costs 40 of the 10,000
// quota units the API gives a key each day
const MAX_UPLOAD_PAGES = 40;

const DB_ENV = ['DB_USER', 'DB_PASS', 'DB_HOST', 'DB_DATABASE'];

function connect() {
	const missing = DB_ENV.filter((name) => !process.env[name]);
	if (missing.length > 0) throw new Error(`Missing env vars: ${missing.join(', ')}`);

	return new pg.Pool({
		user: process.env.DB_USER,
		password: process.env.DB_PASS,
		host: process.env.DB_HOST,
		port: 5432,
		database: process.env.DB_DATABASE,
		ssl: true
	});
}

async function fetchEvents(range) {
	const response = await fetch(
		`https://partners.api.espn.com/v2/sports/football/nfl/events?dates=${range}&limit=1000`
	);
	if (!response.ok) throw new Error(`ESPN events request failed: ${response.status}`);
	return parseEvents(await response.json());
}

// the NFL channel's uploads back to `since`. They come newest first, so paging stops once a page
// reaches back past it. The API key rides in the URL, so the URL is never logged
async function fetchUploads(since, apiKey) {
	const videos = [];
	let pageToken = '';

	for (let page = 0; page < MAX_UPLOAD_PAGES; page++) {
		const params = new URLSearchParams({
			part: 'snippet',
			playlistId: NFL_UPLOADS_PLAYLIST,
			maxResults: '50',
			key: apiKey
		});
		if (pageToken) params.set('pageToken', pageToken);

		const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`);
		const json = await response.json().catch(() => ({}));
		if (!response.ok) {
			// Google's error message says what's wrong ("API key not valid", quota) without the key
			throw new Error(
				`YouTube uploads request failed: ${response.status} ${json.error?.message ?? ''}`
			);
		}

		const batch = parseUploads(json);
		videos.push(...batch);

		pageToken = json.nextPageToken ?? '';
		const oldest = batch.at(-1);
		if (!pageToken || !oldest || oldest.publishedAt < since) break;
	}

	return videos;
}

const outcomeLabel = (grade) => (grade.push ? 'push' : grade.winner ? 'win' : 'loss');

async function gradeFinishedPicks(pool) {
	const { rows: pending } = await pool.query(
		`SELECT * FROM "Pick"
		WHERE winner IS NULL
		AND marked = FALSE
		AND game_date <= now()
		AND game_date > now() - make_interval(days => $1)`,
		[LOOKBACK_DAYS]
	);

	const { rows: skipped } = await pool.query(
		`SELECT count(*)::int AS count FROM "Pick"
		WHERE winner IS NULL
		AND marked = FALSE
		AND (game_date IS NULL OR game_date <= now() - make_interval(days => $1))`,
		[LOOKBACK_DAYS]
	);
	if (skipped[0].count > 0) {
		console.log(
			`${skipped[0].count} older ungraded picks skipped (no kickoff, or over ${LOOKBACK_DAYS} days ago)`
		);
	}

	if (pending.length === 0) {
		console.log('No kicked-off picks waiting on a grade');
		return;
	}

	const events = await fetchEvents(espnDateRange(pending, new Date()));
	let graded = 0;

	for (const pick of pending) {
		const event = findEvent(pick, events);
		if (!event) {
			console.warn(`No ESPN game found for pick ${pick.id}: ${pick.description}`);
			continue;
		}
		// still being played
		if (!event.completed) continue;

		const homeScore = event.scores[pick.home_team];
		const awayScore = event.scores[pick.away_team];
		const grade = gradePick(pick, homeScore, awayScore);
		if (!grade) {
			console.warn(`Can't grade pick ${pick.id}: ${pick.description} - check its line and team`);
			continue;
		}

		const result = resultLabel(pick, homeScore, awayScore);
		console.log(
			`${DRY_RUN ? '[dry run] ' : ''}${pick.person}: ${pick.description} -> ${outcomeLabel(grade)} (${result})`
		);

		if (!DRY_RUN) {
			// marked = FALSE again here, so two overlapping runs can never grade a pick twice
			await pool.query(
				`UPDATE "Pick"
				SET winner = $1,
					push = $2,
					home_team_score = $3,
					away_team_score = $4,
					result = $5,
					marked = TRUE,
					is_live = FALSE,
					completed = TRUE
				WHERE id = $6
				AND marked = FALSE`,
				[grade.winner, grade.push, homeScore, awayScore, result, pick.id]
			);
		}
		graded++;
	}

	console.log(`${DRY_RUN ? 'Would grade' : 'Graded'} ${graded} of ${pending.length} pending picks`);
}

// copies each graded pick's result onto the tails and fades that haven't been settled yet. Push
// is checked first: a pushed pick is saved as winner 0 + push 1, so checking winner first would
// settle every push as a tail loss and a fade win
async function markTailFade(pool) {
	const { rows: tails } = await pool.query(`
		SELECT t.id AS t_id, p.winner AS p_winner, p.push AS p_push
		FROM "Tail" t
		LEFT JOIN "Pick" p ON t.pick_id = p.id
		WHERE t.winner IS NULL
		AND t.push IS NULL
		AND p.winner IS NOT NULL
		AND p.marked = TRUE
		AND p.is_live = FALSE
	`);

	for (const tail of tails) {
		let result = null;
		if (tail.p_push === 1) result = { winner: 0, push: 1 };
		else if (tail.p_winner === 1) result = { winner: 1, push: 0 };
		else if (tail.p_winner === 0) result = { winner: 0, push: 0 };
		if (!result) continue;

		await pool.query(`UPDATE "Tail" SET winner = $1, push = $2 WHERE id = $3`, [
			result.winner,
			result.push,
			tail.t_id
		]);
	}

	const { rows: fades } = await pool.query(`
		SELECT f.id AS f_id, p.winner AS p_winner, p.push AS p_push
		FROM "Fade" f
		LEFT JOIN "Pick" p ON f.pick_id = p.id
		WHERE f.winner IS NULL
		AND f.push IS NULL
		AND p.winner IS NOT NULL
		AND p.marked = TRUE
		AND p.is_live = FALSE
	`);

	for (const fade of fades) {
		let result = null;
		if (fade.p_push === 1) result = { winner: 0, push: 1 };
		else if (fade.p_winner === 1) result = { winner: 0, push: 0 };
		else if (fade.p_winner === 0) result = { winner: 1, push: 0 };
		if (!result) continue;

		await pool.query(`UPDATE "Fade" SET winner = $1, push = $2 WHERE id = $3`, [
			result.winner,
			result.push,
			fade.f_id
		]);
	}

	console.log(`Settled ${tails.length} tails and ${fades.length} fades`);
}

// puts the Box Score and Highlights links on the official picks (the only ones the week page shows
// links on) for finished games from the last LOOKBACK_DAYS. Box scores come straight from the ESPN
// game; highlights only go up on YouTube a few hours after the final whistle, so a game is retried
// every run until its video turns up. A link that's already there, typed in or not, is left alone
async function addGameLinks(pool) {
	const { rows: picks } = await pool.query(
		`SELECT * FROM "Pick"
		WHERE barstool_employee = TRUE
		AND pmt_persona = TRUE
		AND game_date <= now()
		AND game_date > now() - make_interval(days => $1)
		AND (coalesce(espn_link, '') = '' OR coalesce(highlight_link, '') = '')`,
		[LOOKBACK_DAYS]
	);
	if (picks.length === 0) {
		console.log('No recent games missing links');
		return;
	}

	const games = groupGames(picks, await fetchEvents(espnDateRange(picks, new Date())));
	const prefix = DRY_RUN ? '[dry run] ' : '';

	for (const game of games.filter((game) => game.needBoxScore.length > 0)) {
		const url = boxScoreUrl(game.espnEventId);
		console.log(`${prefix}Box score for ${gameLabel(game)}: ${url}`);
		if (!DRY_RUN) {
			// the empty check again here, so a link added by hand since the select above survives
			await pool.query(
				`UPDATE "Pick" SET espn_link = $1 WHERE id = ANY($2) AND coalesce(espn_link, '') = ''`,
				[url, game.needBoxScore]
			);
		}
	}

	const needHighlights = games.filter((game) => game.needHighlights.length > 0);
	if (needHighlights.length === 0) return;

	const apiKey = process.env.YOUTUBE_API_KEY;
	if (!apiKey) {
		console.log(
			`YOUTUBE_API_KEY isn't set - skipping highlights for ${needHighlights.length} games`
		);
		return;
	}

	const earliestKickoff = new Date(
		Math.min(...needHighlights.map((game) => game.kickoff.getTime()))
	);
	const videos = await fetchUploads(earliestKickoff, apiKey);
	const waiting = [];

	for (const game of needHighlights) {
		const video = findHighlight(game, videos);
		if (!video) {
			waiting.push(gameLabel(game));
			continue;
		}

		const url = highlightUrl(video.videoId);
		console.log(`${prefix}Highlights for ${gameLabel(game)}: ${url} (${video.title})`);
		if (!DRY_RUN) {
			await pool.query(
				`UPDATE "Pick" SET highlight_link = $1 WHERE id = ANY($2) AND coalesce(highlight_link, '') = ''`,
				[url, game.needHighlights]
			);
		}
	}

	if (waiting.length > 0) {
		console.log(`No highlights found yet for ${waiting.join(', ')} - trying again next run`);
	}
}

async function main() {
	const pool = connect();
	try {
		await gradeFinishedPicks(pool);
		// tails and fades come off the picks just graded, so they wait for the real thing
		if (!DRY_RUN) await markTailFade(pool);
		// last, so a YouTube outage or a bad key can never hold up grading
		await addGameLinks(pool);
	} finally {
		await pool.end();
	}
}

// a failed run exits non-zero, so it shows up as a failed GitHub Action (and GitHub's failed-run
// email) instead of passing quietly the way the old script did
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
