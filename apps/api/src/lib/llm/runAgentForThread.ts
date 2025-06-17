import type { BaseMessageLike } from '@langchain/core/messages';
import { messages } from '../../db/schema';
import { db } from '../../service/db';
import { utApi } from '../../service/uploadthing';
import { deleteStreamSession, getEmitter, getStreamSessionContent, setEmitterCancelEvent } from '../stream';
import { getAgent } from './agent';
import { type ModelId } from './models';

const SYSTEM_PROMPT = `
You are a helpful assistant. Responses can be in text or markdown format. Keep answers short and concise.
`.trim();

type RunAgentThreadParams = {
	model: ModelId;
	threadId: string;
	userId: string;
	webSearch?: boolean;
	reasoning?: boolean;
};

export const runAgentForThread = async ({ model, threadId, userId, reasoning }: RunAgentThreadParams) => {
	const agent = getAgent(model, reasoning ?? false);
	console.log(`[agent]: got agent for thread: ${threadId} - ${agent.name}`);
	const conversation = await getConversationToInput(threadId);
	console.log(`[agent]: got conversation for thread: ${threadId}`);

	const streamId = `thread-${threadId}`;
	const emitter = getEmitter(streamId);
	console.log(`[agent]: got emitter for thread: ${threadId}`);

	// Set up the done handler to save the message
	const onDone = async () => {
		console.log(`[agent]: streaming finished for thread: ${threadId}`);

		const content = getStreamSessionContent(streamId);
		if (!content) {
			console.error(`[agent]: no content found for session: ${streamId}`);
			return;
		}

		console.log(`[agent]: saving message for thread: ${threadId}`);
		await db.insert(messages).values({
			content,
			threadId,
			type: 'agent',
			userId,
			model: model,
		});

		console.log(`[agent]: removing done listener for thread: ${threadId}`);
		emitter.removeEventListener('done', onDone);
		console.log(`[agent]: deleting stream session for thread: ${threadId}`);
		deleteStreamSession(streamId);
	};

	emitter.addEventListener('done', onDone);

	const streamResponse = async () => {
		try {
			console.log(`[agent]: starting stream for thread: ${threadId}`);
			const stream = await agent.stream(conversation);

			console.log(`[agent]: set emitter cancel event for thread: ${threadId}`);
			setEmitterCancelEvent(streamId, () => stream.cancel());

			let tokenIndex = 0;

			for await (const chunk of stream) {
				const token = chunk.content || '';

				if (token) {
					emitter.dispatchEvent(
						new CustomEvent('token', {
							detail: {
								token,
								idx: tokenIndex,
								done: false,
							},
						}),
					);
					tokenIndex += token.length;
				}
			}

			// Emit done event
			console.log(`[agent]: streamResponse done emitting done event for thread: ${threadId}`);
			emitter.dispatchEvent(new Event('done'));
		} catch (error) {
			console.error('Error in agent streaming:', error);
			emitter.dispatchEvent(new Event('done'));
		}
	};

	// Run the stream in the background (non-blocking)
	streamResponse();

	return { success: true };
};

const getConversationToInput = async (threadId: string) => {
	const threadMessages = await db.query.messages.findMany({
		where: ({ threadId: messagesThreadId }, { eq }) => eq(messagesThreadId, threadId),
	});

	const prompt: BaseMessageLike[] = [
		{
			role: 'system',
			content: SYSTEM_PROMPT,
		},
	];

	for (let i = 0; i < threadMessages.length; i++) {
		const message = threadMessages[i]!;

		const content = message.content.trim();
		if (!content) continue;

		prompt.push({
			role: message.type === 'user' ? 'user' : 'assistant',
			content,
		});

		const isLastMessage = i === threadMessages.length - 1;

		// Only add images to the last message (to save tokens?)
		if (!isLastMessage) continue;
		if (message.type !== 'user') continue;

		const attachments = await db.query.attachments.findMany({
			where: ({ messageId }, { eq }) => eq(messageId, message.id),
		});

		if (attachments.length === 0) continue;

		const urls = await Promise.all(
			attachments.map(async (attachment) => {
				const url = await utApi.generateSignedURL(attachment.key, {
					expiresIn: 60 * 5, // 5 minutes
				});
				return url.ufsUrl;
			}),
		);

		urls.forEach((url) =>
			prompt.push({
				role: 'user',
				content: [
					{
						type: 'image_url',
						image_url: { url, detail: 'low' },
					},
				],
			}),
		);
	}

	return prompt;
};
