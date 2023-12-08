import type { $Enums } from '@prisma/client';

export type Pick = {
	id: number;
	createdAt: Date;
	updatedAt: Date;
	year: number;
	week: number | null;
	person: string;
	description: string;
	homeTeam: $Enums.NflTeam;
	awayTeam: $Enums.NflTeam;
	homeTeamScore?: number | null;
	awayTeamScore?: number | null;
	winner?: number | null;
	result?: string | null;
	fade: number | null;
	tail: number | null;
	gameDate: Date | null;
	nerdNugget: string | null;
	push?: number | null;
	betLink?: string | null;
	espnLink?: string | null;
	highlighLink?: string | null;
	specialBet?: string | null;
	// order?: number;
};

export type PickByPerson = {
	[key: string]: Pick[];
};
