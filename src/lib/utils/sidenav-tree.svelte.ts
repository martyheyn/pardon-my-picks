import { PUBLIC_CURRENT_YEAR } from '$env/static/public';
import { getCurrentWeek } from '$lib/utils/nfl-week';

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

// worked out once per module load - fine here, unlike on the server: the browser loads this fresh
// on every visit, and the server never renders the nav (the root layout only renders in the browser)
const currWeekSubNavArr: { label: string; icon: string; route: string }[] = [];
for (let i = 1; i <= getCurrentWeek(Number(PUBLIC_CURRENT_YEAR)); i++) {
	currWeekSubNavArr.push({
		label: `Week ${i}`,
		icon: 'calendar',
		route: `/${PUBLIC_CURRENT_YEAR}/${i}`
	});
}

const EARLIEST_HISTORY_YEAR = 2023;

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

const historySubNavArr: subItems[] = [];
for (let year = Number(PUBLIC_CURRENT_YEAR); year >= EARLIEST_HISTORY_YEAR; year--) {
	historySubNavArr.push({
		label: `${year}`,
		icon: 'calendar',
		route: '',
		subItems: yearRoute(year),
		subItemsOpen: false
	});
}

export const sideNavItems: sideNavItems = $state([
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
		subItems: historySubNavArr,
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
]);
