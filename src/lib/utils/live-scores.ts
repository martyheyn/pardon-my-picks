import type { $Enums } from '@prisma/client';
import { fullNameToMascot } from '$lib/utils/matching-format';

// the parts of ESPN's events response this file reads (same feed scripts/mark-games.js grades from)
export type EspnScoreEvent = {
	competitions: Array<{
		status: { type: { state: 'pre' | 'in' | 'post' } };
		competitors: Array<{
			homeAway: 'home' | 'away';
			team: { displayName: string };
			score?: { value: number };
		}>;
	}>;
};

export type GameScore = {
	homeTeam: $Enums.NFLTeam;
	awayTeam: $Enums.NFLTeam;
	homeTeamScore: number;
	awayTeamScore: number;
};

// games that haven't kicked off still come back with a 0-0 score, so this goes by ESPN's game
// state instead of whether a score exists. Finished games are kept too, so a score that changed
// on the last play isn't stuck at its in-game value until mark-games.js grades the pick
export const getStartedGameScores = (events: EspnScoreEvent[]): GameScore[] => {
	const gameScores: GameScore[] = [];

	for (const event of events) {
		const competition = event.competitions[0];
		if (!competition || competition.status.type.state === 'pre') continue;

		const home = competition.competitors.find((c) => c.homeAway === 'home');
		const away = competition.competitors.find((c) => c.homeAway === 'away');
		if (!home?.score || !away?.score) continue;

		// skips anything that isn't a regular NFL matchup, like the Pro Bowl
		const homeTeam = fullNameToMascot[home.team.displayName];
		const awayTeam = fullNameToMascot[away.team.displayName];
		if (!homeTeam || !awayTeam) continue;

		gameScores.push({
			homeTeam: homeTeam as $Enums.NFLTeam,
			awayTeam: awayTeam as $Enums.NFLTeam,
			homeTeamScore: home.score.value,
			awayTeamScore: away.score.value
		});
	}

	return gameScores;
};

export const getLiveGames = async (): Promise<GameScore[]> => {
	// ESPN's dates param is an Eastern calendar day, so this still includes the Sunday night game
	// after it crosses midnight UTC
	const today = new Date()
		.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
		.replaceAll('-', '');

	const res = await fetch(
		`https://partners.api.espn.com/v2/sports/football/nfl/events?dates=${today}&limit=100`
	);
	const eventsJson = await res.json();

	// don't let a bad ESPN response 500 the page
	if (!res.ok || !Array.isArray(eventsJson?.events)) {
		console.error('getLiveGames: unexpected ESPN response', res.status);
		return [];
	}

	return getStartedGameScores(eventsJson.events);
};
