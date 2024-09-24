import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

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

export const load: PageServerLoad = async () => {
	const winsByUser: WinsByUser[] = await prisma.$queryRaw`
	SELECT u.username as username,
		COUNT(p.id) as total_picks,
    	SUM(p.winner) as wins,
    	SUM(p.push) as pushes,
		(SUM(p.winner)* 100.0) / ((COUNT(p.id)* 100.0) - (SUM(p.push)* 100.0)) as win_pct
	   FROM "User" u
	   LEFT JOIN "Pick" p ON u.id = p.user_id
	   WHERE p.year = 2024
	   AND p.pmt_persona = false
	   GROUP BY u.username
	   HAVING COUNT(p.id) > 0
	   ORDER BY wins DESC, win_pct DESC
	   LIMIT 10
	`;

	const winStats: LeaderboardStats[] = winsByUser.map((user) => {
		const wins = Number(user.wins);
		const totalPicks = Number(user.total_picks);
		const pushes = Number(user.pushes);

		const pct = parseFloat(((wins / (totalPicks - pushes)) * 100).toFixed(0));

		return {
			username: user.username,
			wins: user.wins,
			losses: totalPicks - wins - pushes,
			pushes: user.pushes,
			pct: pct
		};
	});

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
	    GROUP BY t.user_id
	    HAVING COUNT(t.id) > 0
	   ) t ON u.id = t.user_id
	   ORDER BY tail_wins DESC, tail_pct DESC
	   LIMIT 10;
	`;

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
	   	 GROUP BY f.user_id
	     HAVING COUNT(f.id) > 0
		) f ON u.id = f.user_id
		ORDER BY fade_wins DESC, fade_pct DESC
		LIMIT 10;
	`;

	const tailStats: LeaderboardStats[] = tailsByUser.map((user) => {
		const tailWins = Number(user.tail_wins);
		const totalTails = Number(user.total_tails);
		const tailPush = Number(user.tail_push);

		const tail_pct = parseFloat(((tailWins / (totalTails - tailPush)) * 100).toFixed(0));

		return {
			username: user.username,
			wins: user.tail_wins,
			losses: totalTails - tailWins - tailPush,
			pushes: user.tail_push,
			pct: tail_pct
		};
	});

	const fadeStats: LeaderboardStats[] = fadesByUser.map((user) => {
		const fadeWins = Number(user.fade_wins);
		const totalFades = Number(user.total_fades);
		const fadePush = Number(user.fade_push);

		const fade_pct = parseFloat(((fadeWins / (totalFades - fadePush)) * 100).toFixed(0));

		return {
			username: user.username,
			wins: user.fade_wins,
			losses: totalFades - fadeWins - fadePush,
			pushes: user.fade_push,
			pct: fade_pct
		};
	});

	const totalWins: total[] = await prisma.$queryRaw`
			SELECT COUNT(DISTINCT user_id) as total
			FROM "Pick"
			WHERE year = 2024
			AND pmt_persona = false;`;

	const totalTails: total[] = await prisma.$queryRaw`
			SELECT COUNT(DISTINCT user_id) as total
			FROM "Tail";`;

	const totalFades: total[] = await prisma.$queryRaw`
			SELECT COUNT(DISTINCT user_id) as total
			FROM "Fade";`;

	const totalCounts = {
		wins: totalWins[0].total,
		tails: totalTails[0].total,
		fades: totalFades[0].total
	};

	return {
		wins: winStats,
		tails: tailStats,
		fades: fadeStats,
		totalCounts: totalCounts
	};
};

export const actions: Actions = {
	winsTotal: async ({ url }) => {
		const page = Number(url.searchParams.get('page'));

		const winsByUser: WinsByUser[] = await prisma.$queryRaw`
			SELECT u.username as username,
			COUNT(p.id) as total_picks,
			SUM(p.winner) as wins,
			SUM(p.push) as pushes,
			(SUM(p.winner)* 100.0) / ((COUNT(p.id)* 100.0) - (SUM(p.push)* 100.0)) as win_pct
			FROM "User" u
			LEFT JOIN "Pick" p ON u.id = p.user_id
			WHERE p.year = 2024
			AND p.pmt_persona = false
			GROUP BY u.username
			HAVING COUNT(p.id) > 0
			ORDER BY wins DESC, win_pct DESC
			LIMIT 10 OFFSET ${page * 10};
		`;

		const winStats: LeaderboardStats[] = winsByUser.map((user) => {
			const wins = Number(user.wins);
			const totalPicks = Number(user.total_picks);
			const pushes = Number(user.pushes);

			const pct = parseFloat(((wins / (totalPicks - pushes)) * 100).toFixed(0));

			return {
				username: user.username,
				wins: user.wins,
				losses: totalPicks - wins - pushes,
				pushes: user.pushes,
				pct: pct
			};
		});

		return {
			wins: winStats
		};
	},

	tailsTotal: async ({ url }) => {
		const page = Number(url.searchParams.get('page'));

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
				GROUP BY t.user_id
				HAVING COUNT(t.id) > 0
			) t ON u.id = t.user_id
			ORDER BY tail_wins DESC, tail_pct DESC
			LIMIT 10 OFFSET ${page * 10};
		`;

		const tailStats: LeaderboardStats[] = tailsByUser.map((user) => {
			const tailWins = Number(user.tail_wins);
			const totalTails = Number(user.total_tails);
			const tailPush = Number(user.tail_push);

			const tail_pct = parseFloat(((tailWins / (totalTails - tailPush)) * 100).toFixed(0));

			return {
				username: user.username,
				wins: user.tail_wins,
				losses: totalTails - tailWins - tailPush,
				pushes: user.tail_push,
				pct: tail_pct
			};
		});

		return {
			tails: tailStats
		};
	},

	fadesTotal: async ({ url }) => {
		const page = Number(url.searchParams.get('page'));

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
			GROUP BY f.user_id
			HAVING COUNT(f.id) > 0
			) f ON u.id = f.user_id
			ORDER BY fade_wins DESC, fade_pct DESC
			LIMIT 10 OFFSET ${page * 10};
		`;

		const fadeStats: LeaderboardStats[] = fadesByUser.map((user) => {
			const fadeWins = Number(user.fade_wins);
			const totalFades = Number(user.total_fades);
			const fadePush = Number(user.fade_push);

			const fade_pct = parseFloat(((fadeWins / (totalFades - fadePush)) * 100).toFixed(0));

			return {
				username: user.username,
				wins: user.fade_wins,
				losses: totalFades - fadeWins - fadePush,
				pushes: user.fade_push,
				pct: fade_pct
			};
		});

		return {
			fades: fadeStats
		};
	}
};
