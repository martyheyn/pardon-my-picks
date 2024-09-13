import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { CURRENT_YEAR } from '$env/static/private';

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
	year?: number;
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
	let currYear = Number(CURRENT_YEAR);
	// get all of the tail and fade data by person
	const rawPersonData: RawPersonData[] = await prisma.$queryRaw`
			SELECT p.person,
				p.total_picks,
				p.wins,
				p.pushes,
				t.total_tails,
				t.tail_wins,
				f.total_fades,
				f.fade_wins
		   	FROM (
				SELECT p.person,
				COUNT(p.id) as total_picks,
		   		SUM(p.winner) as wins,
		   		SUM(p.push) as pushes
				FROM "Pick" as p
				WHERE p.pmt_persona = true
				AND p.barstool_employee = true
				AND p.year = ${currYear}
				GROUP BY p.person
			) p LEFT JOIN (
				SELECT p.person,
				COUNT(t.id) as total_tails,
		   		SUM(t.winner) as tail_wins
				FROM "Pick" as p
				LEFT JOIN "Tail" as t
				ON p.id = t.pick_id
				WHERE p.pmt_persona = true
				AND p.barstool_employee = true
				AND p.year = ${currYear}
				GROUP BY p.person
			) t ON p.person = t.person
				LEFT JOIN (
				SELECT p.person,
				COUNT(f.id) as total_fades,
		   		SUM(f.winner) as fade_wins
				FROM "Pick" as p
				LEFT JOIN "Fade" as f
				ON p.id = f.pick_id
				WHERE p.pmt_persona = true
				AND p.barstool_employee = true
				AND p.year = ${currYear}
				GROUP BY p.person
			) f ON p.person = f.person
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
			pmtPersona: true,
			barstoolEmployee: true,
			year: currYear
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

	const specialBets = await prisma.pick.groupBy({
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
			pmtPersona: true,
			barstoolEmployee: true,
			year: Number(CURRENT_YEAR)
		}
	});

	return {
		personData: personData,
		typeBets: typeBetData,
		specialBets: specialBets
	};
};

const yearHeaderMap = {
	'2024 NFL Season Stats': 2024,
	'2023 NFL Season Stats': 2023,
	'All Time Stats': 'all-time'
};

export const actions: Actions = {
	selectStats: async (event) => {
		const form = await event.request.formData();
		const year = form.get('year') as
			| '2024 NFL Season Stats'
			| '2023 NFL Season Stats'
			| 'All Time Stats';
		const yearHeader = yearHeaderMap[year];

		// get data based on year of alltime
		let rawPersonData: RawPersonData[] = [];
		switch (yearHeader) {
			case 'all-time':
				rawPersonData = await prisma.$queryRaw`
				SELECT p.person,
					p.total_picks,
					p.wins,
					p.pushes,
					t.total_tails,
					t.tail_wins,
					f.total_fades,
					f.fade_wins
		   		FROM (
					SELECT p.person,
					COUNT(p.id) as total_picks,
		   			SUM(p.winner) as wins,
		   			SUM(p.push) as pushes
					FROM "Pick" as p
					WHERE p.pmt_persona = true
					AND p.barstool_employee = true
					GROUP BY p.person
				) p
				LEFT JOIN (
					SELECT p.person,
					COUNT(t.id) as total_tails,
		   			SUM(t.winner) as tail_wins
					FROM "Pick" as p
					LEFT JOIN "Tail" as t
					ON p.id = t.pick_id
					WHERE p.pmt_persona = true
					AND p.barstool_employee = true
					GROUP BY p.person
				) t ON p.person = t.person
				LEFT JOIN (
					SELECT p.person,
					COUNT(f.id) as total_fades,
		   			SUM(f.winner) as fade_wins
					FROM "Pick" as p
					LEFT JOIN "Fade" as f
					ON p.id = f.pick_id
					WHERE p.pmt_persona = true
					AND p.barstool_employee = true
					GROUP BY p.person
				) f ON p.person = f.person`;
				break;
			default:
				rawPersonData = await prisma.$queryRaw`
					SELECT p.person,
					p.total_picks,
					p.wins,
					p.pushes,
					t.total_tails,
					t.tail_wins,
					f.total_fades,
					f.fade_wins
		   			FROM (
					SELECT p.person,
					COUNT(p.id) as total_picks,
		   			SUM(p.winner) as wins,
		   			SUM(p.push) as pushes
					FROM "Pick" as p
					WHERE p.year = (${yearHeader})
					AND p.pmt_persona = true
					AND p.barstool_employee = true
					GROUP BY p.person
					) p
					LEFT JOIN (
					SELECT p.person,
					COUNT(t.id) as total_tails,
		   			SUM(t.winner) as tail_wins
					FROM "Pick" as p
					LEFT JOIN "Tail" as t
					ON p.id = t.pick_id
					WHERE p.year = (${yearHeader})
					AND p.pmt_persona = true
					AND p.barstool_employee = true
					GROUP BY p.person
					) t ON p.person = t.person
					LEFT JOIN (
					SELECT p.person,
					COUNT(f.id) as total_fades,
		   			SUM(f.winner) as fade_wins
					FROM "Pick" as p
					LEFT JOIN "Fade" as f
					ON p.id = f.pick_id
		   			WHERE p.year = (${yearHeader})
					AND p.pmt_persona = true
					AND p.barstool_employee = true
					GROUP BY p.person
					) f ON p.person = f.person
			`;
				break;
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
		const yearWh = yearHeader === 'all-time' ? 2023 || 2024 : Number(yearHeader);
		// TODO:: 2023 || 2024 not sustainable
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
				pmtPersona: true,
				barstoolEmployee: true,
				year: yearWh
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

		const specialBets = await prisma.pick.groupBy({
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
				pmtPersona: true,
				barstoolEmployee: true,
				year: typeof yearHeader === 'number' ? yearHeader : { not: undefined }
			}
		});

		return {
			personData: personData,
			typeBets: typeBetData,
			specialBets: specialBets
		};
	}
};
