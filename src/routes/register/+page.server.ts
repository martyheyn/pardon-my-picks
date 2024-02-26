import { lucia } from '$lib/server/lucia';
import { fail, redirect } from '@sveltejs/kit';
import { generateId } from 'lucia';
import { Argon2id } from 'oslo/password';

import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event: any) => {
		const formData = await event.request.formData();
		const username = formData.get('username');
		const password = formData.get('password');
		console.log('formData', formData);
		console.log('username', username);
		console.log('password', password);
	}
};
