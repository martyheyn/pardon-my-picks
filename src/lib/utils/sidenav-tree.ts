import { PUBLIC_CURRENT_WEEK, PUBLIC_CURRENT_YEAR } from '$env/static/public';

export type subItems = {
	label: string;
	icon: string;
	route: string;
	subItems?: {
		label: string;
		icon: string;
		route: string;
	}[];
	subItemsOpen?: boolean;
};

export type sideNavItems = {
	label: string;
	icon: string;
	route: string;
	subItems?: subItems[];
	subItemsOpen?: boolean;
}[];

const currWeekSubNavArr: { label: string; icon: string; route: string }[] = [];
for (let i = 1; i <= Number(PUBLIC_CURRENT_WEEK); i++) {
	currWeekSubNavArr.push({
		label: `Week ${i}`,
		icon: 'calendar',
		route: `/${PUBLIC_CURRENT_YEAR}/${i}`
	});
}

const yearRoute = (year: number) => {
	const weeksSubNavArr: { label: string; icon: string; route: string }[] = [];

	// TODO: loop through iterator should be dynamic based on current year or past
	for (let i = 1; i <= 18; i++) {
		weeksSubNavArr.push({
			label: `Week ${i}`,
			icon: 'calendar',
			route: `/${year}/${i}`
		});
	}

	return weeksSubNavArr;
};

export const sideNavItems: sideNavItems = [
	{
		label: 'Week',
		icon: 'calendar',
		route: `/${PUBLIC_CURRENT_YEAR}`,
		subItems: currWeekSubNavArr,
		subItemsOpen: false
	},
	{
		label: 'PickEm',
		icon: 'football',
		route: '/pickem'
	},
	{
		label: 'Stats',
		icon: 'stats',
		route: '/stats'
	},
	{
		label: 'History',
		icon: 'history',
		route: '/archive',
		subItems: [
			{
				label: '2024',
				icon: 'calendar',
				route: ``,
				subItems: yearRoute(2024),
				subItemsOpen: false
			},
			{
				label: '2023',
				icon: 'calendar',
				route: ``,
				subItems: yearRoute(2023),
				subItemsOpen: false
			}
		],
		subItemsOpen: false
	},
	{
		label: 'Profile',
		icon: 'user',
		route: `/user`
	},
	{
		label: 'Leader Board',
		icon: 'leaderBoard',
		route: '/leaderboard'
	}
];
