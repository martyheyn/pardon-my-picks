import type { Scores } from './types';
import { fullNameToMascot } from '$lib/utils/matching-format';
import { ODDS_API_KEY } from '$env/static/private';

export const getTeamScores = async (scores: Scores) => {
	if (!scores) {
		return {
			homeTeamScore: null,
			awayTeamScore: null
		};
	}

	const ht_score = scores.scores?.find((sc) => sc.name === scores.home_team)?.score;
	const at_score = scores.scores?.find((sc) => sc.name === scores.away_team)?.score;

	const homeTeamScore = ht_score ? parseInt(ht_score) : null;
	const awayTeamScore = at_score ? parseInt(at_score) : null;

	return {
		homeTeamScore,
		awayTeamScore
	};
};

export const getLiveGames = async () => {
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
