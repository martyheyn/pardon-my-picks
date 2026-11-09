import { createHash, timingSafeEqual } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { CURRENT_YEAR } from '$env/static/private';
import { prisma } from '$lib/server/prisma';
import { getSeasonStats } from '$lib/server/host-stats';
import { fridayFadeData, nameLookup, weeklyStandingsData } from '$lib/server/cards/data';
import { renderCard } from '$lib/server/cards/render';
import { fridayFade } from '$lib/server/cards/templates/friday-fade';
import { weeklyStandings } from '$lib/server/cards/templates/weekly-standings';
import { generateSecureRandomString } from '$lib/utils/helpers';
import {
	MAX_ATTEMPTS,
	decideFadePost,
	decideStandingsPost,
	fadePostText,
	standingsPostText,
	type BotPostType
} from '$lib/utils/x-bot';
import type { OAuthCredentials } from './oauth';
import { publishPost, type BotPostKey, type BotPostStore } from './publish';
import { createXClient, postUrl } from './x-client';

// the X bot's run: decide what's ready, draw it, post it. POST /bot/run calls this for the GitHub
// Action (.github/workflows/x-bot.yml); the rules for when to post live in $lib/utils/x-bot.
//
// Bot env vars are read through $env/dynamic so a missing one just leaves the bot in dry run -
// $env/static would fail the build (and `npm run dev`) wherever they aren't set

type Season = Awaited<ReturnType<typeof getSeasonStats>>;

export type BotRunItem = {
	type: BotPostType;
	year: number;
	week: number | null;
	action: 'posted' | 'would-post' | 'skipped' | 'failed' | 'stuck';
	reason?: string;
	text?: string;
	postUrl?: string;
	// size of the rendered card, so a dry run shows it drew
	imageBytes?: number;
};

export type BotRunSummary = {
	live: boolean;
	// why nothing will be posted this run, when it won't
	dryRunReason: string | null;
	items: BotRunItem[];
};

type PostingMode = { live: true; credentials: OAuthCredentials } | { live: false; reason: string };

function xCredentials(): OAuthCredentials | null {
	const { X_API_KEY, X_API_KEY_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET } = env;
	if (!X_API_KEY || !X_API_KEY_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_TOKEN_SECRET) return null;
	return {
		consumerKey: X_API_KEY,
		consumerSecret: X_API_KEY_SECRET,
		token: X_ACCESS_TOKEN,
		tokenSecret: X_ACCESS_TOKEN_SECRET
	};
}

// every switch has to be on before anything is posted. Local dev can never post
function postingMode(dryRunRequested: boolean): PostingMode {
	if (dev) return { live: false, reason: 'local dev never posts' };
	if (dryRunRequested) return { live: false, reason: 'dry run requested' };
	if (env.X_BOT_POSTING !== 'on') return { live: false, reason: "X_BOT_POSTING isn't 'on'" };

	const credentials = xCredentials();
	if (!credentials) return { live: false, reason: 'X credentials are missing' };
	return { live: true, credentials };
}

// the bearer secret the GitHub Action sends. Compared as hashes so the check takes the same time
// however much of a wrong secret matches. Skipped in local dev, which can't post anyway
export function isBotRequest(request: Request): boolean {
	if (dev) return true;

	const secret = env.BOT_SECRET;
	if (!secret) return false;

	const digest = (value: string) => createHash('sha256').update(value).digest();
	const given = request.headers.get('authorization') ?? '';
	return timingSafeEqual(digest(given), digest(`Bearer ${secret}`));
}

export type FadePostSettings = {
	// the admin's own middle line, or null for the default (or no line at all, in a no-fade week)
	line: string | null;
	// false when the admin set the week to no fade - nobody is named or marked
	callFade: boolean;
};

// the admin's settings for a week's fade post, written on /admin/x-post. With no row it's a fade
// with the default line
export async function fadePostSettings(year: number, week: number): Promise<FadePostSettings> {
	const row = await prisma.botFadeLine.findUnique({
		where: { year_week: { year, week } },
		select: { text: true, callFade: true }
	});
	return { line: row?.text ?? null, callFade: row?.callFade ?? true };
}

// the card and the text for one post - also what the /bot/[card].png preview draws
export async function buildPost(
	type: BotPostType,
	year: number,
	week: number,
	{ picks, stats, hosts }: Season
): Promise<{ text: string; png: Uint8Array } | null> {
	const nameOf = nameLookup(hosts);

	if (type === 'fade') {
		const weekPicks = picks.filter((pick) => pick.week === week);
		if (weekPicks.length === 0) return null;

		// read once and handed to both, so the card and the text agree on whether there's a fade
		const { line, callFade } = await fadePostSettings(year, week);
		const data = await fridayFadeData(week, weekPicks, stats, hosts, callFade);
		return {
			text: fadePostText({ week, stats, weekPicks, nameOf, customLine: line, callFade }),
			png: await renderCard(fridayFade, data)
		};
	}

	// the standings card is always the latest graded week
	if (stats.latestCompletedWeek !== week) return null;
	const data = await weeklyStandingsData(year, stats, hosts);
	if (!data) return null;
	return {
		text: standingsPostText({ week, stats, nameOf }),
		png: await renderCard(weeklyStandings, data)
	};
}

