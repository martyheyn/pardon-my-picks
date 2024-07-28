import { prisma } from '$lib/server/prisma';
import type { $Enums } from '@prisma/client';

export type markGames = {
	id: string;
	gameId: string;
	type: string;
	description: string;
	homeTeam: $Enums.NFLTeam;
	awayTeam: $Enums.NFLTeam;
	homeTeamScore: number | null;
	awayTeamScore: number | null;
	pickTeam: $Enums.NFLTeam | null;
	pickScore: number | null;
};

export const markWinner = async (games: markGames[]) => {
	games.map(async (game) => {
		if (game.homeTeamScore === null || game.awayTeamScore === null) return;
		if (game.type === 'spread') {
			const homeTeam = game.pickTeam === game.homeTeam ? true : false;
			markSpreadLogic(game, homeTeam);
		}

		if (game.type === 'totals') {
			if (!game.pickScore) return;
			const total = game.homeTeamScore + game.awayTeamScore;
			if (game.description.includes('Over')) {
				if (total > game.pickScore) {
					await prisma.pick.updateMany({
						where: {
							id: game.id,
							gameId: game.gameId
						},
						data: {
							winner: 1,
							push: 0,
							marked: true,
							isLive: false,
							homeTeamScore: game.homeTeamScore,
							awayTeamScore: game.awayTeamScore
						}
					});
				} else if (total === game.pickScore) {
					await prisma.pick.updateMany({
						where: {
							id: game.id,
							gameId: game.gameId
						},
						data: {
							winner: 0,
							push: 1,
							marked: true,
							isLive: false,
							homeTeamScore: game.homeTeamScore,
							awayTeamScore: game.awayTeamScore
						}
					});
				} else {
					await prisma.pick.updateMany({
						where: {
							id: game.id,
							gameId: game.gameId
						},
						data: {
							winner: 0,
							push: 0,
							marked: true,
							isLive: false,
							homeTeamScore: game.homeTeamScore,
							awayTeamScore: game.awayTeamScore
						}
					});
				}
			}

			if (game.description.includes('Under')) {
				if (total < game.pickScore) {
					await prisma.pick.updateMany({
						where: {
							id: game.id,
							gameId: game.gameId
						},
						data: {
							winner: 1,
							push: 0,
							marked: true,
							isLive: false,
							homeTeamScore: game.homeTeamScore,
							awayTeamScore: game.awayTeamScore
						}
					});
				} else if (total === game.pickScore) {
					await prisma.pick.updateMany({
						where: {
							id: game.id,
							gameId: game.gameId
						},
						data: {
							winner: 0,
							push: 1,
							marked: true,
							isLive: false,
							homeTeamScore: game.homeTeamScore,
							awayTeamScore: game.awayTeamScore
						}
					});
				} else {
					await prisma.pick.updateMany({
						where: {
							id: game.id,
							gameId: game.gameId
						},
						data: {
							winner: 0,
							push: 0,
							marked: true,
							isLive: false,
							homeTeamScore: game.homeTeamScore,
							awayTeamScore: game.awayTeamScore
						}
					});
				}
			}
		}
	});
};

const markSpreadLogic = async (game: markGames, homeTeam: boolean) => {
	if (game.homeTeamScore === null || game.awayTeamScore === null || game.pickScore === null) return;

	if (homeTeam) {
		const diff = game.homeTeamScore - game.awayTeamScore;
		if (diff > flipNumber(game.pickScore)) {
			await prisma.pick.updateMany({
				where: {
					id: game.id,
					gameId: game.gameId
				},
				data: {
					winner: 1,
					push: 0,
					marked: true,
					isLive: false,
					homeTeamScore: game.homeTeamScore,
					awayTeamScore: game.awayTeamScore
				}
			});
		} else if (diff < flipNumber(game.pickScore)) {
			await prisma.pick.updateMany({
				where: {
					id: game.id,
					gameId: game.gameId
				},
				data: {
					winner: 0,
					push: 0,
					marked: true,
					isLive: false,
					homeTeamScore: game.homeTeamScore,
					awayTeamScore: game.awayTeamScore
				}
			});
		} else if (diff === flipNumber(game.pickScore)) {
			await prisma.pick.updateMany({
				where: {
					id: game.id,
					gameId: game.gameId
				},
				data: {
					winner: 0,
					push: 1,
					marked: true,
					isLive: false,
					homeTeamScore: game.homeTeamScore,
					awayTeamScore: game.awayTeamScore
				}
			});
		} else {
			console.error('error did not fit any condition');
		}
	}

	if (!homeTeam) {
		const diff = game.awayTeamScore - game.homeTeamScore;
		if (diff > flipNumber(game.pickScore)) {
			await prisma.pick.updateMany({
				where: {
					id: game.id,
					gameId: game.gameId
				},
				data: {
					winner: 1,
					push: 0,
					marked: true,
					isLive: false,
					homeTeamScore: game.homeTeamScore,
					awayTeamScore: game.awayTeamScore
				}
			});
		} else if (diff < flipNumber(game.pickScore)) {
			await prisma.pick.updateMany({
				where: {
					id: game.id,
					gameId: game.gameId
				},
				data: {
					winner: 0,
					push: 0,
					marked: true,
					isLive: false,
					homeTeamScore: game.homeTeamScore,
					awayTeamScore: game.awayTeamScore
				}
			});
		} else if (diff === flipNumber(game.pickScore)) {
			await prisma.pick.updateMany({
				where: {
					id: game.id,
					gameId: game.gameId
				},
				data: {
					winner: 0,
					push: 1,
					marked: true,
					isLive: false,
					homeTeamScore: game.homeTeamScore,
					awayTeamScore: game.awayTeamScore
				}
			});
		} else {
			console.error('error did not fit any condition');
		}
	}
};

export const markTailFade = async () => {
	const tails = await prisma.tail.findMany({
		where: {
			pick: {
				winner: {
					not: null
				},
				marked: true,
				isLive: false
			},
			winner: null,
			push: null
		},
		include: {
			pick: true
		}
	});

	// markem
	tails.map(async (tail) => {
		if (tail.pick.winner === 1) {
			await prisma.tail.update({
				where: {
					id: tail.id
				},
				data: {
					winner: 1,
					push: 0
				}
			});
		} else if (tail.pick.winner === 0) {
			await prisma.tail.update({
				where: {
					id: tail.id
				},
				data: {
					winner: 0,
					push: 0
				}
			});
		} else if (tail.pick.push === 1) {
			await prisma.tail.update({
				where: {
					id: tail.id
				},
				data: {
					winner: 0,
					push: 1
				}
			});
		}
	});

	// mark fades
	const fades = await prisma.fade.findMany({
		where: {
			pick: {
				winner: {
					not: null
				},
				marked: true,
				isLive: false
			},
			winner: null,
			push: null
		},
		include: {
			pick: true
		}
	});

	// markem
	fades.map(async (fade) => {
		if (fade.pick.winner === 1) {
			await prisma.fade.update({
				where: {
					id: fade.id
				},
				data: {
					winner: 0,
					push: 0
				}
			});
		} else if (fade.pick.winner === 0) {
			await prisma.fade.update({
				where: {
					id: fade.id
				},
				data: {
					winner: 1,
					push: 0
				}
			});
		} else if (fade.pick.push === 1) {
			await prisma.fade.update({
				where: {
					id: fade.id
				},
				data: {
					winner: 0,
					push: 1
				}
			});
		}
	});
};

//  flip number positive or negative
const flipNumber = (num: number) => {
	return num > 0 ? -Math.abs(num) : Math.abs(num);
};
