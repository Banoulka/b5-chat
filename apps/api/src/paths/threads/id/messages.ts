import { type API_ThreadMessagesResponse } from '@b5-chat/common';
import { createMessageSchema } from '@b5-chat/common/schemas';
import { attachments, messages } from '../../../db/schema';
import { BadRequestError } from '../../../lib/ClientError';
import { ClientResponse } from '../../../lib/ClientResponse';
import { isSupportedModel } from '../../../lib/llm/models';
import { runAgentForThread } from '../../../lib/llm/runAgentForThread';
import { auth } from '../../../lib/middleware/auth';
import { route } from '../../../lib/router/route';
import { getSession } from '../../../service/auth';
import { db } from '../../../service/db';
import { utApi } from '../../../service/uploadthing';

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
			with: { attachments: true },
		});

		const hasNext = messagesResult.length > limit;
		const sliced = messagesResult.slice(0, limit); // slice off the last one to check
		const nextCursor = hasNext ? (sliced[sliced.length - 1]?.sortId ?? null) : null;

		const messagesWithUrls = await Promise.allSettled(
			sliced.map(async (message) => {
				const attachmentsWithUrls = await Promise.allSettled(
					message.attachments.map(async (attachment) => ({
						...attachment,
						url: (
							await utApi.generateSignedURL(attachment.key, {
								expiresIn: 60 * 5, // 5 minutes
							})
						).ufsUrl,
					})),
				);

				return {
					...message,
					createdAt: message.createdAt.toISOString(),
					updatedAt: message.updatedAt.toISOString(),
					attachments: attachmentsWithUrls
						.filter((attachment) => attachment.status === 'fulfilled')
						.map((attachment) => attachment.value),
				};
			}),
		);

		return ClientResponse.json({
			data: messagesWithUrls.filter((message) => message.status === 'fulfilled').map((message) => message.value),
			meta: {
				nextCursor,
			},
		} satisfies API_ThreadMessagesResponse);
	},
	[auth],
);

export const POST = route(
	'/threads/:threadId/messages',
	async (req) => {
		const session = await getSession(req);
		const json = await req.json();
		console.log('req.body', json);

		if (!session) return ClientResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const parsed = createMessageSchema.safeParse(json);

		if (!parsed.success)
			return ClientResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });

		const { modelId, content } = parsed.data;

		if (!isSupportedModel(modelId)) throw new BadRequestError('Model not supported');

		// TODO: thread ownerships
		const thread = await db.query.threads.findFirst({
			where: (threads, { eq }) => eq(threads.id, req.params.threadId),
		});

		if (!thread) return ClientResponse.json({ errors: { threadId: ['Thread not found'] } }, { status: 404 });

		const message = await db.transaction(async (tx) => {
			const message = (
				await tx
					.insert(messages)
					.values({
						content: content,
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
					})
			)[0]!;

			if (parsed.data.attachments && parsed.data.attachments.length > 0) {
				await tx.insert(attachments).values(
					parsed.data.attachments.map((attachment) => ({
						messageId: message.id,
						key: attachment.key,
						name: attachment.name,
					})),
				);
			}

			return message;
		});

		// Kick off the stream in the background
		// startTestStream(`thread-${req.params.threadId}`);
		runAgentForThread({
			model: modelId,
			threadId: req.params.threadId,
			userId: session.user.id,
		});

		return ClientResponse.json({
			data: message,
		});
	},
	[auth],
);
