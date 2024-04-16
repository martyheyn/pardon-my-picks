import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { raw } from '@prisma/client/runtime/library';

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

type PersonData = {
	person: string;
	wins: string;
	pushes: string;
	record: string;
	record_pct: string;
	total_tails: string;
	tails_pct: string;
	total_fades: string;
	fades_pct: string;
};

type BetData = {
	person: string;
	type: string;
	wins: string;
	pushes: string;
	record: string;
};

const getRecordPct = (total_picks: number, wins: number, pushes: number) => {
	return parseFloat(`${(wins / (Number(total_picks) - pushes)) * 100}`);
};

export const load: PageServerLoad = async () => {
	// get all of the tail and fade data by person
	const rawPersonData: RawPersonData[] = await prisma.$queryRaw`
	SELECT p.person, 
       COUNT(p.winner) as total_picks,
       SUM(p.winner) as wins, 
       SUM(p.push) as pushes,
       COUNT(t.id) as total_tails,
       SUM(CASE WHEN t.winner THEN 1 ELSE 0 END) as tail_wins,
       COUNT(f.id) as total_fades,
       SUM(CASE WHEN f.winner THEN 1 ELSE 0 END) as fade_wins
	   FROM "Pick" as p
	   LEFT JOIN "Tail" as t ON p.id = t.pick_id
	   LEFT JOIN "Fade" as f ON p.id = f.pick_id
	   WHERE p.year = 2023
	   GROUP BY p.person;
	`;

	const personData: PersonData[] = [];
	rawPersonData.map((person) => {
		personData.push({
			person: person.person,
			wins: Number(person.wins).toString(),
			pushes: Number(person.pushes).toString(),
			record: `${person.wins} - ${
				Number(person.total_picks) - Number(person.wins) - Number(person.pushes)
			} - ${Number(person.pushes)}`,
			record_pct: getRecordPct(
				Number(person.total_picks),
				Number(person.wins),
				Number(person.pushes)
			).toString(),
			total_tails: Number(person.total_tails).toString(),
			tails_pct: ((Number(person.tail_wins) / Number(person.total_tails)) * 100).toString(),
			total_fades: Number(person.total_fades).toString(),
			fades_pct: ((Number(person.fade_wins) / Number(person.total_fades)) * 100).toString()
		});
	});

	// TODO: rawSQL query to find fades and tails and % by bet type
	// get type bet  data
	const typeBetData: BetData[] = [];
	const typeBet = await prisma.pick.groupBy({
		by: ['person', 'type'],
		_sum: {
			winner: true,
			push: true
		},
		_count: {
			winner: true
		},
		where: {
			year: 2023
		}
	});

	typeBet.map((bet) => {
		let winCount = bet._sum.winner ? bet._sum.winner : 0;
		let pushCount = bet._sum.push ? bet._sum.push : 0;
		typeBetData.push({
			person: bet.person,
			type: bet.type,
			wins: winCount ? winCount.toString() : '0',
			pushes: pushCount ? pushCount.toString() : '0',
			record: `${bet._sum.winner} - ${bet._count.winner - winCount - pushCount} - ${bet._sum.push}`
		});
	});

	return {
		personData: personData,
		typeBets: typeBetData,

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
				},
				year: 2023
			}
		})
	};
};

const yearHeaderMap = {
	'2023 NFL Season Stats': 2023,
	'All Time Stats': 'all-time',
	'2022 NFL Season Stats': 2022
};

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const year = form.get('year') as
			| '2023 NFL Season Stats'
			| 'All Time Stats'
			| '2022 NFL Season Stats';
		const yearHeader = yearHeaderMap[year];

		// get data based on year of alltime
		let rawPersonData: RawPersonData[] = [];
		switch (yearHeader) {
			case 'all-time':
				rawPersonData = await prisma.$queryRaw`
				SELECT p.person,
		   		COUNT(p.winner) as total_picks,
		   		SUM(p.winner) as wins,
		   		SUM(p.push) as pushes,
		   		COUNT(t.id) as total_tails,
		   		SUM(CASE WHEN t.winner THEN 1 ELSE 0 END) as tail_wins,
		   		COUNT(f.id) as total_fades,
		   		SUM(CASE WHEN f.winner THEN 1 ELSE 0 END) as fade_wins
		   		FROM "Pick" as p
		   		LEFT JOIN "Tail" as t ON p.id = t.pick_id
		   		LEFT JOIN "Fade" as f ON p.id = f.pick_id
		   		GROUP BY p.person;
			`;
				break;
			default:
				rawPersonData = await prisma.$queryRaw`
				SELECT p.person,
		   		COUNT(p.winner) as total_picks,
		   		SUM(p.winner) as wins,
		   		SUM(p.push) as pushes,
		   		COUNT(t.id) as total_tails,
		   		SUM(CASE WHEN t.winner THEN 1 ELSE 0 END) as tail_wins,
		   		COUNT(f.id) as total_fades,
		   		SUM(CASE WHEN f.winner THEN 1 ELSE 0 END) as fade_wins
		   		FROM "Pick" as p
		   		LEFT JOIN "Tail" as t ON p.id = t.pick_id
		   		LEFT JOIN "Fade" as f ON p.id = f.pick_id
		   		WHERE p.year = (${yearHeader})
		   		GROUP BY p.person;
			`;
		}

		const personData: PersonData[] = [];
		rawPersonData.map((person) => {
			personData.push({
				person: person.person,
				wins: Number(person.wins).toString(),
				pushes: Number(person.pushes).toString(),
				record: `${person.wins} - ${
					Number(person.total_picks) - Number(person.wins) - Number(person.pushes)
				} - ${Number(person.pushes)}`,
				record_pct: getRecordPct(
					Number(person.total_picks),
					Number(person.wins),
					Number(person.pushes)
				).toString(),
				total_tails: Number(person.total_tails).toString(),
				tails_pct: ((Number(person.tail_wins) / Number(person.total_tails)) * 100).toString(),
				total_fades: Number(person.total_fades).toString(),
				fades_pct: ((Number(person.fade_wins) / Number(person.total_fades)) * 100).toString()
			});
		});

		// TODO: rawSQL query to find fades and tails and % by bet type
		// get type bet  data
		const typeBetData: BetData[] = [];
		const typeBet = await prisma.pick.groupBy({
			by: ['person', 'type'],
			_sum: {
				winner: true,
				push: true
			},
			_count: {
				winner: true
			},
			where: {
				...(typeof yearHeader === 'number' && { year: yearHeader })
			}
		});

		typeBet.map((bet) => {
			let winCount = bet._sum.winner ? bet._sum.winner : 0;
			let pushCount = bet._sum.push ? bet._sum.push : 0;
			typeBetData.push({
				person: bet.person,
				type: bet.type,
				wins: winCount ? winCount.toString() : '0',
				pushes: pushCount ? pushCount.toString() : '0',
				record: `${bet._sum.winner} - ${bet._count.winner - winCount - pushCount} - ${
					bet._sum.push
				}`
			});
		});

		return {
			personData: personData,
			typeBets: typeBetData,

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
					},
					...(typeof yearHeader === 'number' && { year: yearHeader })
				}
			})
		};
	}
};
