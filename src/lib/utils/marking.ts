import { prisma } from '$lib/server/prisma';
import type { Scores } from '$lib/utils/types';
import { ODDS_API_KEY } from '$env/static/private';
import type { $Enums } from '@prisma/client';

type markGames = {
	gameId: string;
	homeTeam: $Enums.NFLTeam;
	awayTeam: $Enums.NFLTeam;
	homeTeamScore: number | null;
	awayTeamScore: number | null;
}[];

// export const markGames = async (games: markGames) => {
// 	const scoresDataRaw = await prisma.pick.findMany({
// 		where: {
// 			completed: false
// 		}
// 	});
// };
