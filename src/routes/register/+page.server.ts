import { lucia } from '$lib/server/lucia';
import { prisma } from '$lib/server/prisma';
import { fail, redirect } from '@sveltejs/kit';
import { generateId } from 'lucia';
import { Argon2id } from 'oslo/password';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { RateLimiter } from 'sveltekit-rate-limiter/server';

import type { Actions, PageServerLoad } from './$types';
import { PEPPER } from '$env/static/private';

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

const RegisterFormSchema = z.object({
	username: z
		.string()
		.min(6)
		.refine((s) => !s.includes(' '), 'No Spaces!'),
	password: z
		.string()
		.min(6)
		.refine((s) => !s.includes(' '), 'No Spaces!'),
	confirmPassword: z.string().min(6)
});

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		redirect(303, '/');
	}

	await limiter.cookieLimiter?.preflight(event);

	// initialize form
	const form = await superValidate(zod(RegisterFormSchema));

	return { form };
};

export const actions: Actions = {
	default: async (event: any) => {
		const form = await superValidate(event, zod(RegisterFormSchema));

		// check if the form is tries to manipulate the role
		if ((form.data as any).role) {
			return setError(form, 'Nope. Nice try. Blocking your IP brah.');
		}

		// rate limiter: Every call to isLimited counts as a hit towards the rate limit for the event.
		if (await limiter.isLimited(event)) {
			return setError(form, 'You hit your rate limit. Try again later bud.');
		}

		const { username, password, confirmPassword } = form.data;

		if (!form.valid) {
			// Again, return { form } and things will just work.
			return fail(400, { form });
		}

		const user = await prisma.user.findUnique({
			where: {
				username
			}
		});

		if (user) {
			return setError(form, 'Username or password is already taken');
		}

		if (password !== confirmPassword) {
			return setError(form, 'Password does not match');
		}

		const userId = generateId(36);
		const pass = password + PEPPER;
		const passwordHash = await new Argon2id().hash(pass);

		const passwordUsed = await prisma.user.findUnique({
			where: {
				NOT: {
					username: username
				},
				hashed_password: passwordHash
			}
		});

		if (passwordUsed) {
			return setError(form, 'Username or password is already taken');
		}

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
		await Promise.all([
			{ form },
			redirect(303, '/') // Redirect to the desired page
		]);
	}
};
