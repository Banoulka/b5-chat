import type { API_ThreadsResponse, APIThread } from '@b5-chat/common';
import { threads } from '../db/schema';
import { ClientResponse } from '../lib/ClientResponse';
import { auth } from '../lib/middleware/auth';
import { route } from '../lib/router/route';
import { db } from '../service/db';

export const GET = route(
	'/threads',
	async () => {
		const threads = await db.query.threads.findMany();
		return ClientResponse.json({
			data: threads.map((thread) => ({
				id: thread.id,
				name: thread.name,
				createdAt: thread.createdAt.toISOString(),
				updatedAt: thread.updatedAt.toISOString(),
			})),
			meta: {
				nextCursor: null,
				prevCursor: null,
				total: threads.length,
			},
		} satisfies API_ThreadsResponse);
	},
	[auth],
);

export const POST = route(
	'/threads',
	async () => {
		const thread = (
			await db
				.insert(threads)
				.values({
					name: '', // blank name to start with
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
