import { prisma } from '$lib/server/prisma';

export async function GET() {
	console.log('hereee');
	const tails = await prisma.tail.findMany({
		where: {
			pick: {
				winner: {
					not: null
				},
				marked: true,
				isLive: false
			},
			winner: null,
			push: null
		},
		include: {
			pick: true
		}
	});

	console.log('tails', tails);

	// markem
	tails.map(async (tail) => {
		if (tail.pick.winner === 1) {
			await prisma.tail.update({
				where: {
					id: tail.id
				},
				data: {
					winner: 1,
					push: 0
				}
			});
		} else if (tail.pick.winner === 0) {
			await prisma.tail.update({
				where: {
					id: tail.id
				},
				data: {
					winner: 0,
					push: 0
				}
			});
		} else if (tail.pick.push === 1) {
			await prisma.tail.update({
				where: {
					id: tail.id
				},
				data: {
					winner: 0,
					push: 1
				}
			});
		}
	});

	// mark fades
	const fades = await prisma.fade.findMany({
		where: {
			pick: {
				winner: {
					not: null
				},
				marked: true,
				isLive: false
			},
			winner: null,
			push: null
		},
		include: {
			pick: true
		}
	});

	console.log('fades', fades);
	// markem
	fades.map(async (fade) => {
		if (fade.pick.winner === 1) {
			await prisma.fade.update({
				where: {
					id: fade.id
				},
				data: {
					winner: 0,
					push: 0
				}
			});
		} else if (fade.pick.winner === 0) {
			await prisma.fade.update({
				where: {
					id: fade.id
				},
				data: {
					winner: 1,
					push: 0
				}
			});
		} else if (fade.pick.push === 1) {
			await prisma.fade.update({
				where: {
					id: fade.id
				},
				data: {
					winner: 0,
					push: 1
				}
			});
		}
	});

	return new Response(JSON.stringify(tails));
}
