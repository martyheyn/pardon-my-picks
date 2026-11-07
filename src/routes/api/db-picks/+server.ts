import type { PickData } from '$lib/utils/types';
import { CURRENT_YEAR } from '$env/static/private';
import { getCurrentWeek } from '$lib/utils/nfl-week';
import { prisma } from '$lib/server/prisma';

const getDbUserPicks = async (userId: string) => {
	const dbUserPicks: PickData[] = await prisma.pick.findMany({
		where: {
			userId: userId,
			year: parseInt(CURRENT_YEAR),
			week: getCurrentWeek(Number(CURRENT_YEAR))
		},
		select: {
			id: true,
			gameId: true,
			show: true,
			type: true,
			description: true,
			homeTeam: true,
			awayTeam: true,
			pickTeam: true,
			gameDate: true,
			winner: true,
			push: true,
			marked: true
		}
	});

	return dbUserPicks;
};

export async function GET({ locals }) {
	const { user } = locals;
	if (!user) {
		return new Response(JSON.stringify({ picks: [] }));
	}
	const dbUserPicks = await getDbUserPicks(user.id);

	return new Response(JSON.stringify({ picks: dbUserPicks }));
}
