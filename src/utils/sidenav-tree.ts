const weekSubNavArr: { label: string; icon: string; route: string }[] = [];
for (let i = 1; i <= 14; i++) {
	weekSubNavArr.push({
		label: `Week ${i}`,
		icon: 'calendar',
		route: `/2023/${i}`
	});
}

// const personaSubNavArr: { label: string; icon: string; route: string }[] = [
// 	{
// 		label: 'Big Cat',
// 		icon: 'user',
// 		route: '/stats/bigcat'
// 	},
// 	{
// 		label: 'PFT',
// 		icon: 'user',
// 		route: '/stats/pft-commenter'
// 	},
// 	{
// 		label: 'Hank',
// 		icon: 'user',
// 		route: '/stats/handsome-hank'
// 	},
// 	{
// 		label: 'Jake Marsh',
// 		icon: 'user',
// 		route: '/stats/cake-marsh'
// 	},
// 	{
// 		label: 'Max',
// 		icon: 'user',
// 		route: '/stats/bat-girl'
// 	},
// 	{
// 		label: 'Memes',
// 		icon: 'user',
// 		route: '/stats/memes'
// 	}
// ];

export const sideNavItems = [
	{
		label: 'Week',
		icon: 'calendar',
		route: '/2023/14',
		subItems: weekSubNavArr,
		subItemsOpen: false
	},
	{
		label: 'Stats',
		icon: 'stats',
		route: '/stats'
		// subItems: personaSubNavArr,
		// subItemsOpen: false
	}
	// {
	// 	label: 'History',
	// 	icon: 'history',
	// 	route: '/archive'
	// }
];
