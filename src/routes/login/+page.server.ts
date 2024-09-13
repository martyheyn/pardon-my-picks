import { lucia } from '$lib/server/lucia';
import { prisma } from '$lib/server/prisma';
import { fail, redirect } from '@sveltejs/kit';
import { Argon2id } from 'oslo/password';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { PEPPER } from '$env/static/private';
import { RateLimiter } from 'sveltekit-rate-limiter/server';

import type { Actions, PageServerLoad } from './$types';

const limiter = new RateLimiter({
	// A rate is defined as [number, unit]
	IP: [10, 'm'], // IP address limiter
	IPUA: [10, 'm'], // IP + User Agent limiter
	cookie: {
		// Cookie limiter
		name: 'limiterid', // Unique cookie name for this limiter
		secret: 'SECRETKEY-SERVER-ONLY', // Use $env/static/private
		rate: [10, 'm'],
		preflight: true // Require preflight call (see load function)
	}
});

const LoginFormSchema = z.object({
	username: z.string().min(6),
	password: z.string().min(6)
});

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		redirect(303, '/');
	}

	/**
	 * Preflight prevents direct posting. If preflight option for the
	 * cookie limiter is true and this function isn't called before posting,
	 * request will be limited.
	 *
	 * Remember to await, so the cookie will be set before returning!
	 */
	await limiter.cookieLimiter?.preflight(event);

	// initialize form
	const form = await superValidate(zod(LoginFormSchema));

	return { form };
};

export const actions: Actions = {
	default: async (event: any) => {
		const form = await superValidate(event, zod(LoginFormSchema));

		// rate limiter: Every call to isLimited counts as a hit towards the rate limit for the event.
		if (await limiter.isLimited(event)) {
			return setError(form, 'You hit your rate limit. Try again later bud.');
		}

		const { username, password } = form.data;

		if (!form.valid) {
			// Again, return { form } and things will just work.
			return fail(400, { form });
		}

		// check if user in the database
		const existingUser = await prisma.user.findUnique({
			where: {
				username
			}
		});
		if (!existingUser) {
			// NOTE:
			// Returning immediately allows malicious actors to figure out valid usernames from response times,
			// allowing them to only focus on guessing passwords in brute-force attacks.
			// As a preventive measure, you may want to hash passwords even for invalid usernames.
			// However, valid usernames can be already be revealed with the signup page among other methods.
			// It will also be much more resource intensive.
			// Since protecting against this is none-trivial,
			// it is crucial your implementation is protected against brute-force attacks with login throttling etc.
			// If usernames are public, you may outright tell the user that the username is invalid.
			return setError(form, 'Incorrect username or password');
		}

		const pass = password + PEPPER;
		const validPassword = await new Argon2id().verify(existingUser.hashed_password, pass);
		if (!validPassword) {
			return setError(form, 'Incorrect username or password');
		}

		// secure flag for security duh
		const session = await lucia.createSession(existingUser.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		sessionCookie.attributes.secure = true;
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		// Execute both return and redirect asynchronously
		await Promise.all([
			{ form },
			redirect(303, '/') // Redirect to the desired page
		]);
	}
};
