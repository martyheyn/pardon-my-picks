import type { Scores } from './types';
import { fullNameToMascot } from '$lib/utils/matching-format';
import { ODDS_API_KEY } from '$env/static/private';

export const getTeamScores = async (scores: Scores, teamName: string) => {
	if (!scores) return null;
	const score = scores.scores?.find((score) => {
		const scoreTeamName = score.name.split(' ')[score.name.split(' ').length - 1].toLowerCase();
		return scoreTeamName === teamName;
	})?.score;

	return score ? parseInt(score) : null;
};

export const getLiveGames = async ({ year }: { year: string }) => {
	// get live scores if the games have already started (americanfootball_nfl)
	const scores = await fetch(
		`https://api.the-odds-api.com/v4/sports/americanfootball_nfl/scores/?daysFrom=1&apiKey=${ODDS_API_KEY}`
	);
	const scoresDataRaw: Scores[] = await scores.json();

	// only pull games that are currently being played (and teams that are in the enum)
	if (!scoresDataRaw || scoresDataRaw.length === 0) return [];

	const scoresLive: Scores[] = scoresDataRaw.filter(
		(game: Scores) =>
			game.scores !== null &&
			game.completed === false &&
			fullNameToMascot[game.home_team] &&
			fullNameToMascot[game.away_team]
	);

	return scoresLive;
};
