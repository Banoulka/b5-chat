import { db } from '../../service/db';
import { BadRequestError } from '../ClientError';
import { getAgent } from './agent';
import { isSupportedModel } from './models';

const SYSTEM_PROMPT = `
You are a helpful assistant. A conversation is provided in the following format: <user>Example User Content</user><assistant>Example Assistant Content</assistant>. Responses can be in text or markdown format. 
`;

type RunAgentThreadParams = {
	model: string;
	threadId: string;
	userId: string;
};

export const runAgentForThread = async ({ model, threadId }: RunAgentThreadParams) => {
	if (!isSupportedModel(model)) throw new BadRequestError('Model not supported');

	const agent = getAgent(model);

	const conversation = await getConversation(threadId);

	const result = await agent.invoke([
		{
			role: 'system',
			content: SYSTEM_PROMPT,
		},
		{
			role: 'user',
			content: conversation,
		},
	]);

	return result;
};

// TODO: Merge conversations together manually or pass as array?
const getConversation = async (threadId: string) => {
	const threadMessages = await db.query.messages.findMany({
		where: ({ threadId: messagesThreadId }, { eq }) => eq(messagesThreadId, threadId),
	});

	// trim whitespace other special characters
	// remove empty messages
	// add markers for message types (user, assistant)
	const mappedMessages = threadMessages.map((message) => {
		const content = message.content.trim();
		if (!content) return null;

		const startMarker = message.type === 'user' ? '<user>' : '<assistant>';
		const endMarker = message.type === 'user' ? '</user>' : '</assistant>';

		// replace newlines with spaces, and trim whitespace
		const trimmedContent = content.replace(/^[\n\s]+|[\n\s]+$/g, '');

		return `${startMarker}${trimmedContent}${endMarker}`;
	});

	const filteredMessages = mappedMessages.filter((message) => message !== null);

	const conversation = filteredMessages.join('\n');

	return conversation;
};
