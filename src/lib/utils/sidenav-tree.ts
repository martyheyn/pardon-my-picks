type subItems = {
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

type sideNavItems = {
	label: string;
	icon: string;
	route: string;
	subItems?: subItems[];
	subItemsOpen?: boolean;
}[];

const currWeekSubNavArr: { label: string; icon: string; route: string }[] = [];
for (let i = 1; i <= 18; i++) {
	currWeekSubNavArr.push({
		label: `Week ${i}`,
		icon: 'calendar',
		route: `/2023/${i}`
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
		route: '/2023/18',
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
				label: '2023',
				icon: 'calendar',
				route: `/2023/1`,
				subItems: yearRoute(2023),
				subItemsOpen: false
			}
		],
		subItemsOpen: false
	},
	{
		label: 'Profile',
		icon: 'user',
		route: '/profile'
	}
];
