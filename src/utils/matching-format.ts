export const logo = {
	cardinals: '/nfl-team-logos/cardinals.png',
	falcons: '/nfl-team-logos/falcons.png',
	ravens: '/nfl-team-logos/ravens.png',
	bills: '/nfl-team-logos/bills.png',
	panthers: '/nfl-team-logos/panthers.png',
	bears: '/nfl-team-logos/bears.png',
	bengals: '/nfl-team-logos/bengals.png',
	browns: '/nfl-team-logos/browns.png',
	cowboys: '/nfl-team-logos/cowboys.png',
	broncos: '/nfl-team-logos/broncos.png',
	lions: '/nfl-team-logos/lions.png',
	packers: '/nfl-team-logos/packers.png',
	texans: '/nfl-team-logos/texans.png',
	colts: '/nfl-team-logos/colts.png',
	jaguars: '/nfl-team-logos/jaguars.png',
	chiefs: '/nfl-team-logos/chiefs.png',
	chargers: '/nfl-team-logos/chargers.png',
	rams: '/nfl-team-logos/rams.png',
	dolphins: '/nfl-team-logos/dolphins.png',
	vikings: '/nfl-team-logos/vikings.png',
	patriots: '/nfl-team-logos/patriots.png',
	saints: '/nfl-team-logos/saints.png',
	giants: '/nfl-team-logos/giants.png',
	jets: '/nfl-team-logos/jets.png',
	raiders: '/nfl-team-logos/raiders.png',
	eagles: '/nfl-team-logos/eagles.png',
	steelers: '/nfl-team-logos/steelers.png',
	fortyNiners: '/nfl-team-logos/49ers.png',
	seahawks: '/nfl-team-logos/seahawks.png',
	buccaneers: '/nfl-team-logos/buccaneers.png',
	titans: '/nfl-team-logos/titans.png',
	commanders: '/nfl-team-logos/commanders.png'
};

export const personaImgPath = (person: string) => {
	switch (person) {
		case 'Big Cat':
			return '/personas/big-cat.png';
		case 'PFT':
			return '/personas/pft-jnco.png';
		case 'Hank':
			return '/personas/hank-f45.png';
		case 'Jake':
			return '/personas/jake-marsh.png';
		case 'Max':
			return '/personas/sad-max-pmt.png';
		case 'Memes':
			return '/personas/zach-wilson-bench.jpg';
		default:
			return '/personas/sad-max-pmt.png';
	}
};

export const personaAvatarPath = (person: string) => {
	switch (person) {
		case 'Big Cat':
			return '/avatars/big-cat-avatar.jpg';
		case 'PFT':
			return '/avatars/pft-avatar.jpg';
		case 'Hank':
			return '/avatars/hank-avatar.jpg';
		case 'Jake':
			return '/avatars/jake-avatar.jpg';
		case 'Max':
			return '/avatars/max-avatar.jpg';
		case 'Memes':
			return '/avatars/zach-wilson-mirror.jpg';
		default:
			return '/avatars/sad-max-pmt.png';
	}
};

export const personasLabelToCamelCase = (person: string) => {
	switch (person) {
		case 'Big Cat':
			return 'bigCat';
		case 'PFT':
			return 'pft';
		case 'Hank':
			return 'hank';
		case 'Jake':
			return 'jake';
		case 'Max':
			return 'max';
		case 'Memes':
			return 'memes';
		default:
			return 'big-cat';
	}
};

export const camelCaseToLabel = (person: string) => {
	switch (person) {
		case 'bigCat':
			return 'Big Cat';
		case 'pft':
			return 'PFT';
		case 'hank':
			return 'Hank';
		case 'jake':
			return 'Jake';
		case 'max':
			return 'Max';
		case 'memes':
			return 'Memes';
		default:
			return 'Big Cat';
	}
};

export const personasLabelToslug = (person: string) => {
	switch (person) {
		case 'Big Cat':
			return 'big-cat';
		case 'PFT':
			return 'pft-commenter';
		case 'Hank':
			return 'handsome-hank';
		case 'Jake':
			return 'cake-marsh';
		case 'Max':
			return 'bat-girl';
		case 'Memes':
			return 'memes';
		default:
			return 'big-cat';
	}
};

export const sluglToPersona = (person: string) => {
	switch (person) {
		case 'big-cat':
			return 'Big Cat';
		case 'pft-commenter':
			return 'PFT';
		case 'handsome-hank':
			return 'Hank';
		case 'cake-marsh':
			return 'Jake';
		case 'bat-girl':
			return 'Max';
		case 'memes':
			return 'Memes';
		default:
			return 'Big Cat';
	}
};

export const sortOrder = {
	'Big Cat': 1,
	PFT: 2,
	Hank: 3,
	Jake: 4,
	Max: 5,
	Memes: 6
};
