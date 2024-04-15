import type { Actions, PageServerLoad } from './$types';
import { generateId } from 'lucia';
import { prisma } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import { Prisma } from '@prisma/client';

export const load: PageServerLoad = async ({ params, locals }) => {};
