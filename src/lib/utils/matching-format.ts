export const logo: { [key: string]: string } = {
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

export const teamLink: { [key: string]: string } = {
	cardinals: 'https://www.espn.com/nfl/team/_/name/ari/arizona-cardinals',
	falcons: 'https://www.espn.com/nfl/team/_/name/atl/atlanta-falcons',
	ravens: 'https://www.espn.com/nfl/team/_/name/bal/baltimore-ravens',
	bills: 'https://www.espn.com/nfl/team/_/name/buf/buffalo-bills',
	panthers: 'https://www.espn.com/nfl/team/_/name/car/carolina-panthers',
	bears: 'https://www.espn.com/nfl/team/_/name/chi/chicago-bears',
	bengals: 'https://www.espn.com/nfl/team/_/name/cin/cincinnati-bengals',
	browns: 'https://www.espn.com/nfl/team/_/name/cle/cleveland-browns',
	cowboys: 'https://www.espn.com/nfl/team/_/name/dal/dallas-cowboys',
	broncos: 'https://www.espn.com/nfl/team/_/name/den/denver-broncos',
	lions: 'https://www.espn.com/nfl/team/_/name/det/detroit-lions',
	packers: 'https://www.espn.com/nfl/team/_/name/gb/green-bay-packers',
	texans: 'https://www.espn.com/nfl/team/_/name/hou/houston-texans',
	colts: 'https://www.espn.com/nfl/team/_/name/ind/indianapolis-colts',
	jaguars: 'https://www.espn.com/nfl/team/_/name/jax/jacksonville-jaguars',
	chiefs: 'https://www.espn.com/nfl/team/_/name/kc/kansas-city-chiefs',
	chargers: 'https://www.espn.com/nfl/team/_/name/lac/los-angeles-chargers',
	rams: 'https://www.espn.com/nfl/team/_/name/lar/los-angeles-rams',
	dolphins: 'https://www.espn.com/nfl/team/_/name/mia/miami-dolphins',
	vikings: 'https://www.espn.com/nfl/team/_/name/min/minnesota-vikings',
	patriots: 'https://www.espn.com/nfl/team/_/name/ne/new-england-patriots',
	saints: 'https://www.espn.com/nfl/team/_/name/no/new-orleans-saints',
	giants: 'https://www.espn.com/nfl/team/_/name/nyg/new-york-giants',
	jets: 'https://www.espn.com/nfl/team/_/name/nyj/new-york-jets',
	raiders: 'https://www.espn.com/nfl/team/_/name/lv/las-vegas-raiders',
	eagles: 'https://www.espn.com/nfl/team/_/name/phi/philadelphia-eagles',
	steelers: 'https://www.espn.com/nfl/team/_/name/pit/pittsburgh-steelers',
	fortyNiners: 'https://www.espn.com/nfl/team/_/name/sf/san-francisco-49ers',
	seahawks: 'https://www.espn.com/nfl/team/_/name/sea/seattle-seahawks',
	buccaneers: 'https://www.espn.com/nfl/team/_/name/tb/tampa-bay-buccaneers',
	titans: 'https://www.espn.com/nfl/team/_/name/ten/tennessee-titans',
	commanders: 'https://www.espn.com/nfl/team/_/name/wsh/washington-commanders'
};

// TODO: make this an enum
export const fullNameToMascot: { [key: string]: string } = {
	'Arizona Cardinals': 'cardinals',
	'Atlanta Falcons': 'falcons',
	'Baltimore Ravens': 'ravens',
	'Buffalo Bills': 'bills',
	'Carolina Panthers': 'panthers',
	'Chicago Bears': 'bears',
	'Cincinnati Bengals': 'bengals',
	'Cleveland Browns': 'browns',
	'Dallas Cowboys': 'cowboys',
	'Denver Broncos': 'broncos',
	'Detroit Lions': 'lions',
	'Green Bay Packers': 'packers',
	'Houston Texans': 'texans',
	'Indianapolis Colts': 'colts',
	'Jacksonville Jaguars': 'jaguars',
	'Kansas City Chiefs': 'chiefs',
	'Los Angeles Chargers': 'chargers',
	'Los Angeles Rams': 'rams',
	'Miami Dolphins': 'dolphins',
	'Minnesota Vikings': 'vikings',
	'New England Patriots': 'patriots',
	'New Orleans Saints': 'saints',
	'New York Giants': 'giants',
	'New York Jets': 'jets',
	'Las Vegas Raiders': 'raiders',
	'Philadelphia Eagles': 'eagles',
	'Pittsburgh Steelers': 'steelers',
	'San Francisco 49ers': 'fortyNiners',
	'Seattle Seahawks': 'seahawks',
	'Tampa Bay Buccaneers': 'buccaneers',
	'Tennessee Titans': 'titans',
	'Washington Commanders': 'commanders'
};

export const mascotToFullName: { [key: string]: string } = {
	cardinals: 'Arizona Cardinals',
	falcons: 'Atlanta Falcons',
	ravens: 'Baltimore Ravens',
	bills: 'Buffalo Bills',
	panthers: 'Carolina Panthers',
	bears: 'Chicago Bears',
	bengals: 'Cincinnati Bengals',
	browns: 'Cleveland Browns',
	cowboys: 'Dallas Cowboys',
	broncos: 'Denver Broncos',
	lions: 'Detroit Lions',
	packers: 'Green Bay Packers',
	texans: 'Houston Texans',
	colts: 'Indianapolis Colts',
	jaguars: 'Jacksonville Jaguars',
	chiefs: 'Kansas City Chiefs',
	chargers: 'Los Angeles Chargers',
	rams: 'Los Angeles Rams',
	dolphins: 'Miami Dolphins',
	vikings: 'Minnesota Vikings',
	patriots: 'New England Patriots',
	saints: 'New Orleans Saints',
	giants: 'New York Giants',
	jets: 'New York Jets',
	raiders: 'Las Vegas Raiders',
	eagles: 'Philadelphia Eagles',
	steelers: 'Pittsburgh Steelers',
	fortyNiners: 'San Francisco 49ers',
	seahawks: 'Seattle Seahawks',
	buccaneers: 'Tampa Bay Buccaneers',
	titans: 'Tennessee Titans',
	commanders: 'Washington Commanders'
};

export const fullNameToAbrv: { [key: string]: { abbr: string; mascot: string } } = {
	'Arizona Cardinals': {
		abbr: 'ARI',
		mascot: 'Cardinals'
	},
	'Atlanta Falcons': {
		abbr: 'ATL',
		mascot: 'Falcons'
	},
	'Baltimore Ravens': {
		abbr: 'BAL',
		mascot: 'Ravens'
	},
	'Buffalo Bills': {
		abbr: 'BUF',
		mascot: 'Bills'
	},
	'Carolina Panthers': {
		abbr: 'CAR',
		mascot: 'Panthers'
	},
	'Chicago Bears': {
		abbr: 'CHI',
		mascot: 'Bears'
	},
	'Cincinnati Bengals': {
		abbr: 'CIN',
		mascot: 'Bengals'
	},
	'Cleveland Browns': {
		abbr: 'CLE',
		mascot: 'Browns'
	},
	'Dallas Cowboys': {
		abbr: 'DAL',
		mascot: 'Cowboys'
	},
	'Denver Broncos': {
		abbr: 'DEN',
		mascot: 'Broncos'
	},
	'Detroit Lions': {
		abbr: 'DET',
		mascot: 'Lions'
	},
	'Green Bay Packers': {
		abbr: 'GB',
		mascot: 'Packers'
	},
	'Houston Texans': {
		abbr: 'HOU',
		mascot: 'Texans'
	},
	'Indianapolis Colts': {
		abbr: 'IND',
		mascot: 'Colts'
	},
	'Jacksonville Jaguars': {
		abbr: 'JAX',
		mascot: 'Jaguars'
	},
	'Kansas City Chiefs': {
		abbr: 'KC',
		mascot: 'Chiefs'
	},
	'Los Angeles Chargers': {
		abbr: 'LAC',
		mascot: 'Chargers'
	},
	'Los Angeles Rams': {
		abbr: 'LAR',
		mascot: 'Rams'
	},
	'Miami Dolphins': {
		abbr: 'MIA',
		mascot: 'Dolphins'
	},
	'Minnesota Vikings': {
		abbr: 'MIN',
		mascot: 'Vikings'
	},
	'New England Patriots': {
		abbr: 'NE',
		mascot: 'Patriots'
	},
	'New Orleans Saints': {
		abbr: 'NO',
		mascot: 'Saints'
	},
	'New York Giants': {
		abbr: 'NYG',
		mascot: 'Giants'
	},
	'New York Jets': {
		abbr: 'NYJ',
		mascot: 'Jets'
	},
	'Las Vegas Raiders': {
		abbr: 'LV',
		mascot: 'Raiders'
	},
	'Philadelphia Eagles': {
		abbr: 'PHI',
		mascot: 'Eagles'
	},
	'Pittsburgh Steelers': {
		abbr: 'PIT',
		mascot: 'Steelers'
	},
	'San Francisco 49ers': {
		abbr: 'SF',
		mascot: '49ers'
	},
	'Seattle Seahawks': {
		abbr: 'SEA',
		mascot: 'Seahawks'
	},
	'Tampa Bay Buccaneers': {
		abbr: 'TB',
		mascot: 'Buccaneers'
	},
	'Tennessee Titans': {
		abbr: 'TEN',
		mascot: 'Titans'
	},
	'Washington Commanders': {
		abbr: 'WAS',
		mascot: 'Commanders'
	}
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
			return '/personas/zach-wilson-bench-no-bg.png';
		case 'Huey':
			return '/personas/huey.png';
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
			return '/avatars/dianna-russini.jpg';
		case 'Zach':
			return '/avatars/zach.jpg';
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
		case 'Zach':
			return 'zach';
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
		case 'zacb':
			return 'Zach';
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
		case 'Zach':
			return 'zach';
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
		case 'zach':
			return 'Zach';
		default:
			return 'Big Cat';
	}
};

