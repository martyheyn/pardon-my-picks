import { CURRENT_WEEK, CURRENT_YEAR } from '$env/static/private';
import { prisma } from '$lib/server/prisma';

export async function GET() {
	const weeklyPmtPicks = await prisma.pick.findMany({
		where: {
			year: parseInt(CURRENT_YEAR),
			week: parseInt(CURRENT_WEEK),
			pmtPersona: true
		},
		select: {
			id: true,
			gameId: true,
			person: true
		}
	});

	return new Response(JSON.stringify({ weeklyPmtPicks: weeklyPmtPicks.length > 0 ? true : false }));
}
