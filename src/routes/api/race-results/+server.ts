import { prisma } from '$lib/server/prisma';

export async function GET() {
	try {
		const raceResults = await prisma.pick.groupBy({
			by: ['person', 'week'],
			_sum: {
				winner: true,
				push: true
			},
			_count: {
				winner: true
			},
			orderBy: [
				{
					week: 'asc'
				},
				{
					person: 'asc'
				}
			]
			// get the total of true values for the winner field of each persona
		});

		return new Response(JSON.stringify(raceResults));
	} catch (error) {
		console.error(error);
	}
}
