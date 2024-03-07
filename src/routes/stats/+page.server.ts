import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

type RawPersonData = {
	person: string;
	total_picks: number;
	wins: number;
	pushes: number;
	total_tails: number;
	tail_wins: number;
	total_fades: number;
	fade_wins: number;
};

type personData = {
	person: string;
	wins: string;
	pushes: string;
	record: string;
	total_tails: string;
	tails_pct: string;
	total_fades: string;
	fades_pct: string;
};

export const load: PageServerLoad = async () => {
	// get all of the tail and fade data by person
	const rawPersonData: RawPersonData[] = await prisma.$queryRaw`
	SELECT p.person, COUNT(p.winner) as total_picks,
	SUM(p.winner) as wins, SUM(p.push) as pushes,
	COUNT(t.id) as total_tails,
	SUM(CASE WHEN t.winner THEN 1 ELSE 0 END) as tail_wins,
	COUNT(f.id) as total_fades,
	SUM(CASE WHEN f.winner THEN 1 ELSE 0 END) as fade_wins
	FROM Pick as p
	LEFT JOIN Tail as t ON p.id = t.pickId
	LEFT JOIN Fade as f ON p.id = f.pickId
	GROUP BY p.person
	`;

	// console.log('rawPersonData', rawPersonData);
	const personData: personData[] = [];
	rawPersonData.map((person) => {
		personData.push({
			person: person.person,
			wins: person.wins.toString(),
			pushes: person.pushes.toString(),
			record: `${person.wins}-${Number(person.total_picks) - person.wins - person.pushes}-${
				person.pushes
			}`,
			total_tails: person.total_tails.toString(),
			tails_pct: ((person.tail_wins / Number(person.total_tails)) * 100).toString(),
			total_fades: person.total_fades.toString(),
			fades_pct: ((person.fade_wins / Number(person.total_fades)) * 100).toString()
		});
	});

	console.log('personData', personData);

	return {
		personas: await prisma.pick.groupBy({
			by: ['person'],
			_sum: {
				winner: true,
				push: true
			},
			_count: {
				winner: true
			}
		}),

		spreads: await prisma.pick.groupBy({
			by: ['person', 'type'],
			_sum: {
				winner: true,
				push: true
			},
			_count: {
				winner: true
			}
		}),

		specialBets: await prisma.pick.groupBy({
			by: ['person', 'specialBet'],
			_sum: {
				winner: true,
				push: true
			},
			_count: {
				winner: true
			},
			where: {
				specialBet: {
					not: undefined || ''
				}
			}
		}),

		personData: personData
	};
};
