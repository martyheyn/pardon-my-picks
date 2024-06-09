// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { PrismaClient } from '@prisma/client';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
		interface Locals {
			user: import('lucia').User | null;
			session: import('lucia').Session | null;
		}
	}
	var prisma: PrismaClient;
}

// env variables
declare module '$env/static/private' {
	export const AWS_REGION: string;
	export const AWS_S3_BUCKET_NAME: string;
	export const AWS_ACCESS_KEY_ID: string;
	export const AWS_SECRET_ACCESS_KEY: string;
	export const ODDS_API_KEY: string;
}

declare module '$env/static/public' {
	export const PUBLIC_AWS_CLOUDFRONT_DISTRO: string;
}

export {};
