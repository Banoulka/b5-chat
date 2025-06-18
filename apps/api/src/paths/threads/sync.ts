import z from 'zod';
import { messages, threads } from '../../db/schema';
import { ClientResponse } from '../../lib/ClientResponse';
import { auth } from '../../lib/middleware/auth';
import { route } from '../../lib/router/route';
import { getSession } from '../../service/auth';
import { db } from '../../service/db';

const schema = z.object({
	threads: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
			updatedAt: z.string(),
			createdAt: z.string(),
		}),
	),
	messages: z.array(
		z.object({
			id: z.string(),
			updatedAt: z.string(),
			createdAt: z.string(),
			content: z.string(),
			threadId: z.string(),
			model: z.string(),
			type: z.enum(['user', 'agent']),
			attachments: z.array(
				z.object({
					id: z.string(),
					name: z.string(),
					url: z.string(),
					key: z.string(),
				}),
			),
		}),
	),
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

			const localMessages = parsed.data.messages;

			await tx
				.insert(messages)
				.values(
					localMessages.map((m) => ({
						id: m.id,
						content: m.content,
						type: m.type,
						threadId: m.threadId,
						userId: session!.user.id,
						model: m.model,
						updatedAt: new Date(m.updatedAt),
						createdAt: new Date(m.createdAt),
					})),
				)
				.onConflictDoNothing();
		});

		return ClientResponse.json({ status: 'success' });
	},
	[auth],
);
