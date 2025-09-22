import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	host: process.env.DB_HOST,
	port: 5432,
	database: process.env.DB_DATABASE,
	ssl: true
});

const markGames = async () => {
	console.log('Here markGames\n');

	try {
		const client = await pool.connect();

		await client.query(`UPDATE "Pick" SET is_live = false WHERE is_live = true`);

		let unMarkedGames = await client.query(`
        SELECT * FROM "Pick"
        WHERE winner IS NULL
        AND marked = FALSE
        AND week = ${process.env.CURRENT_WEEK}
    AND year = ${process.env.CURRENT_YEAR}`);

		unMarkedGames = unMarkedGames.rows;

		if (unMarkedGames.length > 0) {
			// if not already in the db we gotta query the odds api
			// const response = await fetch(
			//   `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/scores/?daysFrom=3&apiKey=${ODDS_API_KEY}`
			// );
			const response = await fetch(
				`https://partners.api.espn.com/v2/sports/football/nfl/events?dates=${process.env.CURRENT_YEAR}${process.env.GAMES_START}-${process.env.CURRENT_YEAR}${process.env.GAMES_END}&limit=1000`
			);
			const scoresDataRawJson = await response.json();
			let scoresDataRaw = scoresDataRawJson.events
				.map((scores) => scores.competitions[0].competitors)
				.flat();

			if (scoresDataRaw.length === 0 || !scoresDataRaw) return [];

			// see if the game is done
			scoresDataRaw = scoresDataRaw.filter((sg) => sg.hasOwnProperty('winner'));
			const homeTeams = scoresDataRaw.filter((score) => score.homeAway === 'home');
			const awayTeams = scoresDataRaw.filter((score) => score.homeAway === 'away');

			const gamesToMark = await Promise.all(
				unMarkedGames.map(async (game) => {
					let home_team_score = null;
					let away_team_score = null;

					const ht_score = homeTeams?.find(
						(tm) => fullNameToMascot[tm.team.displayName] === game.home_team
					)?.score?.value;
					const at_score = awayTeams?.find(
						(tm) => fullNameToMascot[tm.team.displayName] === game.away_team
					)?.score?.value;

					home_team_score = ht_score ? ht_score : null;
					away_team_score = at_score ? at_score : null;

					if (home_team_score && away_team_score) {
						return {
							...game,
							home_team_score: home_team_score,
							away_team_score: away_team_score
						};
					}
				})
			).then((results) => results.flat().filter((val) => val != null));

			if (gamesToMark.length > 0) {
				const gamesData = gamesToMark.map((game) => {
					return {
						id: game.id,
						game_id: game.game_id,
						type: game.type,
						description: game.description,
						home_team: game.home_team,
						away_team: game.away_team,
						home_team_score: game.home_team_score,
						away_team_score: game.away_team_score,
						pick_team: game.pick_team,
						pick_score: game.pick_score,
						pick_total_type: game.pick_total_type
					};
				});

				try {
					if (gamesData && gamesData.length > 0) {
						await markResults(gamesData);
						await markWinner(gamesData);
					}
				} catch (error) {
					console.error(error);
				}
			}
		}
		client.release();
	} catch (err) {
		console.error(err);
	} finally {
		console.log('done, end the pool');
		await pool.end();
	}
};

