import { lucia } from '$lib/server/lucia';
import { fail, redirect } from '@sveltejs/kit';
import { Argon2id } from 'oslo/password';
import { TimeSpan, createDate } from 'oslo';
import { generateId } from 'lucia';
import { setError, superValidate } from 'sveltekit-superforms';
import { prisma } from '$lib/server/prisma';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
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

const ResetFormSchema = z.object({
	email: z.string().email()
});

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		redirect(303, '/');
	}

	await limiter.cookieLimiter?.preflight(event);

	// initialize form
	const form = await superValidate(zod(ResetFormSchema));

	return { form };
};

export const actions: Actions = {
	default: async (event: any) => {
		const form = await superValidate(event, zod(ResetFormSchema));

		// rate limiter: Every call to isLimited counts as a hit towards the rate limit for the event.
		if (await limiter.isLimited(event)) {
			return setError(form, 'You hit your rate limit. Try again later bud.');
		}

		const { email } = form.data;

		if (!form.valid) {
			// Again, return { form } and things will just work.
			return fail(400, { form });
		}

		// Check if the user exists by email
		const user = await prisma.user.findUnique({ where: { email } });
		if (!user) {
			return setError(form, 'No user found with that email.');
		}

		try {
			// optionally invalidate all existing tokens
			const tokenId = generateId(40);
			const tokenHash = await new Argon2id().hash(tokenId);
			await prisma.user.update({
				where: { email },
				data: { resetToken: tokenHash, expiresAt: createDate(new TimeSpan(1, 'h')) }
			});
		} catch (error) {
			console.error(error);
			return setError(form, 'Something went wrong. Try again later.');
		}

		// Execute both return and redirect asynchronously
		await Promise.all([
			{ form },
			redirect(303, '/') // Redirect to the desired page
		]);
	}
};
