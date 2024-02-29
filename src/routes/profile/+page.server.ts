import { lucia } from '$lib/server/lucia';
import { prisma } from '$lib/server/prisma';
import { fail, redirect } from '@sveltejs/kit';
import { Argon2id } from 'oslo/password';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/');
	}

	// make sure it is the right user
	const existingUser = await prisma.user.findUnique({
		where: {
			id: locals.user.id
		}
	});
	if (!existingUser) {
		throw redirect(303, '/login');
	}

	return {
		user: locals.user
	};
};

export const actions: Actions = {
	updateUserData: async ({ request, locals }) => {
		const { user, session } = locals;
		if (!(user && session)) {
			// TODO:: throw message to on next screen
			throw redirect(303, '/login');
		}

		// get all the user input, or only one input at a time?
		const formData = await request.formData();
		const email = formData.get('email');
		const avatar = formData.get('avatar');

		// TODO:: More of a secruity thought: what if a user an email is used like 100 times?
		// Should put a limit on how many times an email can be used or how many accounts a machine can create

		const updatedUser = await prisma.user.update({
			where: {
				id: user.id
			},
			data: {
				// email: email,
				// avatar: avatar
			}
		});
	},

	uploadPic: async ({ request, locals }) => {
		const { user, session } = locals;
		if (!(user && session)) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		console.log('formData', formData);
		const avatar = formData.get('avatar');
	}
};