const markWinner = async (games) => {
	console.log('Here markWinner\n');

	try {
		const client = await pool.connect();
		for (let i = 0; i < games.length; i++) {
			if (games[i].home_team_score === null || games[i].away_team_score === null) return;
			if (games[i].type === 'spreads' || games[i].type === 'spread') {
				const home_team = games[i].pick_team === games[i].home_team ? true : false;
				markSpreadLogic(games[i], home_team);
			}

			if (games[i].type === 'totals') {
				if (!games[i].pick_score) return;
				// console.log("here marking the total", games[i]);
				const total = games[i].home_team_score + games[i].away_team_score;
				if (games[i].pick_total_type === 'over') {
					if (total > games[i].pick_score) {
						await client.query(
							`UPDATE "Pick"
               SET
                    "winner" = 1,
                    "push" = 0,
                    "marked" = true,
                    "is_live" = false,
                    "completed" = true,
                    "home_team_score" = $1,
                    "away_team_score" = $2
                WHERE
                    "id" = $3
                    AND "game_id" = $4;`,
							[games[i].home_team_score, games[i].away_team_score, games[i].id, games[i].game_id]
						);
					} else if (total === games[i].pick_score) {
						await client.query(
							`UPDATE "Pick"
               SET
                    "winner" = 0,
                    "push" = 1,
                    "marked" = true,
                    "is_live" = false,
                    "completed" = true,
                    "home_team_score" = $1,
                    "away_team_score" = $2
                WHERE
                    "id" = $3
                    AND "game_id" = $4;`,
							[games[i].home_team_score, games[i].away_team_score, games[i].id, games[i].game_id]
						);
					} else {
						await client.query(
							`UPDATE "Pick"
               SET
                    "winner" = 0,
                    "push" = 0,
                    "marked" = true,
                    "is_live" = false,
                    "completed" = true,
                    "home_team_score" = $1,
                    "away_team_score" = $2
                WHERE
                    "id" = $3
                    AND "game_id" = $4;`,
							[games[i].home_team_score, games[i].away_team_score, games[i].id, games[i].game_id]
						);
					}
				}

				if (games[i].pick_total_type === 'under') {
					if (total < games[i].pick_score) {
						await client.query(
							`UPDATE "Pick"
               SET
                    "winner" = 1,
                    "push" = 0,
                    "marked" = true,
                    "is_live" = false,
                    "completed" = true,
                    "home_team_score" = $1,
                    "away_team_score" = $2
                WHERE
                    "id" = $3
                    AND "game_id" = $4;`,
							[games[i].home_team_score, games[i].away_team_score, games[i].id, games[i].game_id]
						);
					} else if (total === games[i].pick_score) {
						await client.query(
							`UPDATE "Pick"
               SET
                    "winner" = 0,
                    "push" = 1,
                    "marked" = true,
                    "is_live" = false,
                    "completed" = true,
                    "home_team_score" = $1,
                    "away_team_score" = $2
                WHERE
                    "id" = $3
                    AND "game_id" = $4;`,
							[games[i].home_team_score, games[i].away_team_score, games[i].id, games[i].game_id]
						);
					} else {
						await client.query(
							`UPDATE "Pick"
               SET
                    "winner" = 0,
                    "push" = 0,
                    "marked" = true,
                    "is_live" = false,
                    "completed" = true,
                    "home_team_score" = $1,
                    "away_team_score" = $2
                WHERE
                    "id" = $3
                    AND "game_id" = $4;`,
							[games[i].home_team_score, games[i].away_team_score, games[i].id, games[i].game_id]
						);
					}
				}
			}
		}

		console.log('done marking the winners');
		client.release();
	} catch (error) {
		console.error(error);
	}
};

const markSpreadLogic = async (game, home_team) => {
	if (game.home_team_score === null || game.away_team_score === null || game.pick_score === null)
		return;

	// console.log("Here markSpreadLogic\n", game);
	try {
		const client = await pool.connect();
		if (home_team) {
			const diff = game.home_team_score - game.away_team_score;
			if (diff > flipNumber(game.pick_score)) {
				await client.query(
					`UPDATE "Pick"
         SET
            "winner" = 1,
            "push" = 0,
            "marked" = true,
            "is_live" = false,
            "completed" = true,
            "home_team_score" = $1,
            "away_team_score" = $2
         WHERE
            "id" = $3
            AND "game_id" = $4;
        `,
					[game.home_team_score, game.away_team_score, game.id, game.game_id]
				);
			} else if (diff < flipNumber(game.pick_score)) {
				await client.query(
					`UPDATE "Pick"
         SET
            "winner" = 0,
            "push" = 0,
            "marked" = true,
            "is_live" = false,
            "completed" = true,
            "home_team_score" = $1,
            "away_team_score" = $2
         WHERE
            "id" = $3
            AND "game_id" = $4;
        `,
					[game.home_team_score, game.away_team_score, game.id, game.game_id]
				);
			} else if (diff === flipNumber(game.pick_score)) {
				await client.query(
					`UPDATE "Pick"
         SET
            "winner" = 0,
            "push" = 1,
            "marked" = true,
            "is_live" = false,
            "completed" = true,
            "home_team_score" = $1,
            "away_team_score" = $2
         WHERE
            "id" = $3
            AND "game_id" = $4;
        `,
					[game.home_team_score, game.away_team_score, game.id, game.game_id]
				);
			} else {
				console.error('error did not fit any condition');
			}
		}

		if (!home_team) {
			const diff = game.away_team_score - game.home_team_score;
			if (diff > flipNumber(game.pick_score)) {
				await client.query(
					`UPDATE "Pick"
         SET
            "winner" = 1,
            "push" = 0,
            "marked" = true,
            "is_live" = false,
            "completed" = true,
            "home_team_score" = $1,
            "away_team_score" = $2
         WHERE
            "id" = $3
            AND "game_id" = $4;
        `,
					[game.home_team_score, game.away_team_score, game.id, game.game_id]
				);
			} else if (diff < flipNumber(game.pick_score)) {
				await client.query(
					`UPDATE "Pick"
         SET
            "winner" = 0,
            "push" = 0,
            "marked" = true,
            "is_live" = false,
            "completed" = true,
            "home_team_score" = $1,
            "away_team_score" = $2
         WHERE
            "id" = $3
            AND "game_id" = $4;
        `,
					[game.home_team_score, game.away_team_score, game.id, game.game_id]
				);
			} else if (diff === flipNumber(game.pick_score)) {
				await client.query(
					`UPDATE "Pick"
         SET
            "winner" = 0,
            "push" = 1,
            "marked" = true,
            "is_live" = false,
            "completed" = true,
            "home_team_score" = $1,
            "away_team_score" = $2
         WHERE
            "id" = $3
            AND "game_id" = $4;
        `,
					[game.home_team_score, game.away_team_score, game.id, game.game_id]
				);
			} else {
				console.error('error did not fit any condition');
			}
		}

		client.release();
	} catch (error) {
		console.error(error);
	}
};

