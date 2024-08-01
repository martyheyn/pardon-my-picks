import { prisma } from '$lib/server/prisma';

type badPick = {
	userId: string;
	week: number;
	count: number;
};

export const checkPicks = async () => {
	const badPicks: badPick[] = await prisma.$queryRaw`
        SELECT userId, week, COUNT(*) as count
        FROM Pick
        GROUP BY userId, week
        HAVING COUNT(*) > 2;
	`;

	if (badPicks.length > 0) {
		// delete that users picks for the week
		try {
			await prisma.pick.deleteMany({
				where: {
					userId: badPicks[0].userId,
					week: badPicks[0].week
				}
			});
		} catch (error) {
			console.error(error);
		}

		// suspend the user from picking
		// need a suspense list
		// send a message to the user
	}
};
