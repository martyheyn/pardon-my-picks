import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';

// get the previous weeks results
// have to make a seperate call becasue I cant pass params to the ServerLoad call
export async function GET({ url }: { url: URL }) {
	const person = url.searchParams.get('person');
	const specialBet = url.searchParams.get('specialBet');
	if (!person || !specialBet) {
		return fail(400, { message: 'Invalid request' });
	}

	try {
		const bets = await prisma.pick.findMany({
			select: {
				week: true,
				person: true,
				description: true,
				result: true
			},
			where: {
				specialBet: specialBet,
				person: person
			}
		});
		return new Response(JSON.stringify(bets));
	} catch (error) {
		console.error(error);
	}
}
