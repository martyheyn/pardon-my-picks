import { lucia } from '$lib/server/lucia';
import { prisma } from '$lib/server/prisma';
import { fail, redirect } from '@sveltejs/kit';
import { Argon2id } from 'oslo/password';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { message } from 'sveltekit-superforms';
import { z } from 'zod';

import type { Actions, PageServerLoad } from './$types';

const LoginFormSchema = z.object({
	username: z.string().min(6),
	password: z.string().min(6)
});

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, '/');
	}

	// initialize form
	const form = await superValidate(zod(LoginFormSchema));

	return { form };
};

export const actions: Actions = {
	default: async (event: any) => {
		const form = await superValidate(event, zod(LoginFormSchema));

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
			return fail(400, { form });
		}

		const validPassword = await new Argon2id().verify(existingUser.hashed_password, password);
		if (!validPassword) {
			console.log('no user, or wrong credentials');

			return setError(form, 'Incorrect username or password');
		}

		const session = await lucia.createSession(existingUser.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
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
