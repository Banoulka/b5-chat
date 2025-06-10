import type { API_ThreadResponse } from '@b5-chat/common';
import { ClientResponse } from '../lib/ClientResponse';
import { auth } from '../middleware/auth';
import { route } from '../router';
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
		} satisfies API_ThreadResponse);
	},
	[auth],
);
