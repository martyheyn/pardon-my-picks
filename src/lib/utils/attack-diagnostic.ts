import { prisma } from '$lib/server/prisma';

type badPick = {
	userId: string;
	week: number;
	count: number;
};

export const countPickByWeek = async () => {
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

// map for created at vs week you are in
// if the week is not the same as the week you are in, delete the pick
const dateToWeek = (date: Date, week: number) => {
	//go till it returns 18
	if (date > new Date('2024-09-08T00:00:00Z') && date < new Date('2024-09-11T00:00:00Z')) {
		if (week !== 1) {
			return 'error';
		}
	} else if (date > new Date('2024-09-15T00:00:00Z') && date < new Date('2024-09-18T00:00:00Z')) {
		if (week !== 2) {
			return 'error';
		}
	} else if (date > new Date('2024-09-22T00:00:00Z') && date < new Date('2024-09-25T00:00:00Z')) {
		if (week !== 3) {
			return 'error';
		}
	} else if (date > new Date('2024-09-29T00:00:00Z') && date < new Date('2024-10-02T00:00:00Z')) {
		if (week !== 4) {
			return 'error';
		}
	} else if (date > new Date('2024-10-06T00:00:00Z') && date < new Date('2024-10-09T00:00:00Z')) {
		if (week !== 5) {
			return 'error';
		}
	} else if (date > new Date('2024-10-13T00:00:00Z') && date < new Date('2024-10-16T00:00:00Z')) {
		if (week !== 6) {
			return 'error';
		}
	} else if (date > new Date('2024-10-20T00:00:00Z') && date < new Date('2024-10-23T00:00:00Z')) {
		if (week !== 7) {
			return 'error';
		}
	} else if (date > new Date('2024-10-27T00:00:00Z') && date < new Date('2024-10-30T00:00:00Z')) {
		if (week !== 8) {
			return 'error';
		}
	} else if (date > new Date('2024-11-03T00:00:00Z') && date < new Date('2024-11-06T00:00:00Z')) {
		if (week !== 9) {
			return 'error';
		}
	} else if (date > new Date('2024-11-10T00:00:00Z') && date < new Date('2024-11-13T00:00:00Z')) {
		if (week !== 10) {
			return 'error';
		}
	} else if (date > new Date('2024-11-17T00:00:00Z') && date < new Date('2024-11-20T00:00:00Z')) {
		if (week !== 11) {
			return 'error';
		}
	} else if (date > new Date('2024-11-24T00:00:00Z') && date < new Date('2024-11-27T00:00:00Z')) {
		if (week !== 12) {
			return 'error';
		}
	} else if (date > new Date('2024-12-01T00:00:00Z') && date < new Date('2024-12-04T00:00:00Z')) {
		if (week !== 13) {
			return 'error';
		}
	} else if (date > new Date('2024-12-08T00:00:00Z') && date < new Date('2024-12-11T00:00:00Z')) {
		if (week !== 14) {
			return 'error';
		}
	} else if (date > new Date('2024-12-15T00:00:00Z') && date < new Date('2024-12-18T00:00:00Z')) {
		if (week !== 15) {
			return 'error';
		}
	} else if (date > new Date('2024-12-22T00:00:00Z') && date < new Date('2024-12-25T00:00:00Z')) {
		if (week !== 16) {
			return 'error';
		}
	} else if (date > new Date('2024-12-29T00:00:00Z') && date < new Date('2025-01-01T00:00:00Z')) {
		if (week !== 17) {
			return 'error';
		}
	} else if (date > new Date('2025-01-05T00:00:00Z') && date < new Date('2025-01-08T00:00:00Z')) {
		if (week !== 18) {
			return 'error';
		}
	} else {
		return 'success';
	}
};

// make all of the picks for the week were for the current week
export const confirmWeekCorrect = async () => {
	const badPicks = await prisma.pick.findMany({
		select: {
			id: true,
			createdAt: true,
			week: true
		}
	});

	badPicks.forEach(async (pick) => {
		const week = dateToWeek(pick.createdAt!, pick.week!);

		if (week === 'error') {
			// delete the pick
			// prisma.pick.delete({
			// 	where: {
			// 		id: pick.id
			// 	}
			// });
		}
	});
};