const MAX_ERROR_LENGTH = 1000;

const rowKey = (key: BotPostKey) => ({ type: key.type, year: key.year, week: key.week });

const prismaStore: BotPostStore = {
	async claim(key, text) {
		try {
			await prisma.botPost.create({
				data: { id: generateSecureRandomString(18), ...rowKey(key), status: 'posting', text }
			});
			return true;
		} catch (err) {
			const alreadyThere =
				err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
			if (!alreadyThere) throw err;
		}

		// a row exists - only a failed one with tries left can be taken back. The status check in the
		// where clause means two runs racing for it can't both win
		const { count } = await prisma.botPost.updateMany({
			where: { ...rowKey(key), status: 'failed', attempts: { lt: MAX_ATTEMPTS } },
			data: { status: 'posting', attempts: { increment: 1 }, text, error: null }
		});
		return count === 1;
	},

	async markPosted(key, xPostId) {
		await prisma.botPost.updateMany({
			where: rowKey(key),
			data: { status: 'posted', xPostId, error: null }
		});
	},

	async markFailed(key, error) {
		await prisma.botPost.updateMany({
			where: rowKey(key),
			data: { status: 'failed', error: error.slice(0, MAX_ERROR_LENGTH) }
		});
	},

	async markStuck(key, error) {
		await prisma.botPost.updateMany({
			where: rowKey(key),
			data: { error: error.slice(0, MAX_ERROR_LENGTH) }
		});
	}
};

export async function runBot({
	now = new Date(),
	dryRun = false
}: {
	now?: Date;
	dryRun?: boolean;
} = {}): Promise<BotRunSummary> {
	const year = Number(CURRENT_YEAR);
	const mode = postingMode(dryRun);

	const season = await getSeasonStats(year);
	const existing = await prisma.botPost.findMany({
		where: { year },
		select: { type: true, year: true, week: true, status: true, attempts: true }
	});

	const decisions = [
		decideFadePost({ year, now, picks: season.picks, existing }),
		decideStandingsPost({ year, now, stats: season.stats, existing })
	];

	const items: BotRunItem[] = [];
	for (const decision of decisions) {
		const { type, week } = decision;
		if (!decision.post) {
			items.push({ type, year, week, action: 'skipped', reason: decision.reason });
			continue;
		}

		const post = await buildPost(type, year, decision.week, season);
		if (!post) {
			items.push({ type, year, week, action: 'skipped', reason: 'nothing to draw' });
			continue;
		}

		const drawn = { text: post.text, imageBytes: post.png.byteLength };
		if (!mode.live) {
			items.push({ type, year, week, action: 'would-post', reason: mode.reason, ...drawn });
			continue;
		}

		const result = await publishPost({
			key: { type, year, week: decision.week },
			text: post.text,
			png: post.png,
			store: prismaStore,
			x: createXClient(mode.credentials)
		});

		if (result.outcome === 'posted') {
			items.push({ type, year, week, action: 'posted', postUrl: postUrl(result.postId), ...drawn });
		} else if (result.outcome === 'claimed-elsewhere') {
			items.push({ type, year, week, action: 'skipped', reason: 'another run claimed it' });
		} else {
			items.push({ type, year, week, action: result.outcome, reason: result.error, ...drawn });
		}
	}

	return { live: mode.live, dryRunReason: mode.live ? null : mode.reason, items };
}

// the account the bot is meant to post as. /bot/check flags keys made for any other account - an
// app created while signed in to a personal account would post as that person
export const BOT_ACCOUNT_HANDLE = 'pardon_my_pick';

export type ConnectionCheck = {
	ok: boolean;
	// whose account the access token posts as, when X answered
	account: string | null;
	isBotAccount: boolean;
	// set when the latest standings card uploaded - nothing posts with it, and X lets it expire
	mediaId: string | null;
	error: string | null;
};

// tries the X keys without posting: looks up whose account they belong to, then uploads the latest
// standings card. Ignores X_BOT_POSTING and never writes to the db, so it's safe before going live
export async function checkConnection(): Promise<ConnectionCheck> {
	const result: ConnectionCheck = {
		ok: false,
		account: null,
		isBotAccount: false,
		mediaId: null,
		error: null
	};

	const credentials = xCredentials();
	if (!credentials) return { ...result, error: 'X credentials are missing' };
	const x = createXClient(credentials);

	try {
		const handle = await x.accountHandle();
		result.account = `@${handle}`;
		result.isBotAccount = handle.toLowerCase() === BOT_ACCOUNT_HANDLE;
		if (!result.isBotAccount) {
			return { ...result, error: `these keys post as @${handle}, not @${BOT_ACCOUNT_HANDLE}` };
		}

		const year = Number(CURRENT_YEAR);
		const season = await getSeasonStats(year);
		const week = season.stats.latestCompletedWeek;
		const post = week === null ? null : await buildPost('standings', year, week, season);
		if (!post)
			return { ...result, error: 'no graded week yet, so no card to test the upload with' };

		result.mediaId = await x.uploadImage(post.png);
		return { ...result, ok: true };
	} catch (err) {
		return { ...result, error: err instanceof Error ? err.message : String(err) };
	}
}
