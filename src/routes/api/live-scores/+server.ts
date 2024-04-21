//kit.svelte.dev/docs/routing#server
import { json } from '@sveltejs/kit';
import type { Scores } from '$lib/utils/types';

// export async function GET(event: Event) {
// put rate limiter in here
// 	return new Response(JSON.stringify('Hello GET'));
// }

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }: { request: Request }) {
	console.log('request', request);
	const { pickId, homeAway } = await request.json();

	// if pick add homeScore and awayScore to pick
	const pick = await prisma.pick.findUnique({
		where: {
			id: pickId
		}
	});

	if (!pick) {
		return json({ error: 'Pick not found' });
	}

	// get live scores if the games have already started (americanfootball_nfl)
	const scores = await fetch(
		'https://api.the-odds-api.com/v4/sports/basketball_nba/scores/?daysFrom=1&apiKey=fafd95c74a4b8c7284ecd93cb09ef8a3'
	);
	const scoresDataRaw: Scores[] = await scores.json();

	// only pull games that are currently being played
	const scoresLive: Scores[] = scoresDataRaw.filter(
		(game: Scores) => game.scores !== null && game.completed === false
	);

	// give the data pickId by mathcing the home and away team
	scoresLive.map(async (game: Scores) => {
		if (
			pick.homeTeam ===
			game.home_team.split(' ')[game.home_team.split(' ').length - 1].toLowerCase()
		) {
			const homeTeamLiveScore =
				game.scores?.find(
					(score) =>
						score.name.split(' ')[score.name.split(' ').length - 1].toLowerCase() === pick.homeTeam
				)?.score ?? null;
			const awayTeamLiveScore =
				game.scores?.find(
					(score) =>
						score.name.split(' ')[score.name.split(' ').length - 1].toLowerCase() === pick.awayTeam
				)?.score ?? null;

			// update score in the database
			try {
				await prisma.pick.update({
					where: {
						id: pickId
					},
					data: {
						homeTeamScore: parseInt(homeTeamLiveScore || pick.homeTeamScore!.toString()),
						awayTeamScore: parseInt(awayTeamLiveScore || pick.awayTeamScore!.toString())
					}
				});
			} catch (error) {
				console.error('error', error);
			}

			return homeAway === 'home' ? json(homeTeamLiveScore) : json(awayTeamLiveScore);
		}
	});
}
