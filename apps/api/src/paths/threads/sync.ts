import z from 'zod';
import { messages, threads } from '../../db/schema';
import { ClientResponse } from '../../lib/ClientResponse';
import { auth } from '../../lib/middleware/auth';
import { route } from '../../lib/router/route';
import { getSession } from '../../service/auth';
import { db } from '../../service/db';

const messageSchema = z.object({
	id: z.string(),
	updatedAt: z.string(),
	createdAt: z.string(),
	content: z.string(),
	model: z.string().nullable(),
	type: z.enum(['user', 'agent']),
	attachments: z
		.array(
			z.object({
				id: z.string(),
				name: z.string(),
				url: z.string(),
				key: z.string(),
			}),
		)
		.optional(),
});

const threadSchema = z.object({
	id: z.string(),
	name: z.string(),
	updatedAt: z.string(),
	createdAt: z.string(),
	messages: z.array(messageSchema),
});

const schema = z.object({
	threads: z.array(threadSchema),
});

export const POST = route(
	'/threads/sync',
	async (req) => {
		const body = await req.json();
		const session = await getSession(req)!;

		const parsed = schema.safeParse(body);

		if (!parsed.success) {
			return ClientResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
		}

		const { threads: localThreads } = parsed.data;

		await db.transaction(async (tx) => {
			await tx
				.insert(threads)
				.values(
					localThreads.map((t) => ({
						id: t.id,
						name: t.name,
						userId: session!.user.id,
						updatedAt: new Date(t.updatedAt),
						createdAt: new Date(t.createdAt),
					})),
				)
				.onConflictDoNothing();

			const allMessages = localThreads.flatMap((thread) =>
				thread.messages.map((message) => ({
					id: message.id,
					content: message.content,
					type: message.type,
					threadId: thread.id,
					userId: session!.user.id,
					model: message.model,
					updatedAt: new Date(message.updatedAt),
					createdAt: new Date(message.createdAt),
				})),
			);

			if (allMessages.length > 0) {
				await tx.insert(messages).values(allMessages).onConflictDoNothing();
			}
		});

		return ClientResponse.json({ status: 'success' });
	},
	[auth],
);
