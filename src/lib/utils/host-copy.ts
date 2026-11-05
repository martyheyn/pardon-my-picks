import type { Season } from '$lib/config/hosts';
import { fullNameToAbrv, mascotToFullName } from './matching-format';
import { formatRecord, type HostStats, type StatsPick, type Streak } from './host-stats';

// the words that go around the numbers from host-stats - shared by the host page, its og tags and
// the share cards so they all say the same thing

export function ordinal(n: number): string {
	const lastTwo = n % 100;
	if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
	if (n % 10 === 1) return `${n}st`;
	if (n % 10 === 2) return `${n}nd`;
	if (n % 10 === 3) return `${n}rd`;
	return `${n}th`;
}

// gaps come from standings points, so a push can leave half a game
export function formatGap(gap: number): string {
	if (gap === 0.5) return 'half a game';
	return gap === 1 ? '1 game' : `${gap} games`;
}

const hasDecisions = (host: Pick<HostStats<StatsPick>, 'record'>) =>
	host.record.wins + host.record.losses > 0;

// "Last place. 2 games behind Memes" / "1st place. PFT is 1 game back" / "Tied for 1st with PFT"
export function standingLine(
	host: Pick<HostStats<StatsPick>, 'personAhead' | 'rank'>,
	lastRank: number,
	nameOf: (person: string) => string
): string | null {
	const ahead = host.personAhead;
	if (!ahead) return null;

	const name = nameOf(ahead.person);
	if (ahead.relation === 'tied') return `Tied for 1st with ${name}`;
	if (ahead.relation === 'chased-by') return `1st place. ${name} is ${formatGap(ahead.gap)} back`;

	const behind = `${formatGap(ahead.gap)} behind ${name}`;
	return host.rank === lastRank
		? `Last place. ${behind}`
		: `${behind[0].toUpperCase()}${behind.slice(1)}`;
}

// the one big stat on a host's card
export function hostHeadline(
	host: Pick<HostStats<StatsPick>, 'record' | 'fadeNet'>,
	displayName: string
): string {
	const name = displayName.toUpperCase();
	if (!hasDecisions(host)) return `${name}: NO RECEIPTS YET`;
	if (host.fadeNet > 0) return `FADING ${name}: +${host.fadeNet}`;
	if (host.fadeNet < 0) return `TAILING ${name}: +${-host.fadeNet}`;
	return `${name} IS DEAD EVEN`;
}

const signedLine = (line: number) => {
	if (line === 0) return 'PK';
	return line > 0 ? `+${line}` : `${line}`;
};

const teamShortName = (team: string) => fullNameToAbrv[mascotToFullName[team]]?.mascot ?? team;
const teamAbbr = (team: string) => fullNameToAbrv[mascotToFullName[team]]?.abbr ?? team;

// "Chiefs -3.5" / "BUF @ KC Over 44.5" - short enough for a card row, unlike the saved description
export function shortPickLabel(
	pick: Pick<
		StatsPick,
		'type' | 'homeTeam' | 'awayTeam' | 'pickTeam' | 'pickTotalType' | 'pickScore'
	>
): string {
	const line = pick.pickScore ?? 0;
	if (pick.pickTotalType) {
		const side = pick.pickTotalType === 'over' ? 'Over' : 'Under';
		return `${teamAbbr(pick.awayTeam)} @ ${teamAbbr(pick.homeTeam)} ${side} ${line}`;
	}
	if (pick.pickTeam) return `${teamShortName(pick.pickTeam)} ${signedLine(line)}`;
	return '';
}

export function worstPickLine(worst: HostStats<StatsPick>['worstPick']): string | null {
	if (!worst) return null;
	return `Worst miss: ${shortPickLabel(worst.pick)}, missed by ${worst.missedBy}`;
}

// W3 / L2
export function streakLabel(streak: Streak | null): string | null {
	return streak ? `${streak.outcome}${streak.count}` : null;
}

// "Hank is 23–31 this season" / "Hank went 23–31 in 2025"
export function ogTitle(
	host: Pick<HostStats<StatsPick>, 'record'>,
	displayName: string,
	season: Season
): string {
	if (!hasDecisions(host)) return `${displayName}'s ${season.year} picks`;

	const record = formatRecord(host.record);
	return season.isCurrent
		? `${displayName} is ${record} this season`
		: `${displayName} went ${record} in ${season.year}`;
}

// present tense for the season in progress, past tense for one that's over
export function ogDescription(
	host: Pick<HostStats<StatsPick>, 'record' | 'fadeNet'>,
	displayName: string,
	season: Season
): string {
	if (!hasDecisions(host)) return `Every ${displayName} pick, graded. Full receipts inside.`;

	const games = (n: number) => (n === 1 ? '1 game' : `${n} games`);
	const inSeason = season.isCurrent ? '' : ` in ${season.year}`;
	const wouldHave = season.isCurrent ? 'would have you up' : 'would have had you up';

	if (host.fadeNet > 0) {
		return `Fading ${displayName}${inSeason} ${wouldHave} ${games(host.fadeNet)}. Full receipts inside.`;
	}
	if (host.fadeNet < 0) {
		return `Tailing ${displayName}${inSeason} ${wouldHave} ${games(-host.fadeNet)}. Full receipts inside.`;
	}
	return season.isCurrent
		? `Fading ${displayName} gets you nowhere. Neither does tailing. Full receipts inside.`
		: `Fading ${displayName} in ${season.year} got you nowhere. Neither did tailing. Full receipts inside.`;
}
