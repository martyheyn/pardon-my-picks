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
