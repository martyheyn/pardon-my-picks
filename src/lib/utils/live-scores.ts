import { prisma } from '$lib/server/prisma';
import type { Scores } from './types';
import { fullNameToMascot } from '$lib/utils/matching-format';
import { ODDS_API_KEY } from '$env/static/private';

export const getLiveGames = async ({ year }: { year: string }) => {
	// get live scores if the games have already started (americanfootball_nfl)
	const scores = await fetch(
		`https://api.the-odds-api.com/v4/sports/baseball_mlb/scores/?daysFrom=1&apiKey=${ODDS_API_KEY}`
	);
	const scoresDataRaw: Scores[] = await scores.json();

	// if the game is not live, from it from the list and call the marking function
	const completedGames: Scores[] = scoresDataRaw.filter(
		(game: Scores) => game.scores !== null && game.completed === true
	);

	// make sure this game is not already marked, it is the first time the game has flipped from not live to live
	if (completedGames.length > 0) {
		const gamesToMark = await prisma.pick.findMany({
			where: {
				year: parseInt(year),
				winner: null,
				marked: false,
				gameId: {
					in: completedGames.map((game) => game.id)
				}
			}
		});
		console.log('gamesToMark', gamesToMark);

		if (gamesToMark.length > 0) {
			// call the marking function
			// get data of all completedGames in gamesToMark
			const gamesToMarkData = gamesToMark.map((game) => {
				return {
					gameId: game.id,
					homeTeam: game.homeTeam,
					awayTeam: game.awayTeam,
					homeTeamScore: game.homeTeamScore,
					awayTeamScore: game.awayTeamScore
				};
			});
			console.log('gamesToMarkData', gamesToMarkData);

			// markGames(gamesToMark);
		}
	}
	// const scoresNonNull = scoresDataRaw.filter((game) => game.scores !== null);

	// only pull games that are currently being played (and teams that are in the enum)
	const scoresLive: Scores[] = scoresDataRaw.filter(
		(game: Scores) =>
			game.scores !== null &&
			game.completed === false &&
			fullNameToMascot[game.home_team] &&
			fullNameToMascot[game.away_team]
	);
	console.log('scoresLive', scoresLive);

	return scoresLive;
};

// need this to be a scores object to Scores, scores within scores
export const getTeamScores = async (scores: Scores, teamName: string) => {
	if (!scores) return null;
	const score = scores.scores?.find((score) => {
		const scoreTeamName = score.name.split(' ')[score.name.split(' ').length - 1].toLowerCase();
		return scoreTeamName === teamName;
	})?.score;

	return score ? parseInt(score) : null;
};
