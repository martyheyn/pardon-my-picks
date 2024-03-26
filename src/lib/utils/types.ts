import type { $Enums, Tail, Fade } from '@prisma/client';

type Pick = {
	tail?: Tail[] | null;
	fade?: Fade[] | null;
} & {
	id: number;
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
	homeTeam: $Enums.NflTeam;
	awayTeam: $Enums.NflTeam;
	homeTeamScore: number | null;
	awayTeamScore: number | null;
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
