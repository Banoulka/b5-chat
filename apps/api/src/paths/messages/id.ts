import type { API_ThreadMessagesResponse } from '@b5-chat/common';
import { ClientResponse } from '../../lib/ClientResponse';
import { route } from '../../lib/router/route';
import { auth } from '../../middleware/auth';
import { db } from '../../service/db';

export const GET = route(
	'/threads/:threadId/messages',
	async (req) => {
		const url = new URL(req.url);
		const limit = 10;

		// get cursor from query
		const cursor = url.searchParams.get('cursor') ?? null;

		const messages = await db.query.messages.findMany({
			where: (messages, { eq }) => eq(messages.threadId, req.params.threadId),
			orderBy: (messages, { desc }) => [desc(messages.createdAt)],
			limit: limit + 1, // 11 because we want to get the next cursor
			offset: cursor ? parseInt(cursor) : 0,
		});

		const hasNext = messages.length > limit;
		const hasPrev = cursor !== null;

		if (messages.length === 0) {
			return ClientResponse.json(
				{
					data: null,
				},
				{ status: 404 },
			);
		}

		return ClientResponse.json({
			data: messages.slice(0, limit).map((message) => ({
				...message,
				createdAt: message.createdAt.toISOString(),
				updatedAt: message.updatedAt.toISOString(),
			})),
			meta: {
				prevCursor: hasPrev ? (messages[0]?.createdAt.toISOString() ?? null) : null,
				nextCursor: hasNext ? (messages[messages.length - 1]?.createdAt.toISOString() ?? null) : null,
			},
		} satisfies API_ThreadMessagesResponse);
	},
	[auth],
);
