import { prisma } from '$lib/server/prisma';
import { personaAvatarPath, personasLabelToCamelCase } from '../../../lib/utils/matching-format';

export type weeklyPersonDataType = {
	[key: string]: {
		img: string;
		link: string;
		data: {
			week: any;
			wins: any;
			losses: any;
			pushes: any;
			record: string;
			points: number;
		}[];
	};
};

let weeklyDataByPerson: weeklyPersonDataType = {
	bigCat: {
		img: personaAvatarPath('Big Cat'),
		link: '/stats/#big-cat',
		data: []
	},
	pft: {
		img: personaAvatarPath('PFT'),
		link: '/stats/#pft-commenter',
		data: []
	},
	hank: {
		img: personaAvatarPath('Hank'),
		link: '/stats/#handsome-hank',
		data: []
	},
	jake: {
		img: personaAvatarPath('Jake'),
		link: '/stats/#cake-marsh',
		data: []
	},
	max: {
		img: personaAvatarPath('Max'),
		link: '/stats/#bat-girl',
		data: []
	},
	memes: {
		img: personaAvatarPath('Memes'),
		link: '/stats/#memes',
		data: []
	}
};

export async function GET({ url }) {
	const week = Number(url.searchParams.get('week'));
	const year = Number(url.searchParams.get('year'));

	try {
		const raceResults: any[] = await prisma.$queryRaw`
		WITH WeekAggregation AS (
			SELECT
				person,
				week,
				year,
				SUM(winner) AS wins,
				SUM(CASE WHEN winner = 0 AND push = 0 THEN 1 ELSE 0 END) AS losses,
				SUM(push) AS pushes
			FROM
				"Pick"
			WHERE pmt_persona = true
			GROUP BY
				person, week, year
		)
		SELECT
			person,
			week,
			year,
			SUM(wins) OVER (PARTITION BY person ORDER BY week) AS wins,
			SUM(losses) OVER (PARTITION BY person ORDER BY week) AS losses,
			SUM(pushes) OVER (PARTITION BY person ORDER BY week) AS pushes
		FROM
			WeekAggregation
		WHERE
			year = ${year}
		ORDER BY
			person, week;
		`;

		console.log(raceResults);

		if (!raceResults) {
			return new Response(JSON.stringify(raceResults));
		}

		// console.log(raceResults);
		raceResults.forEach((x) => {
			// add the previous week's record to the current week
			// TODO: could be a reduce function
			let record = `${x.wins}-${x.losses}-${x.pushes}`;
			let points = Number(x.wins) + Number(x.pushes) * 0.5;
			let recordByWeek = {
				week: x.week,
				wins: x.wins,
				losses: x.losses,
				pushes: x.pushes,
				record: record,
				points: points
			};
			weeklyDataByPerson[personasLabelToCamelCase(x.person)].data.push(recordByWeek);
		});

		return new Response(JSON.stringify(weeklyDataByPerson));
	} catch (error) {
		console.error(error);
	}
}
