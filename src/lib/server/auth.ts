// src/lib/server/auth.ts
import { prisma } from '$lib/server/prisma';
import type { Session, User } from '@prisma/client';
import { generateSecureRandomString } from '$lib/utils/helpers';

interface SessionWithToken extends Session {
	token: string;
}

export async function createSession(userId: string) {
	const now = new Date();

	const id = generateSecureRandomString(16);
	const secret = generateSecureRandomString(16);
	const secretHash = await hashSecret(secret);
	const expiresAt = new Date(Date.now() + 2000 * 60 * 60 * 24 * 60); // 120 days

	const token = id + '.' + secret;

	const session: SessionWithToken = {
		id,
		userId,
		secretHash,
		createdAt: now,
		token,
		expiresAt
	};

	await prisma.session.create({
		data: {
			id,
			userId,
			secretHash,
			createdAt: now,
			expiresAt
		}
	});

	return session;
}

export async function validateSessionToken(
	token: string | undefined
): Promise<{ session: Session; user: User } | { session: null; user: null }> {
	if (!token) {
		return { session: null, user: null };
	}

	const tokenParts = token.split('.');
	if (tokenParts.length !== 2) {
		return { session: null, user: null };
	}

	const sessionId = tokenParts[0];
	const sessionSecret = tokenParts[1];

	const session = await getUserSession(sessionId);
	if (!session) {
		return { session: null, user: null };
	}

	const tokenSecretHash = await hashSecret(sessionSecret);
	const validSecret = constantTimeEqual(tokenSecretHash, session.secretHash);
	if (!validSecret) {
		return { session: null, user: null };
	}

	const user = await prisma.user.findUnique({
		where: { id: session.userId }
	});

	if (!user) {
		// stale session if user deleted
		invalidateSession(sessionId);
		return { session: null, user: null };
	}

	return { session, user };
}

export async function getUserSession(sessionId: string): Promise<Session | null> {
	const now = new Date();

	const resultSesh = await prisma.session.findUnique({
		where: {
			id: sessionId
		},
		select: {
			id: true,
			userId: true,
			secretHash: true,
			createdAt: true,
			expiresAt: true
		}
	});

	if (!resultSesh?.id) {
		return null;
	}
	const session: Session = {
		id: resultSesh?.id,
		userId: resultSesh.userId,
		secretHash: resultSesh.secretHash,
		createdAt: resultSesh.createdAt,
		expiresAt: resultSesh.expiresAt
	};

	// Check expiration
	if (session.expiresAt.getTime() <= now.getTime()) {
		await invalidateSession(sessionId);
		return null;
	}

	return session;
}

async function hashSecret(secret: string): Promise<Uint8Array> {
	const secretBytes = new TextEncoder().encode(secret);
	const secretHashBuffer = await crypto.subtle.digest('SHA-256', secretBytes);
	return new Uint8Array(secretHashBuffer);
}

export async function invalidateSession(sessionId: string) {
	try {
		await prisma.session.delete({ where: { id: sessionId } });
	} catch {
		console.log('cant invalidateSession');
		console.log('clear your application cache dawg');
	}
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.byteLength !== b.byteLength) {
		return false;
	}
	let c = 0;
	for (let i = 0; i < a.byteLength; i++) {
		c |= a[i] ^ b[i];
	}
	return c === 0;
}
