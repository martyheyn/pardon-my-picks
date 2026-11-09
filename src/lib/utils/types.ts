import { type $Enums, Prisma } from '@prisma/client';

export type Alert = {
	text: string | undefined;
	alertType: 'error' | 'success' | undefined;
};

// a page's link preview tags (og/twitter), rendered by the root layout
export type PageMeta = {
	title: string;
	description: string;
	url: string;
	image: {
		url: string;
		width: number;
		height: number;
		alt: string;
	};
};

export const picksWithTaisAndFades = Prisma.validator<Prisma.PickDefaultArgs>()({
	include: {
		tail: true,
		fade: true
	}
});
export type PicksWithTailsAndFades = Prisma.PickGetPayload<typeof picksWithTaisAndFades>;

export type PickByPerson = {
	[key: string]: PicksWithTailsAndFades[];
};

// one game's spread and total, built from ESPN by espnEventToOdds in utils/espn.ts
export type Odds = {
	// the board's row id - espnEventToOdds starts it as the event id, /api/odds swaps in a random one
	id: string;
	// ESPN's event id, saved on the pick as gameId
	gameId: string;
	home_team: string;
	away_team: string;
	// UTC ISO string
	commence_time: string;
	markets: {
		key: 'spreads' | 'totals';
		outcomes: {
			// the user's saved pick on this outcome, '' when there isn't one
			id: string;
			// a team's full name for spreads, 'Over' or 'Under' for totals
			name: string;
			point: number;
		}[];
	}[];
};

export type PickData = {
	id: string;
	gameId?: string | null;
	show: string;
	type: string;
	description: string;
	homeTeam: $Enums.NFLTeam;
	awayTeam: $Enums.NFLTeam;
	pickTeam: $Enums.NFLTeam | null;
	pickTotalType?: 'over' | 'under' | null;
	pickScore?: number;
	gameDate?: Date | string | null;
	winner?: number | null;
	push?: number | null;
	marked: boolean;
};

export type AddPickForm = {
	id: string;
	gameId: string;
	type: string;
	pickName: string;
};
