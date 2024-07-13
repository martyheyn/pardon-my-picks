import type { LayoutServerLoad } from './$types';
import { MAINTENANCE_MODE } from '$env/static/private';
import { redirect } from '@sveltejs/kit';
import { ODDS_API_KEY } from '$env/static/private';
import type { Scores } from '$lib/utils/types';
import { markWinner, type markGames } from '$lib/utils/marking';
import { parse } from 'svelte/compiler';

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
		unMarkedGames.map(async (game) => {
			const scores = await fetch(
				`https://api.the-odds-api.com/v4/sports/baseball_mlb/scores/?daysFrom=1&apiKey=${ODDS_API_KEY}&daysFrom=3&eventIds=${game.gameId}`
			);
			const scoresDataRaw: Scores[] = await scores.json();
			let gameData: markGames[] = [];

			scoresDataRaw.map(async (score) => {
				console.log('score', score);
				if (score.completed === true) {
					const homeTeamScore = score.scores?.find((sc) => sc.name === score.home_team)?.score;
					const awayTeamScore = score.scores?.find((sc) => sc.name === score.away_team)?.score;
					gameData.push({
						gameId: game.id,
						type: game.type,
						description: game.description,
						homeTeam: game.homeTeam,
						awayTeam: game.awayTeam,
						homeTeamScore: homeTeamScore ? parseInt(homeTeamScore) : null,
						awayTeamScore: awayTeamScore ? parseInt(awayTeamScore) : null,
						pickTeam: game.pickTeam,
						pickScore: game.pickScore
					});
				}
			});
			console.log('gameData', gameData);
			// markWinner(gameData);
		});
	}

	return {
		user: locals.user
	};
};
