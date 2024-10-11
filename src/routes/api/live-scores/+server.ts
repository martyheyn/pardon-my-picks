//kit.svelte.dev/docs/routing#server
import { json } from '@sveltejs/kit';
import type { Scores } from '$lib/utils/types';
import { prisma } from '$lib/server/prisma';
import { ODDS_API_KEY } from '$env/static/private';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }: { request: Request }) {
	const { pickId, year } = await request.json();

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
		`https://api.the-odds-api.com/v4/sports/americanfootball_nfl/scores/?daysFrom=1&apiKey=${ODDS_API_KEY}`
	);
	const scoresDataRaw: Scores[] = await scores.json();
	if (!scoresDataRaw) return [];

	// only pull games that are currently being played
	const scoresLive: Scores[] = scoresDataRaw.filter(
		(game: Scores) => game.scores !== null && game.completed === false
	);

	let homeLiveScore: number | null = pick.homeTeamScore || null;
	let awayLiveScore: number | null = pick.awayTeamScore || null;
	// give the data pickId by mathcing the home and away team
	scoresLive.map(async (game: Scores) => {
		if (
			pick.homeTeam ===
			game.home_team.split(' ')[game.home_team.split(' ').length - 1].toLowerCase()
		) {
			const homeTeamLiveScore = game.scores?.find((score) => {
				const scoreTeamName = score.name.split(' ')[score.name.split(' ').length - 1].toLowerCase();
				return scoreTeamName === pick.homeTeam;
			})?.score;

			const awayTeamLiveScore = game.scores?.find((score) => {
				const scoreTeamName = score.name.split(' ')[score.name.split(' ').length - 1].toLowerCase();
				return scoreTeamName === pick.awayTeam;
			})?.score;
			homeLiveScore = homeTeamLiveScore ? parseInt(homeTeamLiveScore) : pick.homeTeamScore;
			awayLiveScore = awayTeamLiveScore ? parseInt(awayTeamLiveScore) : pick.awayTeamScore;

			// update score in the database
			try {
				await prisma.pick.update({
					where: {
						id: pickId
					},
					data: {
						homeTeamScore: homeTeamLiveScore ? parseInt(homeTeamLiveScore) : pick.homeTeamScore,
						awayTeamScore: awayTeamLiveScore ? parseInt(awayTeamLiveScore) : pick.awayTeamScore
						// check if game is still live to stop function
						// isLive: game.completed ? false : true
					}
				});
			} catch (error) {
				console.error('error', error);
			}
		}
	});

	return json({ homeLiveScore, awayLiveScore });
}
