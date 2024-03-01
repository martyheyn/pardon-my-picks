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
		let email = formData.get('email');
		const username = formData.get('username');

		// get existing user data and see if values are different
		if (!email) email = 'null'; // convert to null if empty string for comparison compare

		if (email === user.email && username === user.username) {
			return {
				message: 'No changes were made'
			};
		}

		// check that email and username are unique
		if (username !== user.username) {
			const existingUser = await prisma.user.findUnique({
				where: {
					username: username?.toString()
				}
			});

			if (existingUser) {
				throw fail(400, {
					error: true,
					message: 'Username is already taken'
				});
			}
		}

		if (email !== user.email) {
			const existingEmail = await prisma.user.findUnique({
				where: {
					email: email?.toString()
				}
			});

			if (existingEmail) {
				throw fail(400, {
					error: true,
					message: 'Email is already taken'
				});
			}
		}

		// TODO:: More of a secruity thought: what if a user an email is used like 100 times?
		// Should put a limit on how many times an email can be used or how many accounts a machine can create

		const updatedUser = await prisma.user.update({
			where: {
				id: user.id
			},
			data: {
				username: username?.toString() || user.username,
				email: email?.toString() || user.email
			}
		});

		if (!updatedUser) {
			throw fail(500, {
				error: true,
				message: 'Could not update user'
			});
		}

		return {
			success: true,
			message: 'User data updated'
		};
	},

	uploadPic: async ({ request, locals }) => {
		const { user, session } = locals;
		if (!(user && session)) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const avatar = formData.get('avatar');

		// check that formData is an image file
		if (!avatar) {
			throw fail(400, {
				error: true,
				message: 'No file was uploaded'
			});
		}

		if ((avatar as File).type !== 'image/png' || (avatar as File).type !== 'image/jpeg') {
			throw fail(400, {
				error: true,
				message: 'File is not an image'
			});
		}

		// TODO:: check size to make sure it is not too big

		// save the file to the server
		const file = await (avatar as File).arrayBuffer();
		const fileBuffer = Buffer.from(file);

		const updatedUser = await prisma.user.update({
			where: {
				id: user.id
			},
			data: {
				// avatar: fileName
			}
		});

		if (!updatedUser) {
			throw fail(500, {
				error: true,
				message: 'Could not update user'
			});
		}

		// return saved breadcrumb
		return {
			avatar: 'test image'
		};
	}
};
