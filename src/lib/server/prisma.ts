// define prisma client
// SvelteKit hot reloads on all changes and we do want to create new Prisma Client on every reload
import { PrismaClient } from '@prisma/client';

const prisma = globalThis.prisma || new PrismaClient();

// if in development, set global.prisma to the newly created Prisma Client
if (process.env.NODE_ENV === 'development') globalThis.prisma = prisma;

export { prisma };
