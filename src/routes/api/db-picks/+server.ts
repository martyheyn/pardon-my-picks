import type { PickForm } from '$lib/utils/types';
import { CURRENT_WEEK } from '$env/static/private';

const getDbUserPicks = async (userId: string) => {
	const dbUserPicks: PickForm[] = await prisma.pick.findMany({
		where: {
			userId: userId,
			year: new Date().getFullYear(),
			week: parseInt(CURRENT_WEEK)
		},
		select: {
			id: true,
			gameId: true,
			show: true,
			type: true,
			description: true,
			homeTeam: true,
			awayTeam: true,
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
