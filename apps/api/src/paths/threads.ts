import type { API_ThreadsResponse, APIThread } from '@b5-chat/common';
import { desc } from 'drizzle-orm';
import { threads } from '../db/schema';
import { ClientResponse } from '../lib/ClientResponse';
import { auth } from '../lib/middleware/auth';
import { route } from '../lib/router/route';
import { db } from '../service/db';

export const GET = route(
	'/threads',
	async (req) => {
		const userThreads = await db.query.threads.findMany({
			where: (threads, { eq }) => eq(threads.userId, req.session!.user.id),
			orderBy: [desc(threads.updatedAt)],
		});
		return ClientResponse.json({
			data: userThreads.map((thread) => ({
				id: thread.id,
				name: thread.name,
				createdAt: thread.createdAt.toISOString(),
				updatedAt: thread.updatedAt.toISOString(),
			})),
			meta: {
				nextCursor: null,
				prevCursor: null,
				total: userThreads.length,
			},
		} satisfies API_ThreadsResponse);
	},
	[auth],
);

export const POST = route(
	'/threads',
	async (req) => {
		const thread = (
			await db
				.insert(threads)
				.values({
					name: '', // blank name to start with
					userId: req.session!.user.id,
				})
				.returning()
		)[0]!;

		return ClientResponse.json({
			...thread,
			createdAt: thread.createdAt.toISOString(),
			updatedAt: thread.updatedAt.toISOString(),
		} satisfies APIThread);
	},
	[auth],
);
