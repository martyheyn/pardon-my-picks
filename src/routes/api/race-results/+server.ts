import { prisma } from '$lib/server/prisma';
import { personaAvatarPath, personasLabelToCamelCase } from '$lib/utils/matching-format.js';

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

type raceResultsType = {
	person: string;
	week: number;
	year: number;
	wins: number;
	losses: number;
	pushes: number;
};

export async function GET({ url }) {
	const year = Number(url.searchParams.get('year'));
	if (typeof year !== 'number') {
		return new Response('Invalid query', { status: 400 });
	}

	try {
		const raceResults: raceResultsType[] = await prisma.$queryRaw`
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
			AND winner IS NOT NULL
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
			week DESC, wins DESC, losses ASC, pushes DESC;
		`;

		if (!raceResults) {
			return new Response(JSON.stringify(raceResults));
		}

		let weeklyDataByPerson: weeklyPersonDataType = {};
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

			weeklyDataByPerson[personasLabelToCamelCase(x.person)] = {
				img: personaAvatarPath(x.person),
				link: `/stats/#${personasLabelToCamelCase(x.person)}`,
				data: weeklyDataByPerson[personasLabelToCamelCase(x.person)]
					? [recordByWeek, ...weeklyDataByPerson[personasLabelToCamelCase(x.person)].data]
					: [recordByWeek]
			};
		});

		return new Response(JSON.stringify(weeklyDataByPerson));
	} catch (error) {
		console.error(error);
	}
}
