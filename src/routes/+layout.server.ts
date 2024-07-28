import type { LayoutServerLoad } from './$types';
import { MAINTENANCE_MODE } from '$env/static/private';
import { redirect } from '@sveltejs/kit';
import { ODDS_API_KEY } from '$env/static/private';
import type { Scores } from '$lib/utils/types';
import { markWinner } from '$lib/utils/marking';
import { type markGames } from '$lib/utils/marking';
import { fullNameToMascot } from '$lib/utils/matching-format';

export const load: LayoutServerLoad = async ({ url, locals }) => {
	const targetPath = '/maintenance';
	if (MAINTENANCE_MODE === 'true' && url.pathname !== targetPath) {
		console.log('REDIRECTING TO MAINTENANCE PAGE');
		throw redirect(302, targetPath);
	}

	// onload mark all games that are completed
	const unMarkedGames = await prisma.pick.findMany({
		where: {
			winner: null,
			marked: false
		}
	});

	if (unMarkedGames.length > 0) {
		console.log('here checking unmarked games');
		// check odds api if the game finished
		const gamesToMark = await Promise.all(
			unMarkedGames.map(async (game) => {
				// first check if the game has been marked somewhere else in the db by another user
				const gameAlreadyMarked = await prisma.pick.findMany({
					where: {
						gameId: game.gameId,
						winner: {
							not: null
						},
						marked: true
					}
				});
				console.log('gameAlreadyMarked', gameAlreadyMarked);

				if (gameAlreadyMarked.length > 0) {
					return {
						...game,
						homeTeamScore: gameAlreadyMarked[0].homeTeamScore,
						awayTeamScore: gameAlreadyMarked[0].awayTeamScore
					};
				}

				// if not already in the db we gotta query the odds api
				const response = await fetch(
					`https://api.the-odds-api.com/v4/sports/baseball_mlb/scores/?daysFrom=3&apiKey=${ODDS_API_KEY}&eventIds=${game.gameId}`
				);
				const scoresDataRaw: Scores[] = await response.json();
				const completedGames = scoresDataRaw.filter((score) => score.completed === true);
				if (completedGames.length === 0) return [];
				console.log('api scores', completedGames);

				let homeTeamScore = null;
				let awayTeamScore = null;
				completedGames.map((score) => {
					const home_team_score = score.scores?.find(
						(sc) => fullNameToMascot[sc.name] === game.homeTeam
					)?.score;
					const away_team_score = score.scores?.find(
						(sc) => fullNameToMascot[sc.name] === game.awayTeam
					)?.score;

					homeTeamScore = home_team_score ? parseInt(home_team_score) : null;
					awayTeamScore = away_team_score ? parseInt(away_team_score) : null;
				});

				return {
					...game,
					homeTeamScore: homeTeamScore,
					awayTeamScore: awayTeamScore
				};
			})
		).then((results) => results.flat());

		if (gamesToMark.length > 0) {
			const gameData: markGames[] = gamesToMark.map((game) => {
				return {
					id: game.id,
					gameId: game.gameId,
					type: game.type,
					description: game.description,
					homeTeam: game.homeTeam,
					awayTeam: game.awayTeam,
					homeTeamScore: game.homeTeamScore,
					awayTeamScore: game.awayTeamScore,
					pickTeam: game.pickTeam,
					pickScore: game.pickScore
				};
			});

			try {
				if (gameData && gameData.length > 0) {
					await markWinner(gameData);
				}
			} catch (error) {
				console.error(error);
			}
		}
	}

	return {
		user: locals.user
	};
};
