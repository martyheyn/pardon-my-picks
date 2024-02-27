import { lucia } from '$lib/server/lucia';
import { prisma } from '$lib/server/prisma';
import { fail, redirect } from '@sveltejs/kit';
import { generateId } from 'lucia';
import { Argon2id } from 'oslo/password';

import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event: any) => {
		const formData = await event.request.formData();
		const username = formData.get('username');
		const password = formData.get('password');
		const confirmPassword = formData.get('confirmPassword');

		// username must be between 4 ~ 31 characters
		// keep in mind some database (e.g. mysql) are case insensitive
		if (typeof username !== 'string' || username.length < 3 || username.length > 31) {
			return fail(400, {
				message: 'Invalid username'
			});
		}
		// TODO:: check if username is already taken
		const user = await prisma.user.findUnique({
			where: {
				username
			}
		});
		if (user) {
			return fail(400, {
				message: 'Username is already taken'
			});
		}
		if (typeof password !== 'string' || password.length < 6 || password.length > 99) {
			return fail(400, {
				message: 'Invalid password'
			});
		}
		if (password !== confirmPassword) {
			return fail(400, {
				message: 'Password does not match'
			});
		}

		const userId = generateId(15);
		const passwordHash = await new Argon2id().hash(password);

		// TODO:: input user into database
		const userData = {
			id: userId,
			username: username,
			hashed_password: passwordHash
		};

		await prisma.user.create({
			data: userData
		});

		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		// redirect to the login page
		throw redirect(302, '/login');
	}
};