export const sortOrder = {
	'Big Cat': 1,
	PFT: 2,
	Hank: 3,
	Max: 4,
	Memes: 5,
	Zach: 6,
	Jake: 7
};

export type SpecialBetKey =
	| 'lunder'
	| 'timezone'
	| 'gameOfTheYear'
	| 'huh'
	| 'thanksgiving'
	| 'holiday'
	| 'malikWillis'
	| 'gunder';

type SpecialBetsLabelMap = {
	[key in SpecialBetKey]: string;
};

export const specialBetsLabelMap: SpecialBetsLabelMap = {
	lunder: "L'Under",
	timezone: 'Timezone',
	gameOfTheYear: 'Game of the Year',
	huh: 'Huh?',
	thanksgiving: 'Thanksgiving',
	holiday: 'Holiday',
	malikWillis: 'Malik Willis',
	gunder: "G'under"
};

export const nflTeams = [
	'Arizona Cardinals',
	'Atlanta Falcons',
	'Baltimore Ravens',
	'Buffalo Bills',
	'Carolina Panthers',
	'Chicago Bears',
	'Cincinnati Bengals',
	'Cleveland Browns',
	'Dallas Cowboys',
	'Denver Broncos',
	'Detroit Lions',
	'Green Bay Packers',
	'Houston Texans',
	'Indianapolis Colts',
	'Jacksonville Jaguars',
	'Kansas City Chiefs',
	'Los Angeles Chargers',
	'Los Angeles Rams',
	'Miami Dolphins',
	'Minnesota Vikings',
	'New England Patriots',
	'New Orleans Saints',
	'New York Giants',
	'New York Jets',
	'Las Vegas Raiders',
	'Philadelphia Eagles',
	'Pittsburgh Steelers',
	'San Francisco 49ers',
	'Seattle Seahawks',
	'Tampa Bay Buccaneers',
	'Tennessee Titans',
	'Washington Commanders'
];
