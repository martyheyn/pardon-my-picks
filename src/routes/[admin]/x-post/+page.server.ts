import { prisma } from '$lib/server/prisma';
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { CURRENT_YEAR } from '$env/static/private';
import { getSeasonStats } from '$lib/server/host-stats';
import { nameLookup } from '$lib/server/cards/data';
import { customFadeLine } from '$lib/server/x-bot/run';
import { postUrl } from '$lib/server/x-bot/x-client';
import { generateSecureRandomString } from '$lib/utils/helpers';
import { getCurrentWeek } from '$lib/utils/nfl-week';
import {
	canAttempt,
	cleanFadeLine,
	defaultFadeLine,
	fadeLineError,
	fadePostText
} from '$lib/utils/x-bot';

// where the admin writes their own middle line for this week's "who to fade" post on X. The bot
// reads it when the post goes out (src/lib/server/x-bot/run.ts), so it only counts if it's saved
// before then. Once the post is out the line is locked

const thisWeek = () => {
	const year = Number(CURRENT_YEAR);
	return { year, week: getCurrentWeek(year) };
};

const fadePostRow = (year: number, week: number) =>
	prisma.botPost.findUnique({
		where: { type_year_week: { type: 'fade', year, week } },
		select: {
			type: true,
			year: true,
			week: true,
			status: true,
			attempts: true,
			text: true,
			xPostId: true
		}
	});

// why the line can't change any more - the post is out, or a run is posting it - or null
const lockedReason = async (year: number, week: number) => {
	const attempt = canAttempt((await fadePostRow(year, week)) ?? undefined);
	return attempt.ok ? null : `Week ${week}'s post can't change any more: ${attempt.reason}`;
};

const denyNonAdmins = (user: App.Locals['user']) => {
	if (!user) return fail(401, { message: 'Unauthorized brah!!', success: false });
	if (user.role !== 'admin') return fail(403, { message: 'Forbidden', success: false });
	return null;
};

// the form says which week it was showing, so a page left open over Wednesday's rollover can't
// save last week's line onto the new week
const wrongWeek = (formData: FormData, week: number) =>
	Number(formData.get('week')) !== week
		? fail(409, {
				message: `It's week ${week} now - reload the page and check the post before saving`,
				success: false
			})
		: null;

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;
	if (!user || user.role !== 'admin') {
		throw redirect(303, '/');
	}

	const { year, week } = thisWeek();
	const [{ picks, stats, hosts }, savedLine, post] = await Promise.all([
		getSeasonStats(year),
		customFadeLine(year, week),
		fadePostRow(year, week)
	]);

	const weekPicks = picks.filter((pick) => pick.week === week);
	const nameOf = nameLookup(hosts);
	const attempt = canAttempt(post ?? undefined);

	return {
		week,
		savedLine,
		defaultLine: defaultFadeLine({ stats, weekPicks, nameOf }),
		// the post as it would go out right now - null until the week has picks
		preview:
			weekPicks.length > 0
				? fadePostText({ week, stats, weekPicks, nameOf, customLine: savedLine })
				: null,
		locked: attempt.ok
			? null
			: {
					reason: attempt.reason,
					text: post?.text ?? null,
					url: post?.xPostId ? postUrl(post.xPostId) : null
				}
	};
};

export const actions: Actions = {
	saveLine: async ({ locals, request }) => {
		const denied = denyNonAdmins(locals.user);
		if (denied) return denied;

		const { year, week } = thisWeek();
		const formData = await request.formData();
		const outdated = wrongWeek(formData, week);
		if (outdated) return outdated;

		const text = cleanFadeLine(String(formData.get('line') ?? ''));
		const invalid = fadeLineError(week, text);
		if (invalid) return fail(400, { message: invalid, success: false });

		try {
			const locked = await lockedReason(year, week);
			if (locked) return fail(409, { message: locked, success: false });

			await prisma.botFadeLine.upsert({
				where: { year_week: { year, week } },
				create: { id: generateSecureRandomString(18), year, week, text },
				update: { text }
			});
		} catch (error) {
			console.error('saving the fade line failed', error);
			return fail(500, { message: 'Saving the line failed - try again', success: false });
		}

		return { message: `Saved. Week ${week}'s fade post will use your line.`, success: true };
	},

	clearLine: async ({ locals, request }) => {
		const denied = denyNonAdmins(locals.user);
		if (denied) return denied;

		const { year, week } = thisWeek();
		const outdated = wrongWeek(await request.formData(), week);
		if (outdated) return outdated;

		try {
			const locked = await lockedReason(year, week);
			if (locked) return fail(409, { message: locked, success: false });

			await prisma.botFadeLine.deleteMany({ where: { year, week } });
		} catch (error) {
			console.error('clearing the fade line failed', error);
			return fail(500, { message: 'Clearing the line failed - try again', success: false });
		}

		return { message: `Week ${week}'s fade post is back to the default line.`, success: true };
	}
};
