import type { BaseMessageLike } from '@langchain/core/messages';
import { messages } from '../../db/schema';
import { db } from '../../service/db';
import { utApi } from '../../service/uploadthing';
import { deleteStreamSession, getEmitter, getStreamSessionContent } from '../stream';
import { getAgent } from './agent';
import { type ModelId } from './models';

const SYSTEM_PROMPT = `
You are a helpful assistant. Responses can be in text or markdown format. Try to keep responses short and concise.
`;

type RunAgentThreadParams = {
	model: ModelId;
	threadId: string;
	userId: string;
};

export const runAgentForThread = async ({ model, threadId, userId }: RunAgentThreadParams) => {
	const agent = getAgent(model);
	const conversation = await getConversationToInput(threadId);
	const streamId = `thread-${threadId}`;
	const emitter = getEmitter(streamId);

	// Set up the done handler to save the message
	const onDone = async () => {
		console.log('Streaming finished for thread', threadId);

		const content = getStreamSessionContent(streamId);
		if (!content) {
			console.error('No content found for session', streamId);
			return;
		}

		await db.insert(messages).values({
			content,
			threadId,
			type: 'agent',
			userId,
			model: model,
		});

		emitter.removeEventListener('done', onDone);
		deleteStreamSession(streamId);
	};

	emitter.addEventListener('done', onDone);

	const streamResponse = async () => {
		try {
			const stream = await agent.stream(conversation, { stream_options: { include_usage: true } });

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
