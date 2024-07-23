import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

type TailFadeRawQuery = {
	username: string;
	total_tails: number;
	tail_wins: number;
	tail_push: number;
	total_fades: number;
	fade_wins: number;
	fade_push: number;
};

interface TailFadeStats extends TailFadeRawQuery {
	tail_pct: number;
	fade_pct: number;
}

export const load: PageServerLoad = async () => {
	const winsByUser = await await prisma.$queryRaw`
	SELECT u.username as username,
		COUNT(p.winner) as total_picks,
    	SUM(p.winner) as wins,
    	SUM(p.push) as pushes,
		COUNT(u.id) as user_count
	   FROM "User" u
	   LEFT JOIN "Pick" p ON u.id = p.user_id
	--    WHERE p.year = 2023
	   GROUP BY u.username;
	`;

	const tailsAndFadesByUser: TailFadeRawQuery[] = await await prisma.$queryRaw`
	SELECT u.username,
	   COALESCE(t.tail_count, 0) as total_tails,
	   COALESCE(t.tail_winner, 0) as tail_wins,
	   COALESCE(t.tail_push, 0) as tail_push,
	   COALESCE(f.fade_count, 0) as total_fades,
	   COALESCE(f.fade_winner, 0) as fade_wins,
	   COALESCE(f.fade_push, 0) as fade_push
	   FROM "User" u
	   LEFT JOIN (
	    SELECT t.user_id,
	       COUNT(t.id) as tail_count,
	       SUM(t.winner) as tail_winner,
	       SUM(t.push) as tail_push
	    FROM "Tail" t
	    GROUP BY t.user_id
	   ) t ON u.id = t.user_id
	   LEFT JOIN (
	    SELECT f.user_id,
	       COUNT(f.id) as fade_count,
	       SUM(f.winner) as fade_winner,
	       SUM(f.push) as fade_push
	    FROM "Fade" f
	    GROUP BY f.user_id
	   ) f ON u.id = f.user_id;
	   `;

	const tailFadeStats: TailFadeStats[] = tailsAndFadesByUser.map((user) => {
		const tailWins = Number(user.tail_wins);
		const totalTails = Number(user.total_tails);
		const tailPush = Number(user.tail_push);
		const fadeWins = Number(user.fade_wins);
		const totalFades = Number(user.total_fades);
		const fadePush = Number(user.fade_push);

		const tail_pct = parseFloat(((tailWins / (totalTails - tailPush)) * 100).toFixed(2));
		const fade_pct = parseFloat(((fadeWins / (totalFades - fadePush)) * 100).toFixed(2));

		return {
			username: user.username,
			total_tails: user.total_tails,
			tail_wins: user.tail_wins,
			tail_push: user.tail_push,
			tail_pct: tail_pct,
			total_fades: user.total_fades,
			fade_wins: user.fade_wins,
			fade_push: user.fade_push,
			fade_pct: fade_pct
		};
	});
	console.log('tailFadeStats', tailFadeStats);

	return {
		wins: winsByUser
		// tailFade: tailFadeStats
	};
};
