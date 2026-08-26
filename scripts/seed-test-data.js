// Seeds a known test user + a couple of picks for the current year/week so
// Playwright smoke tests (added from Section 3 onward) have something real
// to log in with and view. Safe to re-run — everything is upserted by a
// fixed id/username. Not wired into any production data path.
//
// Usage: node --env-file=.env scripts/seed-test-data.js

import { PrismaClient } from '@prisma/client';
import { Argon2id } from 'oslo/password';

const prisma = new PrismaClient();

export const TEST_USER = {
	username: 'e2e_test_user',
	password: 'E2eTestPass123'
};

export const TEST_ADMIN = {
	username: 'e2e_test_admin',
	password: 'E2eTestAdminPass123'
};

const YEAR = parseInt(process.env.CURRENT_YEAR);
const WEEK = parseInt(process.env.CURRENT_WEEK);

async function seedUser({ id, username, password, role }) {
	const pass = password + process.env.PEPPER;
	const hashedPassword = await new Argon2id().hash(pass);

	const user = await prisma.user.upsert({
		where: { username },
		update: { hashed_password: hashedPassword },
		create: {
			id,
			username,
			hashed_password: hashedPassword,
			role
		}
	});

	console.log(`Seeded ${role} "${user.username}" (password: ${password})`);
	return user;
}

async function seedTestPicks() {
	const picks = [
		{
			id: 'seed-e2e-test-pick-1',
			person: 'Big Cat',
			type: 'spreads',
			description: 'Chiefs -3.5',
			homeTeam: 'chiefs',
			awayTeam: 'bills',
			pickTeam: 'chiefs',
			pickTotalType: null,
			pickScore: -3.5
		},
		{
			id: 'seed-e2e-test-pick-2',
			person: 'PFT',
			type: 'totals',
			description: 'Chiefs vs Bills Over 47.5',
			homeTeam: 'chiefs',
			awayTeam: 'bills',
			pickTeam: null,
			pickTotalType: 'over',
			pickScore: 47.5
		}
	];

	// keep the game a week out so tail/fade stay enabled (the app disables them once
	// gameDate has passed) — recomputed on every run so re-seeding doesn't go stale
	const gameDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

	for (const pick of picks) {
		await prisma.pick.upsert({
			where: { id: pick.id },
			update: { gameDate, isLive: false, completed: false },
			create: {
				id: pick.id,
				gameId: `seed-e2e-${pick.homeTeam}-${pick.awayTeam}`,
				year: YEAR,
				show: 'PMT',
				week: WEEK,
				person: pick.person,
				type: pick.type,
				description: pick.description,
				league: 'NFL',
				homeTeam: pick.homeTeam,
				awayTeam: pick.awayTeam,
				isLive: false,
				completed: false,
				marked: false,
				pickTeam: pick.pickTeam,
				pickTotalType: pick.pickTotalType,
				pickScore: pick.pickScore,
				gameDate,
				private: false,
				userId: null,
				barstoolEmployee: true,
				pmtPersona: true
			}
		});
	}

	console.log(`Seeded ${picks.length} test picks for year ${YEAR}, week ${WEEK}`);
}

async function main() {
	if (!process.env.PEPPER || !YEAR || !WEEK) {
		throw new Error(
			'Missing required env vars (PEPPER, CURRENT_YEAR, CURRENT_WEEK) — run via `node --env-file=.env scripts/seed-test-data.js`'
		);
	}

	await seedUser({ id: 'seed-e2e-test-user', ...TEST_USER, role: 'user' });
	await seedUser({ id: 'seed-e2e-test-admin', ...TEST_ADMIN, role: 'admin' });
	await seedTestPicks();
}

// only run when executed directly (`node scripts/seed-test-data.js`), not when
// imported elsewhere (e.g. tests importing TEST_USER) to avoid re-seeding as a side effect
if (import.meta.url === `file://${process.argv[1]}`) {
	main()
		.catch((err) => {
			console.error(err);
			process.exitCode = 1;
		})
		.finally(async () => {
			await prisma.$disconnect();
		});
}
