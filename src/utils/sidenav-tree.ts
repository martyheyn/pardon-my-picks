const weekSubNavArr: { label: string; icon: string; route: string }[] = [];
for (let i = 1; i <= 10; i++) {
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
// 		route: '/byperson/bigcat'
// 	},
// 	{
// 		label: 'PFT',
// 		icon: 'user',
// 		route: '/byperson/pft-commenter'
// 	},
// 	{
// 		label: 'Hank',
// 		icon: 'user',
// 		route: '/byperson/handsome-hank'
// 	},
// 	{
// 		label: 'Jake Marsh',
// 		icon: 'user',
// 		route: '/byperson/cake-marsh'
// 	},
// 	{
// 		label: 'Max',
// 		icon: 'user',
// 		route: '/byperson/bat-girl'
// 	},
// 	{
// 		label: 'Memes',
// 		icon: 'user',
// 		route: '/byperson/memes'
// 	}
// ];

export const sideNavItems = [
	{
		label: 'Week',
		icon: 'calendar',
		route: '/2023/10',
		subItems: weekSubNavArr,
		subItemsOpen: true
	},
	{
		label: 'Person',
		icon: 'user',
		route: '/byperson'
		// subItems: personaSubNavArr,
		// subItemsOpen: false
	},
	{
		label: 'History',
		icon: 'history',
		route: '/archive'
	}
];
