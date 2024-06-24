import { prisma } from '$lib/server/prisma';
import type { Scores } from '$lib/utils/types';
import { ODDS_API_KEY } from '$env/static/private';

// create a function to check if a number is positive
function isPositive(num: number): boolean {
	return num > 0;
}
