import type { API_ThreadMessagesResponse } from '@b5-chat/common';
import z from 'zod';
import { messages } from '../../db/schema';
import { ClientResponse } from '../../lib/ClientResponse';
import { route } from '../../lib/router/route';
import { auth } from '../../middleware/auth';
import { getSession } from '../../service/auth';
import { db } from '../../service/db';

export const GET = route(
	'/threads/:threadId/messages',
	async (req) => {
		const url = new URL(req.url);
		const limit = 20;

		const from = url.searchParams.get('from');

		const messagesResult = await db.query.messages.findMany({
			where: (messages, { and, eq, lt }) =>
				from
					? and(eq(messages.threadId, req.params.threadId), lt(messages.sortId, parseInt(from)))
					: eq(messages.threadId, req.params.threadId),
			orderBy: (messages, { desc }) => [desc(messages.sortId)],
			limit: limit + 1, // to figure out if we have a next or no,
		});

		const hasNext = messagesResult.length > limit;
		const sliced = messagesResult.slice(0, limit); // slice off the last one to check
		const nextCursor = hasNext ? (sliced[sliced.length - 1]?.sortId ?? null) : null;

		console.log('/messages', from, hasNext, nextCursor);

		return ClientResponse.json({
			data: sliced.map((message) => ({
				...message,
				createdAt: message.createdAt.toISOString(),
				updatedAt: message.updatedAt.toISOString(),
			})),
			meta: {
				nextCursor,
			},
		} satisfies API_ThreadMessagesResponse);
	},
	[auth],
);

const createMessageSchema = z.object({
	content: z.string().trim().min(1, 'Content is required'),
});

export const POST = route(
	'/threads/:threadId/messages',
	async (req) => {
		const session = await getSession(req);

		if (!session) return ClientResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const parsed = createMessageSchema.safeParse(req.body);

		if (!parsed.success)
			return ClientResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });

		// TODO: thread ownerships
		const thread = await db.query.threads.findFirst({
			where: (threads, { eq }) => eq(threads.id, req.params.threadId),
		});

		if (!thread) return ClientResponse.json({ errors: { threadId: ['Thread not found'] } }, { status: 404 });

		const message = await db
			.insert(messages)
			.values({
				content: parsed.data.content,
				threadId: req.params.threadId,
				type: 'user',
				userId: session.user.id,
			})
			.returning({
				id: messages.id,
				content: messages.content,
				type: messages.type,
				createdAt: messages.createdAt,
				updatedAt: messages.updatedAt,
				userId: messages.userId,
				threadId: messages.threadId,
			});

		return ClientResponse.json({
			data: message[0],
		});
	},
	[auth],
);
