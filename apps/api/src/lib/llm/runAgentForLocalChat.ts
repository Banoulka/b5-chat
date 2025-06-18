import type { BaseMessageLike } from '@langchain/core/messages';
import { deleteStreamSession, getEmitter, setEmitterCancelEvent } from '../stream';
import { getAgent } from './agent';
import { type ModelId } from './models';

const SYSTEM_PROMPT = `
You are a helpful assistant. Responses can be in text or markdown format. Keep answers short and concise.
`.trim();

type RunAgentLocalChatParams = {
	model: ModelId;
	threadId: string;
	conversation: Array<{ role: 'user' | 'assistant'; content: string }>;
};

export const runAgentForLocalChat = async ({ model, threadId, conversation }: RunAgentLocalChatParams) => {
	const agent = getAgent(model, false); // No reasoning for local chat for now
	console.log(`[agent]: got agent for local thread: ${threadId} - ${agent.name}`);

	const prompt = buildConversationPrompt(conversation);
	console.log(`[agent]: built conversation for local thread: ${threadId}`);

	const streamId = `thread-${threadId}`;
	const emitter = getEmitter(streamId);
	console.log(`[agent]: got emitter for local thread: ${threadId}`);
	const abortController = new AbortController();

	// set up the done handler (no DB saving for local chat)
	const onDone = async () => {
		console.log(`[agent]: streaming finished for local thread: ${threadId}`);

		if (abortController.signal.aborted) {
			console.log(`[agent]: stream aborted for local thread: ${threadId}`);
			emitter.removeEventListener('done', onDone);
			deleteStreamSession(streamId);
			return;
		}

		emitter.removeEventListener('done', onDone);
		console.log(`[agent]: deleting stream session for local thread: ${threadId}`);
		deleteStreamSession(streamId);
	};

	emitter.addEventListener('done', onDone);

	const streamResponse = async () => {
		try {
			console.log(`[agent]: starting stream for local thread: ${threadId}`);
			const stream = await agent.stream(prompt, { signal: abortController.signal });

			console.log(`[agent]: set emitter cancel event for local thread: ${threadId}`);
			setEmitterCancelEvent(streamId, () => {
				console.log(`[agent]: aborting stream for local thread: ${threadId}`);
				abortController.abort();
			});

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

			console.log(`[agent]: streamResponse done emitting done event for local thread: ${threadId}`);
			emitter.dispatchEvent(new Event('done'));
		} catch (error) {
			console.error('Error in local agent streaming:', error);
			emitter.dispatchEvent(new Event('done'));
		}
	};

	// Run the stream in the background (non-blocking)
	streamResponse();

	return { success: true };
};

const buildConversationPrompt = (
	conversation: Array<{ role: 'user' | 'assistant'; content: string }>,
): BaseMessageLike[] => {
	const prompt: BaseMessageLike[] = [
		{
			role: 'system',
			content: SYSTEM_PROMPT,
		},
	];

	for (const message of conversation) {
		const content = message.content.trim();
		if (!content) continue;

		prompt.push({
			role: message.role,
			content,
		});
	}

	return prompt;
};
