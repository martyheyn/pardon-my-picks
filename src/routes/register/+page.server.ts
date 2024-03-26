import { lucia } from '$lib/server/lucia';
import { prisma } from '$lib/server/prisma';
import { fail, redirect } from '@sveltejs/kit';
import { generateId } from 'lucia';
import { Argon2id } from 'oslo/password';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

import type { Actions, PageServerLoad } from './$types';

const RegisterFormSchema = z.object({
	username: z.string().min(6),
	password: z.string().min(6),
	confirmPassword: z.string().min(6)
});

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, '/');
	}

	// initialize form
	const form = await superValidate(zod(RegisterFormSchema));

	return { form };
};

export const actions: Actions = {
	default: async (event: any) => {
		const form = await superValidate(event, zod(RegisterFormSchema));

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
			return setError(form, 'Username is already taken');
		}

		if (password !== confirmPassword) {
			return setError(form, 'Password does not match');
		}

		const userId = generateId(15);
		const passwordHash = await new Argon2id().hash(password);

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
