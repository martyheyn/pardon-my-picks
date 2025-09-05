import { CURRENT_WEEK } from '$env/static/private';
import { prisma } from '$lib/server/prisma';

export async function GET() {
	const weeklyPmtPicks = await prisma.pick.findMany({
		where: {
			year: new Date().getFullYear(),
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