const markTailFade = async () => {
	const client = await pool.connect();

	try {
		let tails = await client.query(`
    SELECT t.id as t_id, p.id as p_id,
    p.winner as p_winner, p.push as p_push,
    t.winner as t_winner, t.push as t_push
    FROM "Tail" t
    LEFT JOIN "Pick" p ON "t".pick_id = "p".id
    WHERE t.winner IS NULL
    AND t.push IS NULL
    AND p.winner IS NOT NULL
    AND p.marked = TRUE
    AND p.is_live = FALSE
    `);
		tails = tails.rows;

		// markem
		for (let i = 0; i < tails.length; i++) {
			if (tails[i].p_winner === 1) {
				await client.query(
					`UPDATE "Tail"
           SET
              "winner" = 1,
              "push" = 0
           WHERE
              "id" = $1;`,
					[tails[i].t_id]
				);
			} else if (tails[i].p_winner === 0) {
				await client.query(
					`UPDATE "Tail"
           SET
              "winner" = 0,
              "push" = 0
           WHERE
              "id" = $1;`,
					[tails[i].t_id]
				);
			} else if (tails[i].p_push === 1) {
				await client.query(
					`UPDATE "Tail"
           SET
              "winner" = 0,
              "push" = 1
           WHERE
              "id" = $1;`,
					[tails[i].t_id]
				);
			}
		}

		// mark fades
		let fades = await client.query(`
    SELECT f.id as f_id, p.id as p_id,
    p.winner as p_winner, p.push as p_push,
    f.winner as f_winner, f.push as f_push
    FROM "Fade" f
    LEFT JOIN "Pick" p ON "f".pick_id = "p".id
    WHERE f.winner IS NULL
    AND f.push IS NULL
    AND p.winner IS NOT NULL
    AND p.marked = TRUE
    AND p.is_live = FALSE
    `);
		fades = fades.rows;

		// markem
		for (let i = 0; i < fades.length; i++) {
			if (fades[i].p_winner === 1) {
				await client.query(
					`UPDATE "Fade"
           SET
              "winner" = 0,
              "push" = 0
           WHERE
              "id" = $1;`,
					[fades[i].f_id]
				);
			} else if (fades[i].p_winner === 0) {
				await client.query(
					`UPDATE "Fade"
           SET
              "winner" = 1,
              "push" = 0
           WHERE
              "id" = $1;`,
					[fades[i].f_id]
				);
			} else if (fades[i].p_push === 1) {
				await client.query(
					`UPDATE "Fade"
           SET
              "winner" = 0,
              "push" = 1
           WHERE
              "id" = $1;`,
					[fades[i].f_id]
				);
			}
		}

		client.release();
	} catch (error) {
		client.release();
		console.error(error);
	}
};

//  flip number positive or negative
const flipNumber = (num) => {
	return num > 0 ? -Math.abs(num) : Math.abs(num);
};

const markResults = async (games) => {
	console.log('Here markResults\n');

	for (let i = 0; i < games.length; i++) {
		if (games[i].home_team_score === null || games[i].away_team_score === null) return;

		const result = `${games[i].away_team.slice(0, 1).toUpperCase()}${games[i].away_team.slice(1)} ${
			games[i].away_team_score
		} vs ${games[i].home_team.slice(0, 1).toUpperCase()}${games[i].home_team.slice(1)} ${
			games[i].home_team_score
		}`;

		// console.log("result", result);

		try {
			const client = await pool.connect();

			await client.query(
				`UPDATE "Pick"
              SET
                  result = $1
              WHERE
                  "id" = $2
                  AND "game_id" = $3;`,
				[result, games[i].id, games[i].game_id]
			);

			client.release();
		} catch (error) {
			console.error(error);
		}
	}
};

markGames();
markTailFade();

// const testQuery = async () => {
//   const client = await pool.connect();

//   const unMarkedGames = await client.query(`
//         SELECT * FROM "Pick"
//         WHERE winner IS NULL
//         AND marked = FALSE
//         AND week = ${WEEK}
//         AND year = ${YEAR}`);

//   client.release();
//   await pool.end();

//   const response = await fetch(
//     `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/scores/?daysFrom=3&apiKey=${ODDS_API_KEY}`
//   );
//   const scoresDataRaw = await response.json();

//   if (scoresDataRaw.length === 0 || !scoresDataRaw) return [];

//   const completedGames = scoresDataRaw.filter(
//     (score) => score.completed === true
//   );

//   if (completedGames.length === 0) return [];

//   // create map
//   let completedGamesMap = {};
//   for (let i = 0; i < completedGames.length; i++) {
//     completedGamesMap[completedGames[i].id] = completedGames[i].completed;
//   }

//   unMarkedGames.rows.forEach((game) => {
//     console.log("game", game);
//     if (completedGamesMap[game.game_id]) {
//       console.log("game is completed");
//     }
//   });

//   // console.log("completedGamesMap", completedGamesMap);
// };
// testQuery();

const fullNameToMascot = {
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
