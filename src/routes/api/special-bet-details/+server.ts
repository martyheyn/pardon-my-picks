import { prisma } from '$lib/server/prisma';

// get the previous weeks results
// have to make a seperate call becasue I cant pass params to the ServerLoad call
export async function GET({ url }: { url: URL }) {
	const person = url.searchParams.get('person');
	const specialBet = url.searchParams.get('specialBet');
	const year = url.searchParams.get('year');
	const yearWh = year ? [Number(year)] : [2023, 2024, 2025, 2026];

	if (!person || !specialBet) {
		return new Response(JSON.stringify({ message: 'Invalid request' }), { status: 400 });
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
		return new Response(JSON.stringify({ message: 'Error fetching special bet details' }), {
			status: 500
		});
	}
}
