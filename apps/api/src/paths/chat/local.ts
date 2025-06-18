import { createMessageSchema } from '@b5-chat/common/schemas';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { BadRequestError } from '../../lib/ClientError';
import { ClientResponse } from '../../lib/ClientResponse';
import { isSupportedModel } from '../../lib/llm/models';
import { runAgentForLocalChat } from '../../lib/llm/runAgentForLocalChat';
import { route } from '../../lib/router/route';

const localChatSchema = createMessageSchema.extend({
	threadId: z.string().optional(),
	history: z
		.array(
			z.object({
				role: z.enum(['user', 'assistant']),
				content: z.string(),
			}),
		)
		.optional(),
});

export const POST = route('/chat/local', async (req) => {
	const json = await req.json();
	const parsed = localChatSchema.safeParse(json);

	if (!parsed.success) return ClientResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });

	const { modelId, content, history = [], threadId } = parsed.data;

	if (!isSupportedModel(modelId)) throw new BadRequestError('Model not supported');

	// use existing thread ID or generate a new one
	const localThreadId = threadId || `local-${uuidv4()}`;

	// build conversation including history + new message
	const conversation = [...(history || []), { role: 'user' as const, content }];

	// start streaming the response
	runAgentForLocalChat({
		model: modelId,
		threadId: localThreadId,
		conversation,
	});

	return ClientResponse.json({
		threadId: localThreadId,
		message: 'Chat started',
	});
});
