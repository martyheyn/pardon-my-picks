// the grading rules mark-games.js runs on - no db or network in here, so they can be unit tested

// ESPN's team names -> the NFLTeam values picks store
export const fullNameToMascot = {
	'Arizona Cardinals': 'cardinals',
	'Atlanta Falcons': 'falcons',
	'Baltimore Ravens': 'ravens',
	'Buffalo Bills': 'bills',
	'Carolina Panthers': 'panthers',
	'Chicago Bears': 'bears',
	'Cincinnati Bengals': 'bengals',
	'Cleveland Browns': 'browns',
	'Dallas Cowboys': 'cowboys',
	'Denver Broncos': 'broncos',
	'Detroit Lions': 'lions',
	'Green Bay Packers': 'packers',
	'Houston Texans': 'texans',
	'Indianapolis Colts': 'colts',
	'Jacksonville Jaguars': 'jaguars',
	'Kansas City Chiefs': 'chiefs',
	'Los Angeles Chargers': 'chargers',
	'Los Angeles Rams': 'rams',
	'Miami Dolphins': 'dolphins',
	'Minnesota Vikings': 'vikings',
	'New England Patriots': 'patriots',
	'New Orleans Saints': 'saints',
	'New York Giants': 'giants',
	'New York Jets': 'jets',
	'Las Vegas Raiders': 'raiders',
	'Philadelphia Eagles': 'eagles',
	'Pittsburgh Steelers': 'steelers',
	'San Francisco 49ers': 'fortyNiners',
	'Seattle Seahawks': 'seahawks',
	'Tampa Bay Buccaneers': 'buccaneers',
	'Tennessee Titans': 'titans',
	'Washington Commanders': 'commanders'
};

const DAY_MS = 24 * 60 * 60 * 1000;

// a pick's saved kickoff and ESPN's can drift apart (a flexed game, the odds api and ESPN
// disagreeing on the time), but never by days - and the limit keeps a playoff rematch a week
// later from being taken for the game a pick was on
const MAX_KICKOFF_GAP_MS = 3 * DAY_MS;

// what grading needs from ESPN's events response: when each game kicked off, whether it's final,
// and each team's score keyed by the value picks store
export function parseEvents(json) {
	return (json.events ?? []).map((event) => {
		const competition = event.competitions?.[0];
		const scores = {};
		for (const competitor of competition?.competitors ?? []) {
			const team = fullNameToMascot[competitor.team?.displayName];
			if (team) scores[team] = competitor.score?.value;
		}

		return {
			id: event.id,
			kickoff: new Date(event.date),
			completed: competition?.status?.type?.completed === true,
			scores
		};
	});
}

// the game a pick was on: the same two teams, kicking off closest to the pick's game_date. The
// teams are matched as a pair rather than by home and away, so a neutral site game ESPN lists the
// other way round still lines up
export function findEvent(pick, events) {
	const kickoff = new Date(pick.game_date).getTime();
	let closest = null;

	for (const event of events) {
		const hasBothTeams = pick.home_team in event.scores && pick.away_team in event.scores;
		if (!hasBothTeams) continue;

		const gap = Math.abs(event.kickoff.getTime() - kickoff);
		if (gap > MAX_KICKOFF_GAP_MS) continue;
		if (!closest || gap < closest.gap) closest = { event, gap };
	}

	return closest?.event ?? null;
}

const outcome = (margin) => {
	if (margin > 0) return { winner: 1, push: 0 };
	if (margin < 0) return { winner: 0, push: 0 };
	return { winner: 0, push: 1 };
};

// winner and push for a pick from the final score, or null when the pick can't be graded (no line,
// or a picked team that isn't in the game). A spread line is from the picked side's view, so the
// pick covers when that side's margin plus the line is positive
export function gradePick(pick, homeScore, awayScore) {
	const line = pick.pick_score;
	if (line === null || line === undefined) return null;

	if (pick.type === 'spreads' || pick.type === 'spread') {
		if (pick.pick_team === pick.home_team) return outcome(homeScore - awayScore + line);
		if (pick.pick_team === pick.away_team) return outcome(awayScore - homeScore + line);
		return null;
	}

	if (pick.type === 'totals') {
		const total = homeScore + awayScore;
		if (pick.pick_total_type === 'over') return outcome(total - line);
		if (pick.pick_total_type === 'under') return outcome(line - total);
	}

	return null;
}

const capitalize = (team) => `${team[0].toUpperCase()}${team.slice(1)}`;

// "Bills 17 vs Chiefs 24", away team first - the format the result column has always used
export function resultLabel(pick, homeScore, awayScore) {
	return `${capitalize(pick.away_team)} ${awayScore} vs ${capitalize(pick.home_team)} ${homeScore}`;
}

const espnDate = (date) => date.toISOString().slice(0, 10).replaceAll('-', '');

// ESPN's dates param, from the earliest pending kickoff to now. Padded a day each side because
// ESPN's dates are US calendar days and kickoffs are stored in UTC
export function espnDateRange(picks, now) {
	const earliest = Math.min(...picks.map((pick) => new Date(pick.game_date).getTime()));
	return `${espnDate(new Date(earliest - DAY_MS))}-${espnDate(new Date(now.getTime() + DAY_MS))}`;
}
