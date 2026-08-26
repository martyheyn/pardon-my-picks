import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { CURRENT_YEAR } from '$env/static/private';

type LeaderboardStats = {
	username: string;
	wins: number;
	losses: number;
	pushes: number;
	pct: number;
};

type WinsByUser = {
	username: string;
	total_picks: number;
	wins: number;
	pushes: number;
};

type TailRawQuery = {
	username: string;
	total_tails: number;
	tail_wins: number;
	tail_push: number;
};

type FadeRawQuery = {
	username: string;
	total_fades: number;
	fade_wins: number;
	fade_push: number;
};

type total = {
	total: number;
};

type yearRow = {
	year: number;
};

type LeaderboardPage = {
	stats: LeaderboardStats[];
	total: number;
};

const getAvailableYears = async (): Promise<number[]> => {
	const rows: yearRow[] = await prisma.$queryRaw`
		SELECT DISTINCT year FROM "Pick" WHERE pmt_persona = false ORDER BY year DESC;
	`;
	return rows.map((row) => row.year);
};

const fetchWins = async (year: number, page: number): Promise<LeaderboardPage> => {
	const winsByUser: WinsByUser[] = await prisma.$queryRaw`
	SELECT u.username as username,
		COUNT(p.id) as total_picks,
    	SUM(p.winner) as wins,
    	SUM(p.push) as pushes,
		CASE
			WHEN COUNT(p.id) - SUM(p.push) = 0 THEN .1
		ELSE
			(SUM(p.winner)* 100.0) / ((COUNT(p.id)* 100.0) - (SUM(p.push)* 100.0))
		END as win_pct
	   FROM "User" u
	   LEFT JOIN "Pick" p ON u.id = p.user_id
	   WHERE p.year = ${year}
	   AND p.pmt_persona = false
	   AND p.winner IS NOT NULL
	   GROUP BY u.username
	   HAVING COUNT(p.id) > 0
	   ORDER BY wins DESC, win_pct DESC
	   LIMIT 10 OFFSET ${page * 10};
	`;

	const stats: LeaderboardStats[] = winsByUser.map((user) => {
		const wins = Number(user.wins);
		const totalPicks = Number(user.total_picks);
		const pushes = Number(user.pushes);

		const pct =
			totalPicks - pushes === 0 ? 0 : parseFloat(((wins / (totalPicks - pushes)) * 100).toFixed(0));

		return {
			username: user.username,
			wins: user.wins,
			losses: totalPicks - wins - pushes,
			pushes: user.pushes,
			pct: pct
		};
	});

	const totalRows: total[] = await prisma.$queryRaw`
			SELECT COUNT(DISTINCT user_id) as total
			FROM "Pick"
			WHERE year = ${year}
			AND pmt_persona = false
			AND winner IS NOT NULL;`;

	return { stats, total: Number(totalRows[0].total) };
};

const fetchTails = async (year: number, page: number): Promise<LeaderboardPage> => {
	const tailsByUser: TailRawQuery[] = await prisma.$queryRaw`
	SELECT u.username,
	   COALESCE(t.tail_count, 0) as total_tails,
	   COALESCE(t.tail_winner, 0) as tail_wins,
	   COALESCE(t.tail_push, 0) as tail_push,
	   CASE
	   		WHEN COALESCE(t.tail_count, 0) - COALESCE(t.tail_push, 0) = 0 THEN .1
		ELSE
			(COALESCE(t.tail_winner, 0) * 100.0) / ((COALESCE(t.tail_count, 0) * 100.0) - (COALESCE(t.tail_push, 0) * 100.0))
		END as tail_pct
	   FROM "User" u
	   INNER JOIN (
	    SELECT t.user_id,
	       COUNT(t.id) as tail_count,
	       SUM(t.winner) as tail_winner,
	       SUM(t.push) as tail_push
	    FROM "Tail" t
		LEFT JOIN "Pick" p ON p.id = t.pick_id
		WHERE t.winner IS NOT NULL
		AND year = ${year}
	    GROUP BY t.user_id
	    HAVING COUNT(t.id) > 0
	   ) t ON u.id = t.user_id
	   ORDER BY tail_wins DESC, tail_pct DESC
	   LIMIT 10 OFFSET ${page * 10};
	`;

	const stats: LeaderboardStats[] = tailsByUser.map((user) => {
		const tailWins = Number(user.tail_wins);
		const totalTails = Number(user.total_tails);
		const tailPush = Number(user.tail_push);

		const tail_pct =
			totalTails - tailPush === 0
				? 0
				: parseFloat(((tailWins / (totalTails - tailPush)) * 100).toFixed(0));

		return {
			username: user.username,
			wins: user.tail_wins,
			losses: totalTails - tailWins - tailPush,
			pushes: user.tail_push,
			pct: tail_pct
		};
	});

	const totalRows: total[] = await prisma.$queryRaw`
			SELECT COUNT(DISTINCT t.user_id) as total
			FROM "Tail" t
			LEFT JOIN "Pick" p ON p.id = t.pick_id
			WHERE t.winner IS NOT NULL
			AND year = ${year};`;

	return { stats, total: Number(totalRows[0].total) };
};

