import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { threads } from '../../db/schema';
import { ClientResponse } from '../../lib/ClientResponse';
import { auth } from '../../lib/middleware/auth';
import { route } from '../../lib/router/route';
import { db } from '../../service/db';

const patchThreadSchema = z.object({
	name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
});

export const PATCH = route(
	'/threads/:threadId',
	async (req) => {
		const json = await req.json();
		const parsed = patchThreadSchema.safeParse(json);

		if (!parsed.success) {
			return ClientResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
		}

		const thread = await db.query.threads.findFirst({
			where: (threads, { eq, and }) =>
				and(eq(threads.id, req.params.threadId), eq(threads.userId, req.session!.user.id)),
		});

		if (!thread) {
			return ClientResponse.json({ error: 'Thread not found' }, { status: 404 });
		}

		const updatedThread = (
			await db
				.update(threads)
				.set({
					name: parsed.data.name,
					updatedAt: new Date(),
				})
				.where(eq(threads.id, req.params.threadId))
				.returning()
		)[0];

		if (!updatedThread) {
			return ClientResponse.json({ error: 'Failed to update thread' }, { status: 500 });
		}

		return ClientResponse.json({
			...updatedThread,
			createdAt: updatedThread.createdAt.toISOString(),
			updatedAt: updatedThread.updatedAt.toISOString(),
		});
	},
	[auth],
);

export const OPTIONS = route('/threads/:threadId', async (req) => {
	return new ClientResponse(null, {
		status: 200,
	});
});
