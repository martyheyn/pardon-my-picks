import { prisma } from '$lib/server/prisma';
import type { $Enums } from '@prisma/client';

type markGames = {
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
		if (!game.homeTeamScore || !game.awayTeamScore || !game.pickScore) return;
		if (game.type === 'spread') {
			const homeTeam = game.pickTeam === game.homeTeam ? true : false;
			markWinnersLogic(game, homeTeam);
		}
		if (game.type === 'totals') {
			if (game.description.includes('Over')) {
				if (game.homeTeamScore + game.awayTeamScore > game.pickScore) {
					await prisma.pick.updateMany({
						where: {
							gameId: game.gameId
						},
						data: {
							winner: 1,
							push: 0,
							marked: true
						}
					});
				} else if (game.homeTeamScore + game.awayTeamScore === game.pickScore) {
					await prisma.pick.updateMany({
						where: {
							gameId: game.gameId
						},
						data: {
							winner: 0,
							push: 1,
							marked: true
						}
					});
				} else {
					await prisma.pick.updateMany({
						where: {
							gameId: game.gameId
						},
						data: {
							winner: 0,
							push: 0,
							marked: true
						}
					});
				}
			}

			if (game.description.includes('Under')) {
				if (game.homeTeamScore + game.awayTeamScore < game.pickScore) {
					await prisma.pick.updateMany({
						where: {
							gameId: game.gameId
						},
						data: {
							winner: 1,
							push: 0,
							marked: true
						}
					});
				} else if (game.homeTeamScore + game.awayTeamScore === game.pickScore) {
					await prisma.pick.updateMany({
						where: {
							gameId: game.gameId
						},
						data: {
							winner: 0,
							push: 1,
							marked: true
						}
					});
				} else {
					await prisma.pick.updateMany({
						where: {
							gameId: game.gameId
						},
						data: {
							winner: 0,
							push: 0,
							marked: true
						}
					});
				}
			}
		}
	});
};

const markWinnersLogic = async (game: markGames, homeTeam: boolean) => {
	if (!game.homeTeamScore || !game.awayTeamScore || !game.pickScore) return;

	if (homeTeam) {
		if (game.pickScore > 0 && game.homeTeamScore - game.awayTeamScore > game.pickScore) {
			await prisma.pick.updateMany({
				where: {
					gameId: game.gameId
				},
				data: {
					winner: 1,
					push: 0,
					marked: true
				}
			});
		} else if (game.pickScore < 0 && game.homeTeamScore - game.awayTeamScore < game.pickScore) {
			await prisma.pick.updateMany({
				where: {
					gameId: game.gameId
				},
				data: {
					winner: 1,
					push: 0,
					marked: true
				}
			});
		} else if (game.homeTeamScore - game.awayTeamScore === game.pickScore) {
			await prisma.pick.updateMany({
				where: {
					gameId: game.gameId
				},
				data: {
					winner: 0,
					push: 1,
					marked: true
				}
			});
		} else {
			await prisma.pick.updateMany({
				where: {
					gameId: game.gameId
				},
				data: {
					winner: 0,
					push: 0,
					marked: true
				}
			});
		}
	}

	if (!homeTeam) {
		if (game.pickScore > 0 && game.awayTeamScore - game.homeTeamScore > game.pickScore) {
			await prisma.pick.updateMany({
				where: {
					gameId: game.gameId
				},
				data: {
					winner: 1,
					push: 0,
					marked: true
				}
			});
		} else if (game.pickScore < 0 && game.awayTeamScore - game.homeTeamScore < game.pickScore) {
			await prisma.pick.updateMany({
				where: {
					gameId: game.gameId
				},
				data: {
					winner: 1,
					push: 0,
					marked: true
				}
			});
		} else if (game.awayTeamScore - game.homeTeamScore === game.pickScore) {
			await prisma.pick.updateMany({
				where: {
					gameId: game.gameId
				},
				data: {
					winner: 0,
					push: 1,
					marked: true
				}
			});
		} else {
			await prisma.pick.updateMany({
				where: {
					gameId: game.gameId
				},
				data: {
					winner: 0,
					push: 0,
					marked: true
				}
			});
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

	console.log('tails', tails);

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

	console.log('fades', fades);
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
