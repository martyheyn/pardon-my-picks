import { prisma } from '$lib/server/prisma';
import { fail, redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { generateId } from 'lucia';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import {
	AWS_REGION,
	AWS_S3_BUCKET_NAME,
	AWS_ACCESS_KEY_ID,
	AWS_SECRET_ACCESS_KEY
} from '$env/static/private';

import type { Actions, PageServerLoad } from './$types';

const ProfileFormSchema = z.object({
	username: z.string().min(6),
	email: z.string().email()
});

// Create S3 client instance
const credentials = {
	accessKeyId: AWS_ACCESS_KEY_ID,
	secretAccessKey: AWS_SECRET_ACCESS_KEY
};
const s3Client = new S3Client({ region: AWS_REGION, credentials });

// Function to upload photo to S3
const uploadPhotoToS3 = async (photoFile: File, username: string) => {
	// reformat photoFile to be an ArrayBuffer
	const blob = new Blob([photoFile]);
	const arrayBuffer = await new Response(blob).arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	// Define parameters for uploading
	const params: {
		Bucket: string;
		Key: string;
		Body: any;
		ContentType: string;
	} = {
		Bucket: AWS_S3_BUCKET_NAME,
		Key: `${username}-${generateId(20)}`, // Key must be unique for each photo
		Body: buffer,
		ContentType: photoFile.type // Set the content type
	};

	// Create PutObjectCommand
	const command = new PutObjectCommand(params);

	// Upload photo to S3
	try {
		const data = await s3Client.send(command);
		console.log('Successfully uploaded photo:', data);
		const photoUrl = `https://${params.Bucket}.s3.${s3Client.config.region}.amazonaws.com/${params.Key}`; // Return the URL of the uploaded photo
		return params.Key;
	} catch (err) {
		console.error('Error uploading photo:', err);
	}
};

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/');
	}

	// make sure it is the right user
	const existingUser = await prisma.user.findUnique({
		where: {
			id: locals.user.id
		},
		include: {
			fade: true,
			tail: true,
			picks: true
		}
	});

	if (!existingUser) {
		redirect(303, '/login');
	}

	// initialize forms
	const form = await superValidate(zod(ProfileFormSchema));

	// get the statsssss
	const tails = existingUser.tail;
	const fades = existingUser.fade;

	return {
		user: locals.user,
		stats: {
			tails: {
				total: tails.length,
				wins: tails.filter((tail) => tail.winner).length,
				pushes: tails.filter((tail) => tail.push).length,
				losses: tails.length > 0 ? tails.filter((tail) => !tail.winner && !tail.push).length : 0
			},
			fades: {
				total: fades.length,
				wins: fades.filter((fade) => fade.winner).length,
				pushes: fades.filter((fade) => fade.push).length,
				losses: fades.length > 0 ? fades.filter((fade) => !fade.winner && !fade.push).length : 0
			}
		},
		picks: existingUser.picks,
		form
	};
};

export const actions: Actions = {
	updateUserData: async (event) => {
		const { user, session } = event.locals;
		if (!(user && session)) {
			// TODO:: throw message to on next screen
			redirect(303, '/login');
		}

		// get all the user input, or only one input at a time?
		const form = await superValidate(event, zod(ProfileFormSchema));
		const { username, email } = form.data;

		// get existing user data and see if values are different
		if (email === user.email && username === user.username) {
			return;
		}

		// check that email and username are unique
		if (username !== user.username) {
			const existingUser = await prisma.user.findUnique({
				where: {
					username: username
				}
			});

			if (existingUser) {
				return fail(400, {
					error: true,
					message: 'Username is already taken',
					uploadPic: false
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
				return fail(400, {
					error: true,
					message: 'Email is already taken',
					uploadPic: false
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
				username: username || user.username,
				email: email || user.email
			}
		});

		if (!updatedUser) {
			return fail(500, {
				error: true,
				message: 'Could not update user',
				uploadPic: false
			});
		}

		return {
			success: true,
			message: 'User data updated',
			uploadPic: false
		};
	},

	uploadPic: async (event) => {
		const { user, session } = event.locals;
		if (!(user && session)) {
			redirect(303, '/login');
		}

		const form = await event.request.formData();
		// const form = await superValidate(event, zod(ProfilePicFormSchema));
		const image = form.get('avatar') as File;

		// check if user already has a profile picture, if so delete it
		if (user.avatar) {
			const deleteParams = {
				Bucket: AWS_S3_BUCKET_NAME,
				Key: user.avatar
			};

			try {
				const data = await s3Client.send(new DeleteObjectCommand(deleteParams));
				console.log('Successfully deleted photo:', data);
			} catch (err) {
				console.error('Error deleting photo:', err);
				return {
					success: false,
					message: 'Error updating profile picture. Please try again later.'
				};
			}
		}

		const profPicKey = await uploadPhotoToS3(image, user.username);

		// store photo-key in database
		const updatedUser = await prisma.user.update({
			where: {
				id: user.id
			},
			data: {
				avatar: profPicKey
			}
		});

		if (!updatedUser) {
			return fail(500, {
				message: 'Could not update user',
				error: true,
				uploadPic: true
			});
		}

		// return saved breadcrumb
		return {
			success: true,
			message: 'Profile picture updated',
			avatar: profPicKey,
			uploadPic: true
		};
	}
};
