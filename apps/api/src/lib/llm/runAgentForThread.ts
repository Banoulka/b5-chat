import type { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import { messages } from '../../db/schema';
import { db } from '../../service/db';
import { deleteStreamSession, getEmitter, getStreamSessionContent } from '../stream';
import { getAgent } from './agent';
import { type ModelId } from './models';

const SYSTEM_PROMPT = `
You are a helpful assistant. A conversation is provided in the following format: Responses can be in text or markdown format.
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
		});

		emitter.removeEventListener('done', onDone);
		deleteStreamSession(streamId);
	};

	emitter.addEventListener('done', onDone);

	const streamResponse = async () => {
		try {
			const stream = await agent.stream(conversation);

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

// TODO: Merge conversations together manually or pass as array?
const getConversationToInput = async (threadId: string) => {
	const threadMessages = await db.query.messages.findMany({
		where: ({ threadId: messagesThreadId }, { eq }) => eq(messagesThreadId, threadId),
	});

	// trim whitespace other special characters
	// remove empty messages
	// add markers for message types (user, assistant)
	// const mappedMessages = threadMessages.map((message) => {
	// 	const content = message.content.trim();
	// 	if (!content) return null;

	// 	const startMarker = message.type === 'user' ? '<user>' : '<assistant>';
	// 	const endMarker = message.type === 'user' ? '</user>' : '</assistant>';

	// 	// replace newlines with spaces, and trim whitespace
	// 	const trimmedContent = content.replace(/^[\n\s]+|[\n\s]+$/g, '');

	// 	return `${startMarker}${trimmedContent}${endMarker}`;
	// });

	// const filteredMessages = mappedMessages.filter((message) => message !== null);

	// const conversation = filteredMessages.join('\n');

	return [
		{
			role: 'system',
			content: SYSTEM_PROMPT,
		},
		...threadMessages.map((message) => ({
			role: message.type === 'user' ? 'user' : 'assistant',
			content: message.content,
		})),
	] satisfies BaseLanguageModelInput;
};
