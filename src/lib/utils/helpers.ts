export function generateSecureRandomString(length: number): string {
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function getDayOfWeek(): number {
	const date = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
	return new Date(date).getDay();
}

export function isBettingOpen(dayOfWeek: number): boolean {
	return dayOfWeek !== 0 && dayOfWeek !== 1;
}

// gameDate is a real UTC instant - a Date from prisma, or an ISO string once it has gone through
// JSON - so comparing epoch millis gives the same answer no matter what timezone this runs in
export function hasGameStarted(gameDate: Date | string, now: Date = new Date()): boolean {
	return new Date(gameDate).getTime() <= now.getTime();
}

// the pickem page labels a new spread pick 'spread', but saved picks (and the-odds-api market key)
// use 'spreads' - normalize before comparing so a saved spread and a new spread count as the same type
export function normalizePickType(type: string): 'spreads' | 'totals' | null {
	if (type === 'spread' || type === 'spreads') return 'spreads';
	if (type === 'totals') return 'totals';
	return null;
}

type SavedPick = { id: string; type: string; gameDate: Date | null };

export type PickSavePlan<T> =
	{ ok: true; deleteIds: string[]; newPicks: T[] } | { ok: false; message: string };

// works out what saving a user's 2 weekly picks should change, without touching the db:
// picks they kept stay as-is (same row, same line), dropped picks get deleted, and only brand new
// picks get created - so a pick whose game already started can stay put while the other one is swapped
export function planPickSave<T extends { id: string; type: string }>(
	savedPicks: SavedPick[],
	submittedPicks: T[],
	now: Date = new Date()
): PickSavePlan<T> {
	const submittedIds = new Set(submittedPicks.map((pick) => pick.id));
	if (submittedPicks.length !== 2 || submittedIds.size !== 2) {
		return { ok: false, message: 'You must make 2 picks per week' };
	}

	const savedIds = new Set(savedPicks.map((pick) => pick.id));
	const keptPicks = savedPicks.filter((pick) => submittedIds.has(pick.id));
	const droppedPicks = savedPicks.filter((pick) => !submittedIds.has(pick.id));
	const newPicks = submittedPicks.filter((pick) => !savedIds.has(pick.id));

	if (droppedPicks.some((pick) => pick.gameDate && hasGameStarted(pick.gameDate, now))) {
		return { ok: false, message: 'That game already kicked off, you are locked in on that pick' };
	}

	// kept picks use their saved type, so an edited request can't relabel a pick that's already in the db
	const finalTypes = [...keptPicks, ...newPicks].map((pick) => normalizePickType(pick.type));
	if (!finalTypes.includes('spreads') || !finalTypes.includes('totals')) {
		return { ok: false, message: 'Make one spread pick and one total pick' };
	}

	return { ok: true, deleteIds: droppedPicks.map((pick) => pick.id), newPicks };
}
