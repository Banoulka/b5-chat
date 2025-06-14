import { END_OF_TEXT_TOKEN, type API_ThreadMessagesResponse } from '@b5-chat/common';
import { resolve } from 'path';
import z from 'zod';
import { messages } from '../../db/schema';
import { ClientResponse } from '../../lib/ClientResponse';
import { route } from '../../lib/router/route';
import { getEmitter, getSessionContent } from '../../lib/stream';
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
		const json = await req.json();
		console.log('req.body', json);

		if (!session) return ClientResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const parsed = createMessageSchema.safeParse(json);

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

		// Kick off the stream in the background
		startTestStream(`thread-${req.params.threadId}`);

		return ClientResponse.json({
			data: message[0],
		});
	},
	[auth],
);

const startTestStream = async (id: string) => {
	const emitter = getEmitter(id);

	const onDone = async () => {
		console.log('Streaming finished for thread', id);

		// create a new agent message with the content of the stream
		const content = getSessionContent(id);
		if (!content) {
			console.error('No content found for session', id);
			return;
		}

		const idWithoutPrefix = id.replace('thread-', '');

		await db.insert(messages).values({
			content,
			threadId: idWithoutPrefix,
			type: 'agent',
		});

		emitter.removeEventListener('done', onDone);
	};
	emitter.addEventListener('done', onDone);

	const file = Bun.file(resolve(import.meta.dirname, '../../test-text-small-2.txt'));

	const fileText = await file.text();
	const chunkSize = 6;

	new ReadableStream({
		async start(controller) {
			console.log('starting readable stream');
			const totalChunks = Math.ceil(fileText.length / chunkSize);

			for (let i = 0; i < totalChunks; i++) {
				const delay = Math.random() * 450;
				await new Promise((resolve) => setTimeout(resolve, delay));

				const chunk = fileText.slice(i * chunkSize, (i + 1) * chunkSize);
				controller.enqueue(chunk);

				console.log(`dispatching event: ${i}`, chunk);
				// Emit event for each token
				emitter.dispatchEvent(
					new CustomEvent('token', {
						detail: {
							token: chunk,
							idx: i * chunkSize,
							done: false,
						},
					}),
				);
			}

			// Emit final done token event
			emitter.dispatchEvent(
				new CustomEvent('token', {
					detail: {
						token: END_OF_TEXT_TOKEN,
						idx: totalChunks,
						done: true,
					},
				}),
			);

			// Emit separate done event so external listeners can react when the stream is fully finished
			emitter.dispatchEvent(new Event('done'));

			controller.close();
		},
		async cancel() {
			console.log('cancel');
		},
	});
};