const fetchFades = async (year: number, page: number): Promise<LeaderboardPage> => {
	const fadesByUser: FadeRawQuery[] = await prisma.$queryRaw`
		SELECT u.username,
	   	COALESCE(f.fade_count, 0) as total_fades,
	   	COALESCE(f.fade_winner, 0) as fade_wins,
	   	COALESCE(f.fade_push, 0) as fade_push,
		CASE
	   		WHEN COALESCE(f.fade_count, 0) - COALESCE(f.fade_push, 0) = 0 THEN .1
		ELSE
			(COALESCE(f.fade_winner, 0) * 100.0) / ((COALESCE(f.fade_count, 0) * 100.0) - (COALESCE(f.fade_push, 0) * 100.0))
		END as fade_pct

	   	FROM "User" u
	   	INNER JOIN (
	   	 SELECT f.user_id,
	   	    COUNT(f.id) as fade_count,
	   	    SUM(f.winner) as fade_winner,
	   	    SUM(f.push) as fade_push
	   	 FROM "Fade" f
		 LEFT JOIN "Pick" p ON p.id = f.pick_id
		 WHERE f.winner IS NOT NULL
		 AND year = ${year}
	   	 GROUP BY f.user_id
	     HAVING COUNT(f.id) > 0
		) f ON u.id = f.user_id
		ORDER BY fade_wins DESC, fade_pct DESC
		LIMIT 10 OFFSET ${page * 10};
	`;

	const stats: LeaderboardStats[] = fadesByUser.map((user) => {
		const fadeWins = Number(user.fade_wins);
		const totalFades = Number(user.total_fades);
		const fadePush = Number(user.fade_push);

		const fade_pct =
			totalFades - fadePush === 0
				? 0
				: parseFloat(((fadeWins / (totalFades - fadePush)) * 100).toFixed(0));

		return {
			username: user.username,
			wins: user.fade_wins,
			losses: totalFades - fadeWins - fadePush,
			pushes: user.fade_push,
			pct: fade_pct
		};
	});

	const totalRows: total[] = await prisma.$queryRaw`
			SELECT COUNT(DISTINCT f.user_id) as total
			FROM "Fade" f
			LEFT JOIN "Pick" p ON p.id = f.pick_id
			WHERE f.winner IS NOT NULL
			AND year = ${year};`;

	return { stats, total: Number(totalRows[0].total) };
};

export const load: PageServerLoad = async () => {
	const currYear = Number(CURRENT_YEAR);

	const [years, wins, tails, fades] = await Promise.all([
		getAvailableYears(),
		fetchWins(currYear, 0),
		fetchTails(currYear, 0),
		fetchFades(currYear, 0)
	]);

	return {
		wins: wins.stats,
		tails: tails.stats,
		fades: fades.stats,
		totalCounts: {
			wins: wins.total,
			tails: tails.total,
			fades: fades.total
		},
		years,
		selectedYear: currYear
	};
};

const yearFromParams = (url: URL) => {
	const year = Number(url.searchParams.get('year'));
	return year || Number(CURRENT_YEAR);
};

export const actions: Actions = {
	winsTotal: async ({ url }: { url: URL }) => {
		const page = Number(url.searchParams.get('page'));
		const year = yearFromParams(url);
		const { stats, total } = await fetchWins(year, page);

		return { wins: stats, total, year };
	},

	tailsTotal: async ({ url }: { url: URL }) => {
		const page = Number(url.searchParams.get('page'));
		const year = yearFromParams(url);
		const { stats, total } = await fetchTails(year, page);

		return { tails: stats, total, year };
	},

	fadesTotal: async ({ url }: { url: URL }) => {
		const page = Number(url.searchParams.get('page'));
		const year = yearFromParams(url);
		const { stats, total } = await fetchFades(year, page);

		return { fades: stats, total, year };
	}
};
