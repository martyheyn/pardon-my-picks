import { type $Enums, type Tail, type Fade, Prisma } from '@prisma/client';

type Pick = {
	tail?: Tail[] | null;
	fade?: Fade[] | null;
} & {
	id: string;
	createdAt: Date;
	updatedAt: Date;
	year: number;
	show: string;
	week: number | null;
	person: string;
	userId: string | null;
	private: boolean;
	type: string;
	description: string;
	homeTeam: $Enums.NFLTeam;
	awayTeam: $Enums.NFLTeam;
	homeTeamScore: number | null;
	awayTeamScore: number | null;
	isLive: boolean;
	winner: number | null;
	push: number | null;
	gameDate: Date | null;
	result: string | null;
	league: string;
	betLink: string | null;
	espnLink: string | null;
	highlighLink: string | null;
	specialBet: string;
	nerdNugget: string | null;
};

export type PickByPerson = {
	[key: string]: Pick[];
};

export type Alert = {
	text: string | undefined;
	alertType: 'error' | 'success' | undefined;
};

export const picksWithTaisAndFades = Prisma.validator<Prisma.PickArgs>()({
	include: {
		tail: true,
		fade: true
	}
});
export type PicksWithTailsAndFades = Prisma.PickGetPayload<typeof picksWithTaisAndFades>;

export type Scores = {
	away_team: $Enums.NFLTeam;
	commence_time: string;
	completed: boolean;
	home_team: $Enums.NFLTeam;
	id: string;
	last_update: string;
	scores:
		| {
				name: string;
				score: string;
		  }[]
		| null;
	pickId?: string;
	sport_key: string;
	sport_title: string;
};

export type Odds = {
	away_team: string;
	bookmakers: {
		key: string;
		last_update: string;
		markets: {
			key: string;
			last_update: string;
			outcomes: {
				id: string;
				name: string;
				price: number;
				point: number;
				sorted?: number;
			}[];
		}[];
		title: string;
	}[];
	gameId: string;
	commence_time: string;
	home_team: string;
	id: string;
	sport_key: string;
	sport_title: string;
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
