import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';

// get the previous weeks results
// have to make a seperate call becasue I cant pass params to the ServerLoad call
export async function GET({ url }: { url: URL }) {
	const currWeek = url.searchParams.get('currWeek');
	if (!currWeek) {
		return fail(400, { message: 'Invalid request no currWeek' });
	}

	try {
		const prevWeek = await prisma.pick.groupBy({
			by: ['person'],
			_sum: {
				winner: true
			},
			_count: {
				winner: true
			},
			// get the total of true values for the winner field of each persona
			where: {
				week: parseInt(currWeek) - 1
			}
		});

		return new Response(JSON.stringify(prevWeek));
	} catch (error) {
		console.error(error);
	}
}
