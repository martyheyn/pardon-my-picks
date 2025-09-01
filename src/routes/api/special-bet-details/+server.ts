import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';

// get the previous weeks results
// have to make a seperate call becasue I cant pass params to the ServerLoad call
export async function GET({ url }: { url: URL }) {
	const person = url.searchParams.get('person');
	const specialBet = url.searchParams.get('specialBet');
	const year = url.searchParams.get('year');
	const yearWh = !!year ? [2023, 2024, 2025] : [Number(year)];

	if (!person || !specialBet) {
		return fail(400, { message: 'Invalid request' });
	}

	try {
		const bets = await prisma.pick.findMany({
			select: {
				year: true,
				week: true,
				person: true,
				description: true,
				result: true
			},
			where: {
				specialBet: specialBet,
				person: person,
				year: {
					in: yearWh
				}
			}
		});
		return new Response(JSON.stringify(bets));
	} catch (error) {
		console.error(error);
	}
}
